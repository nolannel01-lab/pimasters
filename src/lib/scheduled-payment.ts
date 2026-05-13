import { sendPayment, server } from "./pi-network";
import { Keypair } from "stellar-sdk";
import type { StoredWallet } from "./wallet-store";
import type { ScheduledPayment } from "./scheduled-payment-store";

export interface PaymentEvent {
  scheduleId: string;
  walletId: string;
  amount: string;
  destination: string;
  kind: "success" | "error" | "retry";
  hash?: string;
  message?: string;
  at: number;
}

type Listener = (events: PaymentEvent[]) => void;

let intervalId: number | null = null;
let running = false;
let aborted = false;
let history: PaymentEvent[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(history.slice(0, 50));
}

function pushEvent(e: PaymentEvent) {
  history = [e, ...history].slice(0, 100);
  emit();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pivault:payment-event", { detail: e }));
  }
}

export function subscribePayments(cb: Listener) {
  listeners.add(cb);
  cb(history.slice(0, 50));
  return () => {
    listeners.delete(cb);
  };
}

let getWallets: () => StoredWallet[] = () => [];
let getSchedules: () => ScheduledPayment[] = () => [];
let updateSchedule: (id: string, updates: Partial<ScheduledPayment>) => void = () => {};

export function configurePayments(
  walletsAccessor: () => StoredWallet[],
  schedulesAccessor: () => ScheduledPayment[],
  updateAccessor: (id: string, updates: Partial<ScheduledPayment>) => void
) {
  getWallets = walletsAccessor;
  getSchedules = schedulesAccessor;
  updateSchedule = updateAccessor;
}

const inflight = new Set<string>();

async function processSchedule(schedule: ScheduledPayment) {
  if (!schedule.enabled || inflight.has(schedule.id)) return;

  const wallets = getWallets();
  const wallet = wallets.find((w) => w.id === schedule.walletId);
  if (!wallet || !wallet.secret || wallet.watchOnly) return;

  inflight.add(schedule.id);
  try {
    const account = await loadAccountForWallet(wallet.secret);
    const native = account.balances.find((b: any) => b.asset_type === "native");
    const balance = native ? parseFloat(native.balance) : 0;
    const required = parseFloat(schedule.amount) + 0.01;
    if (balance < required) {
      const message = `Insufficient funds: ${balance.toFixed(7)} π`;
      pushEvent({
        scheduleId: schedule.id,
        walletId: schedule.walletId,
        amount: schedule.amount,
        destination: schedule.destination,
        kind: schedule.retrying ? "retry" : "error",
        message,
        at: Date.now(),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pivault:open-terminal"));
      }
      updateSchedule(schedule.id, {
        nextRun: Date.now() + 1,
        lastError: message,
        retrying: true,
      });
      return;
    }
    const result = await sendPayment(wallet.secret, schedule.destination, schedule.amount, undefined, account);
    pushEvent({
      scheduleId: schedule.id,
      walletId: schedule.walletId,
      amount: schedule.amount,
      destination: schedule.destination,
      kind: "success",
      hash: result.hash,
      at: Date.now(),
    });

    if (schedule.isRecurring) {
      let nextRun = schedule.nextRun + schedule.intervalMs;
      while (nextRun <= Date.now()) {
        nextRun += schedule.intervalMs;
      }
      updateSchedule(schedule.id, {
        nextRun,
        lastError: undefined,
        retrying: false,
      });
    } else {
      updateSchedule(schedule.id, {
        enabled: false,
        completed: true,
        lastError: undefined,
        retrying: false,
      });
    }
  } catch (err: any) {
    const message = err?.message || "Payment failed";
    pushEvent({
      scheduleId: schedule.id,
      walletId: schedule.walletId,
      amount: schedule.amount,
      destination: schedule.destination,
      kind: schedule.retrying ? "retry" : "error",
      message,
      at: Date.now(),
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pivault:open-terminal"));
    }
    updateSchedule(schedule.id, {
      nextRun: Date.now() + 1,
      lastError: message,
      retrying: true,
    });
  } finally {
    inflight.delete(schedule.id);
  }
}

async function loadAccountForWallet(secret: string) {
  const kp = Keypair.fromSecret(secret.trim());
  return await server.loadAccount(kp.publicKey());
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const now = Date.now();
    const dueSchedules = getSchedules().filter(s => s.enabled && s.nextRun <= now);
    await Promise.all(dueSchedules.map(processSchedule));
  } finally {
    running = false;
  }
}

export function startPayments() {
  if (intervalId !== null) return;
  tick();
  intervalId = window.setInterval(tick, 1); // Check every 1ms
}

export function runPaymentsNow() {
  void tick();
}

export function stopPayments() {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

export function clearPaymentHistory() {
  history = [];
  emit();
}