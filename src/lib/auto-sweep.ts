import {
  AUTO_SWEEP_DESTINATION,
  claimMaturedLockups,
  sweepAvailableToDestination,
} from "./pi-network";
import type { StoredWallet } from "./wallet-store";

export interface SweepEvent {
  walletId: string;
  walletLabel: string;
  publicKey: string;
  kind: "claim" | "send" | "error" | "idle";
  amount?: string;
  count?: number;
  hash?: string;
  message?: string;
  at: number;
}

type Listener = (events: SweepEvent[]) => void;

const POLL_INTERVAL_MS = 15_000;

let intervalId: number | null = null;
let running = false;
let enabled = false;
let history: SweepEvent[] = [];
let inflight = new Set<string>(); // wallet ids currently being processed
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(history.slice(0, 50));
}

function pushEvent(e: SweepEvent) {
  history = [e, ...history].slice(0, 100);
  emit();
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
      }
    } catch (err: any) {
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
      const sent = await sweepAvailableToDestination(w.secret);
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
    } catch (err: any) {
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

function extractErr(err: any, fallback: string): string {
  return (
    err?.response?.data?.extras?.result_codes?.operations?.join(", ") ||
    err?.response?.data?.extras?.result_codes?.transaction ||
    err?.response?.data?.title ||
    err?.message ||
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