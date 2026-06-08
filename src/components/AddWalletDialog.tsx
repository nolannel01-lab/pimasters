import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Plus, Eye, KeyRound } from "lucide-react";
import { isValidPublicKey, isValidSecret } from "@/lib/pi-network";
import { useWallets } from "@/lib/wallet-store";
import { toast } from "sonner";

export function AddWalletDialog() {
  const { addWallet } = useWallets();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"watch" | "secret">("watch");
  const [label, setLabel] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [secret, setSecret] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  function reset() {
    setLabel("");
    setPublicKey("");
    setSecret("");
    setAcknowledged(false);
    setTab("watch");
  }

  function handleAdd() {
    try {
      if (tab === "watch") {
        if (!isValidPublicKey(publicKey)) {
          toast.error("Invalid public key (must start with G)");
          return;
        }
        addWallet({ publicKey, label });
      } else {
        if (!isValidSecret(secret)) {
          toast.error("Invalid secret key (must start with S)");
          return;
        }
        if (!acknowledged) {
          toast.error("Please acknowledge the security warning");
          return;
        }
        addWallet({ secret, label });
      }
      toast.success("Wallet added");
      setOpen(false);
      reset();
    } catch (e: any) {
      toast.error(e.message || "Failed to add wallet");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="hero" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a Pi wallet</DialogTitle>
          <DialogDescription>
            Track multiple wallets. Choose watch-only for safety, or import a secret key to enable
            sending.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="watch">
              <Eye className="mr-2 h-4 w-4" /> Watch-only
            </TabsTrigger>
            <TabsTrigger value="secret">
              <KeyRound className="mr-2 h-4 w-4" /> Import secret
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                placeholder="e.g. Main wallet"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <TabsContent value="watch" className="m-0 space-y-2">
              <Label htmlFor="pk">Public key</Label>
              <Input
                id="pk"
                placeholder="G..."
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Safe — only reads the balance. Cannot send transactions.
              </p>
            </TabsContent>

            <TabsContent value="secret" className="m-0 space-y-3">
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Security warning</AlertTitle>
                <AlertDescription>
                  Your secret key gives full control of your funds. It will be stored in this
                  browser's localStorage <strong>only</strong> and never sent to any server. Anyone
                  with access to this device can spend your Pi.
                </AlertDescription>
              </Alert>
              <Label htmlFor="sk">Secret key</Label>
              <Input
                id="sk"
                type="password"
                placeholder="S..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="font-mono text-xs"
              />
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I understand the risk. I trust this device and browser to hold my secret key.
                </span>
              </label>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} variant="hero">
            Add wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
