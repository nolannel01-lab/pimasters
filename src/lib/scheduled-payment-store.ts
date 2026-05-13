import { useEffect, useState, useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "pi_scheduled_payments_v1";

export interface ScheduledPayment {
  id: string;
  walletId: string;
  amount: string; // amount to send
  startTime: number; // specific timestamp to start
  isRecurring: boolean; // if true, repeat every intervalMs after startTime
  intervalMs: number; // for recurring schedules
  nextRun: number; // calculated next run time
  enabled: boolean;
  destination: string; // the address to send to
  lastError?: string;
  retrying: boolean; // if currently retrying a failed tx
  completed: boolean; // for one-time schedules
}

let globalSchedules: ScheduledPayment[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    globalSchedules = JSON.parse(raw);
  }
  initialized = true;
}

function setGlobal(next: ScheduledPayment[]) {
  globalSchedules = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return globalSchedules;
}

function getServerSnapshot(): ScheduledPayment[] {
  return [];
}

export function useScheduledPayments() {
  ensureInit();

  const schedules = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addSchedule = useCallback((schedule: Omit<ScheduledPayment, "id" | "nextRun" | "lastError" | "retrying" | "completed">) => {
    const newSchedule: ScheduledPayment = {
      ...schedule,
      id: crypto.randomUUID(),
      nextRun: schedule.startTime,
      lastError: undefined,
      retrying: false,
      completed: false,
    };
    setGlobal([...globalSchedules, newSchedule]);
  }, []);

  const updateSchedule = useCallback((id: string, updates: Partial<ScheduledPayment>) => {
    setGlobal(globalSchedules.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeSchedule = useCallback((id: string) => {
    setGlobal(globalSchedules.filter(s => s.id !== id));
  }, []);

  const enableSchedule = useCallback((id: string) => {
    const schedule = globalSchedules.find(s => s.id === id);
    if (!schedule) return;
    const now = Date.now();
    let nextRun = schedule.startTime;
    if (schedule.isRecurring && schedule.startTime < now) {
      const elapsed = now - schedule.startTime;
      const cycles = Math.floor(elapsed / schedule.intervalMs);
      nextRun = schedule.startTime + (cycles + 1) * schedule.intervalMs;
    }
    updateSchedule(id, { enabled: true, nextRun });
  }, [updateSchedule]);

  const disableSchedule = useCallback((id: string) => {
    updateSchedule(id, { enabled: false, retrying: false });
  }, [updateSchedule]);

  return {
    schedules,
    addSchedule,
    updateSchedule,
    removeSchedule,
    enableSchedule,
    disableSchedule,
  };
}