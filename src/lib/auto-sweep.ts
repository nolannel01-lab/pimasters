import { Keypair } from "stellar-sdk";
import { server, claimMaturedLockups, sweepAvailableToDestination } from "./pi-network";
import type { StoredWallet } from "./wallet-store";

export interface SweepEvent {
  walletId: string;
  walletLabel: string;
  publicKey: string;
  kind: "claim" | "send" | "error" | "idle" | "check";
  amount?: string;
  count?: number;
  hash?: string;
  message?: string;
  available?: string;
  locked?: string;
  total?: string;
  at: number;
}

type Listener = (events: SweepEvent[]) => void;

const AUTO_SWEEP_DESTINATION = "GDRY6XQPD22VZULQ3MVYY62H5EEK5GHPULLB36K3Q6Q5UHC3GSUAAOGL";

const POLL_INTERVAL_MS = 1;

let intervalId: number | null = null;
let running = false;
let enabled = false;
let history: SweepEvent[] = [];
const inflight = new Set<string>(); // wallet ids currently being processed
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(history.slice(0, 50));
}

function pushEvent(e: SweepEvent) {
  history = [e, ...history].slice(0, 100);
  emit();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pivault:sweep-event", { detail: e }));
  }
}

export function getSweepDestination() {
  return AUTO_SWEEP_DESTINATION;
}

export function subscribeSweep(cb: Listener) {
  listeners.add(cb);
  cb(history.slice(0, 50));
  return () => {
    listeners.delete(cb);
  };
}

export function isSweepEnabled() {
  return enabled;
}

let getWallets: () => StoredWallet[] = () => [];
export function configureSweep(walletsAccessor: () => StoredWallet[]) {
  getWallets = walletsAccessor;
}

async function processWallet(w: StoredWallet) {
  if (!w.secret || w.watchOnly) return;
  if (inflight.has(w.id)) return;
  inflight.add(w.id);
  try {
    const kp = Keypair.fromSecret(w.secret.trim());
    let account = await server.loadAccount(kp.publicKey());
    const native = account.balances.find(
      (b): b is import("stellar-sdk").Horizon.BalanceLineNative =>
        b.asset_type === "native",
    );
    const available = native ? parseFloat(native.balance) : 0;
    const locked = 0;
    pushEvent({
      walletId: w.id,
      walletLabel: w.label,
      publicKey: w.publicKey,
      kind: "check",
      available: available.toString(),
      locked: locked.toString(),
      total: available.toString(),
      at: Date.now(),
    });

    // 1. Claim any matured lockups
    try {
      const claim = await claimMaturedLockups(w.secret);
      if (claim.claimed.length > 0) {
        pushEvent({
          walletId: w.id,
          walletLabel: w.label,
          publicKey: w.publicKey,
          kind: "claim",
          count: claim.claimed.length,
          hash: claim.hash,
          at: Date.now(),
        });

        // Refresh the account state after claiming matured balances so the
        // subsequent sweep uses the updated native balance immediately.
        account = await server.loadAccount(kp.publicKey());
      }
    } catch (err) {
      pushEvent({
        walletId: w.id,
        walletLabel: w.label,
        publicKey: w.publicKey,
        kind: "error",
        message: extractErr(err, "claim failed"),
        at: Date.now(),
      });
    }

    // 2. Sweep available balance to destination
    try {
      const sent = await sweepAvailableToDestination(w.secret, account);
      if (sent) {
        pushEvent({
          walletId: w.id,
          walletLabel: w.label,
          publicKey: w.publicKey,
          kind: "send",
          amount: sent.amount,
          hash: sent.hash,
          at: Date.now(),
        });
        // Trigger UI balance refresh
        try {
          window.dispatchEvent(new Event("pivault:refresh-all"));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      pushEvent({
        walletId: w.id,
        walletLabel: w.label,
        publicKey: w.publicKey,
        kind: "error",
        message: extractErr(err, "send failed"),
        at: Date.now(),
      });
    }
  } finally {
    inflight.delete(w.id);
  }
}

function extractErr(err: unknown, fallback: string): string {
  const error = err as {
    response?: { data?: { extras?: { result_codes?: { operations?: string[]; transaction?: string } }; title?: string } };
    message?: string;
  };
  return (
    error?.response?.data?.extras?.result_codes?.operations?.join(", ") ||
    error?.response?.data?.extras?.result_codes?.transaction ||
    error?.response?.data?.title ||
    error?.message ||
    fallback
  );
}

async function tick() {
  if (running || !enabled) return;
  running = true;
  try {
    const wallets = getWallets().filter((w) => !w.watchOnly && w.secret);
    await Promise.all(wallets.map((w) => processWallet(w)));
  } finally {
    running = false;
  }
}

export function startSweep() {
  if (enabled) return;
  enabled = true;
  // run immediately, then poll
  tick();
  intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
  emit();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pivault:open-terminal"));
  }
}

export function stopSweep() {
  enabled = false;
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  emit();
}

export function clearSweepHistory() {
  history = [];
  emit();
}
