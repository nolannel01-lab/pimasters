import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  RefreshCw,
  Send,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
} from "lucide-react";
import { fetchWalletBalance, formatPi, shortKey, type WalletBalance } from "@/lib/pi-network";
import type { StoredWallet } from "@/lib/wallet-store";
import { useWallets } from "@/lib/wallet-store";
import { SendDialog } from "./SendDialog";
import { TransactionsDialog } from "./TransactionsDialog";
import { toast } from "sonner";

interface Props {
  wallet: StoredWallet;
  onBalanceUpdate?: (publicKey: string, available: number, locked: number) => void;
}

function formatUnlock(date: Date | null): { label: string; unlocked: boolean } {
  if (!date) return { label: "No unlock date", unlocked: false };
  const now = Date.now();
  if (date.getTime() <= now) return { label: "Claimable now", unlocked: true };
  return {
    label: date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    unlocked: false,
  };
}

function timeUntil(date: Date): string {
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return "now";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  if (d > 0) return `in ${d}d ${h}h`;
  const m = Math.floor((ms % 3600000) / 60000);
  return `in ${h}h ${m}m`;
}

export function WalletCard({ wallet, onBalanceUpdate }: Props) {
  const { removeWallet } = useWallets();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const b = await fetchWalletBalance(wallet.publicKey);
      setBalance(b);
      onBalanceUpdate?.(
        wallet.publicKey,
        parseFloat(b.available) || 0,
        parseFloat(b.totalLocked) || 0
      );
      // Emit balance check event
      window.dispatchEvent(new CustomEvent("pivault:balance-check", {
        detail: {
          walletId: wallet.id,
          available: parseFloat(b.available) || 0,
          locked: parseFloat(b.totalLocked) || 0,
        }
      }));
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, wallet.id, onBalanceUpdate]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    const onRefreshAll = () => refresh();
    window.addEventListener("pivault:refresh-all", onRefreshAll);
    return () => {
      clearInterval(id);
      window.removeEventListener("pivault:refresh-all", onRefreshAll);
    };
  }, [refresh]);

  function copyAddress() {
    navigator.clipboard.writeText(wallet.publicKey);
    toast.success("Address copied");
  }

  function copySecret() {
    if (!wallet.secret) return;
    navigator.clipboard.writeText(wallet.secret);
    toast.success("Secret key copied", {
      description: "Treat it like a password — anyone with it can spend your Pi.",
    });
  }

  function handleRemove() {
    if (
      confirm(
        `Remove ${wallet.label}? ${
          wallet.secret ? "Its secret key will be deleted from this browser." : ""
        }`
      )
    ) {
      removeWallet(wallet.id);
      toast.success("Wallet removed");
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card shadow-[var(--shadow-elegant)]">
        <CardHeader className="space-y-3 border-b border-border/60 bg-[image:var(--gradient-primary)]/5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold">{wallet.label}</h3>
                {wallet.watchOnly ? (
                  <Badge variant="secondary" className="gap-1">
                    <Eye className="h-3 w-3" /> Watch-only
                  </Badge>
                ) : (
                  <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/20">
                    <KeyRound className="h-3 w-3" /> Signer
                  </Badge>
                )}
              </div>
              <button
                onClick={copyAddress}
                className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {shortKey(wallet.publicKey)} <Copy className="h-3 w-3" />
              </button>
              {wallet.secret && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-warning">
                    Secret
                  </span>
                  <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs text-foreground/80">
                    {showSecret ? wallet.secret : "S••••••••••••••••••••••••••••"}
                  </code>
                  <button
                    onClick={() => setShowSecret((v) => !v)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    title={showSecret ? "Hide secret" : "Show secret"}
                  >
                    {showSecret ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={copySecret}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    title="Copy secret key"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleRemove}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-5">
          {balance?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {balance.error}
            </p>
          )}

          {/* Available balance */}
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Available
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-3xl font-bold tabular-nums text-transparent">
                {balance ? formatPi(balance.available) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">π</span>
            </div>
            {balance && parseFloat(balance.reserved) > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Reserved by network: {formatPi(balance.reserved)} π
              </p>
            )}
          </div>

          {/* Locked balance */}
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-warning" />
                Locked
              </div>
              {balance && balance.locked.length > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {balance.locked.length} lockup{balance.locked.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-foreground/90">
                {balance ? formatPi(balance.totalLocked) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">π</span>
            </div>

            {balance && balance.locked.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                {balance.locked.slice(0, 6).map((l) => {
                  const u = formatUnlock(l.unlockDate);
                  return (
                    <li
                      key={l.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-mono tabular-nums text-foreground/90">
                        {formatPi(l.amount)} π
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          u.unlocked ? "text-success" : "text-muted-foreground"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {u.label}
                        {!u.unlocked && l.unlockDate && (
                          <span className="text-muted-foreground/70">
                            ({timeUntil(l.unlockDate)})
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
                {balance.locked.length > 6 && (
                  <li className="text-xs text-muted-foreground">
                    +{balance.locked.length - 6} more lockup(s)
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="hero"
              className="flex-1"
              disabled={wallet.watchOnly || !balance?.exists}
              onClick={() => setSendOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" /> Send Pi
            </Button>
            <Button variant="outline" onClick={() => setTxOpen(true)}>
              <History className="mr-2 h-4 w-4" /> Transactions
            </Button>
            <a
              href={`https://api.mainnet.minepi.com/accounts/${wallet.publicKey}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Horizon <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {!wallet.watchOnly && (
        <SendDialog
          wallet={wallet}
          available={balance?.available || "0"}
          open={sendOpen}
          onOpenChange={setSendOpen}
          onSent={refresh}
        />
      )}
      <TransactionsDialog wallet={wallet} open={txOpen} onOpenChange={setTxOpen} />
    </>
  );
}