import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Play, Pause, Trash2 } from "lucide-react";
import { useScheduledPayments } from "@/lib/scheduled-payment-store";
import { useWallets } from "@/lib/wallet-store";
import { getSweepDestination } from "@/lib/auto-sweep";

export function ScheduledPaymentsDialog() {
  const { wallets } = useWallets();
  const { schedules, addSchedule, enableSchedule, disableSchedule, removeSchedule } =
    useScheduledPayments();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [startTime, setStartTime] = useState("");
  const [seconds, setSeconds] = useState("00");
  const [milliseconds, setMilliseconds] = useState("000");
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState({ value: "", unit: "seconds" });
  const [selectedWallet, setSelectedWallet] = useState("");

  const calculateIntervalMs = (value: string, unit: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    switch (unit) {
      case "milliseconds":
        return num;
      case "seconds":
        return num * 1000;
      case "minutes":
        return num * 60 * 1000;
      case "hours":
        return num * 60 * 60 * 1000;
      default:
        return 0;
    }
  };

  const handleAdd = () => {
    if (!amount || !startTime || !selectedWallet) return;
    const baseTimestamp = new Date(startTime).getTime();
    if (isNaN(baseTimestamp)) return;

    // Add seconds and milliseconds to the timestamp
    const sec = parseInt(seconds) || 0;
    const ms = parseInt(milliseconds) || 0;
    const startTimestamp = baseTimestamp + sec * 1000 + ms;
    if (startTimestamp <= Date.now()) return;

    let intervalMs = 0;
    if (isRecurring) {
      intervalMs = calculateIntervalMs(interval.value, interval.unit);
      if (intervalMs <= 0) return;
    }

    addSchedule({
      walletId: selectedWallet,
      amount,
      startTime: startTimestamp,
      isRecurring,
      intervalMs,
      enabled: true,
      destination: getSweepDestination(),
    });

    setAmount("");
    setStartTime("");
    setSeconds("00");
    setMilliseconds("000");
    setIsRecurring(false);
    setInterval({ value: "", unit: "seconds" });
    setSelectedWallet("");
  };

  const formatInterval = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const getCountdown = (nextRun: number) => {
    const diff = nextRun - Date.now();
    if (diff <= 0) return "Due";
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
    if (diff < 3600000) return `${(diff / 60000).toFixed(1)}m`;
    return `${(diff / 3600000).toFixed(1)}h`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="mr-2 h-4 w-4" />
          Scheduled Payments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scheduled Payments</DialogTitle>
          <DialogDescription>
            Schedule automatic payments to {getSweepDestination().slice(0, 8)}... at specified
            intervals. Failed transactions retry every 1ms until successful.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new schedule */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Add New Schedule</h3>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="wallet">Wallet</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets
                      .filter((w) => !w.watchOnly && w.secret)
                      .map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.label} ({wallet.publicKey.slice(0, 8)}...)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount (π)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0000000"
                />
              </div>

              <div>
                <Label htmlFor="startTime">Start Date & Time (with Seconds)</Label>
                <div className="flex gap-2">
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value.padStart(2, "0"))}
                    placeholder="00"
                    title="Seconds (0-59)"
                    className="w-16 text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    value={milliseconds}
                    onChange={(e) => setMilliseconds(e.target.value.padStart(3, "0"))}
                    placeholder="000"
                    title="Milliseconds (0-999)"
                    className="w-16 text-center"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Format: seconds (0-59) + milliseconds (0-999)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <Label htmlFor="recurring">Recurring</Label>
              </div>

              {isRecurring && (
                <div>
                  <Label>Interval</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={interval.value}
                      onChange={(e) => setInterval((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder="1"
                      className="flex-1"
                    />
                    <Select
                      value={interval.unit}
                      onValueChange={(unit) => setInterval((prev) => ({ ...prev, unit }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milliseconds">ms</SelectItem>
                        <SelectItem value="seconds">seconds</SelectItem>
                        <SelectItem value="minutes">minutes</SelectItem>
                        <SelectItem value="hours">hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAdd}
                disabled={
                  !amount || !startTime || !selectedWallet || (isRecurring && !interval.value)
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Schedule
              </Button>
            </div>
          </div>

          {/* Existing schedules */}
          <div className="space-y-2">
            <h3 className="font-medium">Active Schedules ({schedules.length})</h3>
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scheduled payments yet.</p>
            ) : (
              schedules.map((schedule) => {
                const wallet = wallets.find((w) => w.id === schedule.walletId);
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={schedule.enabled ? "default" : "secondary"}>
                        {schedule.completed
                          ? "Completed"
                          : schedule.enabled
                            ? "Active"
                            : "Inactive"}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {wallet?.label || "Unknown"} → {schedule.amount} π
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.isRecurring
                            ? `Every ${formatInterval(schedule.intervalMs)}`
                            : "One-time"}
                          {schedule.enabled &&
                            !schedule.completed &&
                            ` · Next: ${getCountdown(schedule.nextRun)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Start: {new Date(schedule.startTime).toLocaleString()} (
                          {schedule.startTime % 1000}ms)
                        </p>
                        {schedule.lastError && (
                          <p className="text-xs text-destructive">{schedule.lastError}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!schedule.completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            schedule.enabled
                              ? disableSchedule(schedule.id)
                              : enableSchedule(schedule.id)
                          }
                        >
                          {schedule.enabled ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeSchedule(schedule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
