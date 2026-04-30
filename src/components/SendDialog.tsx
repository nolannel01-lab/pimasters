import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Send, Loader2, ExternalLink } from "lucide-react";
import { isValidPublicKey, sendPi, shortKey } from "@/lib/pi-network";
import type { StoredWallet } from "@/lib/wallet-store";
import { toast } from "sonner";

interface Props {
  wallet: StoredWallet;
  available: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}

export function SendDialog({ wallet, available, open, onOpenChange, onSent }: Props) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hash, setHash] = useState<string | null>(null);

  function reset() {
    setDestination("");
    setAmount("");
    setMemo("");
    setConfirm(false);
    setHash(null);
  }

  async function handleSend() {
    if (!wallet.secret) {
      toast.error("This is a watch-only wallet — secret key required to send.");
      return;
    }
    if (!isValidPublicKey(destination)) {
      toast.error("Invalid destination address");
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt > parseFloat(available)) {
      toast.error("Amount exceeds available balance");
      return;
    }
    if (!confirm) {
      toast.error("Please confirm the transaction");
      return;
    }
    setSubmitting(true);
    try {
      const res = await sendPi({
        secret: wallet.secret,
        destination: destination.trim(),
        amount: amt.toFixed(7),
        memo: memo || undefined,
      });
      setHash(res.hash);
      toast.success("Transaction submitted to Pi Mainnet");
      onSent?.();
    } catch (e: any) {
      const msg =
        e?.response?.data?.extras?.result_codes?.operations?.join(", ") ||
        e?.response?.data?.title ||
        e?.message ||
        "Transaction failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Pi</DialogTitle>
          <DialogDescription>
            From {wallet.label} ({shortKey(wallet.publicKey)}) — available {available} π
          </DialogDescription>
        </DialogHeader>

        {hash ? (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTitle>Transaction submitted</AlertTitle>
              <AlertDescription className="break-all font-mono text-xs">
                {hash}
              </AlertDescription>
            </Alert>
            <a
              href={`https://api.mainnet.minepi.com/transactions/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View on Horizon <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Irreversible action</AlertTitle>
              <AlertDescription>
                Pi blockchain transactions cannot be reversed. Double-check the destination
                address.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="dest">Destination address</Label>
              <Input
                id="dest"
                placeholder="G..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (π)</Label>
              <Input
                id="amount"
                type="number"
                step="0.0000001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setAmount(available)}
                className="text-xs text-primary hover:underline"
              >
                Use max ({available})
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">Memo (optional, max 28 chars)</Label>
              <Input
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value.slice(0, 28))}
                maxLength={28}
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I confirm I want to send{" "}
                <strong className="text-foreground">{amount || "0"} π</strong> to{" "}
                <strong className="font-mono text-foreground">
                  {destination ? shortKey(destination) : "—"}
                </strong>
                .
              </span>
            </label>
          </div>
        )}

        <DialogFooter>
          {hash ? (
            <Button onClick={() => onOpenChange(false)} variant="hero">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={submitting} variant="hero">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}