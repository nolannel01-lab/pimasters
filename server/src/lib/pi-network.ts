// filepath: server/src/lib/pi-network.ts
import {
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
  Horizon,
} from "@stellar/stellar-sdk";

// Pi Mainnet Horizon endpoint
export const PI_HORIZON_URL = "https://api.mainnet.minepi.com";
export const PI_NETWORK_PASSPHRASE = "Pi Network";

const server = new Horizon.Server(PI_HORIZON_URL, { allowHttp: false });

export interface LockedBalance {
  amount: string;
  unlockDate: Date | null;
  sponsor?: string;
  id: string;
}

export interface WalletBalance {
  publicKey: string;
  available: string;
  locked: LockedBalance[];
  totalLocked: string;
  reserved: string;
  exists: boolean;
  error?: string;
}

export interface TransactionRecord {
  id: string;
  hash: string;
  amount: string;
  type: "incoming" | "outgoing";
  status: "pending" | "confirmed" | "failed";
  counterparty: string;
  createdAt: Date;
}

export interface PaymentResult {
  hash: string;
  success: boolean;
  ledger?: number;
}

/** Get wallet balance from Pi Network */
export async function getWalletBalance(publicKey: string): Promise<WalletBalance> {
  try {
    const account = await server.loadAccount(publicKey);
    
    let available = "0";
    const locked: LockedBalance[] = [];
    let totalLocked = "0";
    let reserved = "0";
    
    // Parse balances
    for (const balance of account.balances) {
      if (balance.asset_type === "native") {
        if (balance.is_authorized) {
          available = balance.balance || "0";
        }
        // Locked balances would be in sponsorships
        if (balance.sponsor) {
          locked.push({
            amount: balance.balance || "0",
            unlockDate: null, // Would need to query sponsorship details
            sponsor: balance.sponsor,
            id: balance.balance || "",
          });
          totalLocked = (parseFloat(totalLocked) + parseFloat(balance.balance || "0")).toString();
        }
      }
    }
    
    // Calculate reserves (base + num subentries)
    const numSubentries = account.subentry_count;
    const baseReserve = 0.5; // XLM
    const reservePerEntry = 0.5;
    reserved = (baseReserve + numSubentries * reservePerEntry).toString();
    
    return {
      publicKey,
      available,
      locked,
      totalLocked,
      reserved,
      exists: true,
    };
  } catch (err) {
    if (String(err).includes("404")) {
      return {
        publicKey,
        available: "0",
        locked: [],
        totalLocked: "0",
        reserved: "0",
        exists: false,
      };
    }
    throw err;
  }
}

/** Get transactions for a wallet */
export async function getTransactions(publicKey: string): Promise<TransactionRecord[]> {
  try {
    const payments = await server
      .payments()
      .forAccount(publicKey)
      .limit(50)
      .call();
    
    const transactions: TransactionRecord[] = [];
    
    for (const payment of payments.records) {
      const isIncoming = payment.to === publicKey;
      transactions.push({
        id: payment.id,
        hash: payment.transaction_hash,
        amount: payment.amount,
        type: isIncoming ? "incoming" : "outgoing",
        status: payment.transaction_successful ? "confirmed" : "pending",
        counterparty: isIncoming ? payment.from : payment.to,
        createdAt: new Date(payment.created_at),
      });
    }
    
    return transactions;
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return [];
  }
}

/** Send a payment */
export async function sendPayment(
  secret: string,
  destination: string,
  amount: string,
  memo?: string
): Promise<PaymentResult> {
  try {
    const sourceKeypair = Keypair.fromSecret(secret);
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
    
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase: PI_NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount,
        })
      )
      .addOperation(Operation.manageData({
        name: "pivault",
        value: "true",
      }));
    
    if (memo) {
      transaction.addMemo(Memo.text(memo));
    }
    
    const builtTx = transaction.setTimeout(300).build();
    builtTx.sign(sourceKeypair);
    
    const result = await server.submitTransaction(builtTx);
    
    return {
      hash: result.hash,
      success: true,
      ledger: result.ledger,
    };
  } catch (err) {
    console.error("Payment error:", err);
    throw err;
  }
}

/** Validate a secret key */
export function isValidSecret(secret: string): boolean {
  try {
    Keypair.fromSecret(secret.trim());
    return true;
  } catch {
    return false;
  }
}

/** Validate a public key */
export function isValidPublicKey(publicKey: string): boolean {
  try {
    Keypair.fromPublicKey(publicKey.trim());
    return true;
  } catch {
    return false;
  }
}

/** Derive public key from secret */
export function publicFromSecret(secret: string): string {
  return Keypair.fromSecret(secret.trim()).publicKey();
}