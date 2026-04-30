import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  Loader2,
  Repeat,
  Lock,
  Unlock,
} from "lucide-react";
import {
  fetchWalletTransactions,
  formatPi,
  shortKey,
  type PiTransaction,
} from "@/lib/pi-network";
import type { StoredWallet } from "@/lib/wallet-store";

interface Props {
  wallet: StoredWallet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionsDialog({ wallet, open, onOpenChange }: Props) {
  const [txs, setTxs] = useState<PiTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchWalletTransactions(wallet.publicKey, 50);
      setTxs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wallet.publicKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Transactions</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={load}
              disabled={loading}
              className="h-8"
            >
              <RefreshCw
                className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </DialogTitle>
          <DialogDescription>
            {wallet.label} · {shortKey(wallet.publicKey)} — successful in/out
            payments only
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && txs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : txs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No completed transactions found.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {txs.map((t) => {
                const Icon =
                  t.direction === "in"
                    ? ArrowDownLeft
                    : t.direction === "out"
                      ? ArrowUpRight
                      : t.direction === "lock"
                        ? Lock
                        : t.direction === "unlock"
                          ? Unlock
                          : Repeat;
                const tone =
                  t.direction === "in"
                    ? "text-success"
                    : t.direction === "out"
                      ? "text-warning"
                      : t.direction === "lock"
                        ? "text-warning"
                        : t.direction === "unlock"
                          ? "text-success"
                          : "text-muted-foreground";
                const label =
                  t.direction === "in"
                    ? "Received"
                    : t.direction === "out"
                      ? "Sent"
                      : t.direction === "lock"
                        ? "Locked"
                        : t.direction === "unlock"
                          ? "Unlocked"
                          : "Self";
                const sign =
                  t.direction === "in" || t.direction === "unlock"
                    ? "+"
                    : t.direction === "out" || t.direction === "lock"
                      ? "−"
                      : "";
                const counterpartyPrefix =
                  t.direction === "in"
                    ? "from "
                    : t.direction === "out"
                      ? "to "
                      : t.direction === "lock"
                        ? "for "
                        : t.direction === "unlock"
                          ? "claimed from "
                          : "";
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/60 ${tone}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">
                          {label}
                        </span>
                        {t.type !== "payment" && (
                          <Badge variant="outline" className="text-[10px]">
                            {t.type.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      {t.counterparty && (
                        <div className="truncate font-mono text-xs text-muted-foreground">
                          {counterpartyPrefix}
                          {shortKey(t.counterparty)}
                        </div>
                      )}
                      {t.memo && (
                        <div className="truncate text-xs text-muted-foreground">
                          memo: {t.memo}
                        </div>
                      )}
                      <div className="text-[11px] text-muted-foreground/80">
                        {t.createdAt.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-semibold tabular-nums ${tone}`}
                      >
                        {sign}
                        {formatPi(t.amount)} {t.asset === "Pi" ? "π" : t.asset}
                      </div>
                      <a
                        href={`https://api.mainnet.minepi.com/transactions/${t.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        view <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}