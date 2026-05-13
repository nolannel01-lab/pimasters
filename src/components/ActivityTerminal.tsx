import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SweepEvent } from "@/lib/auto-sweep";
import type { PaymentEvent } from "@/lib/scheduled-payment";
import { useWallets } from "@/lib/wallet-store";
import { useScheduledPayments } from "@/lib/scheduled-payment-store";
import { formatPi, shortKey } from "@/lib/pi-network";

type ActivityEvent = SweepEvent | PaymentEvent;

export function ActivityTerminal() {
  const { wallets } = useWallets();
  const { schedules } = useScheduledPayments();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [countdownTrigger, setCountdownTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTrigger(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleSweepEvent = (event: Event) => {
      const sweepEvent = (event as CustomEvent).detail as SweepEvent;
      setEvents(prev => [...prev, sweepEvent].slice(-100));
      setIsOpen(true);
    };

    const handlePaymentEvent = (event: Event) => {
      const paymentEvent = (event as CustomEvent).detail as PaymentEvent;
      setEvents(prev => [...prev, paymentEvent].slice(-100));
      setIsOpen(true);
    };

    const handleOpenTerminal = () => {
      setIsOpen(true);
    };

    window.addEventListener("pivault:sweep-event", handleSweepEvent as EventListener);
    window.addEventListener("pivault:payment-event", handlePaymentEvent as EventListener);
    window.addEventListener("pivault:open-terminal", handleOpenTerminal);

    return () => {
      window.removeEventListener("pivault:sweep-event", handleSweepEvent as EventListener);
      window.removeEventListener("pivault:payment-event", handlePaymentEvent as EventListener);
      window.removeEventListener("pivault:open-terminal", handleOpenTerminal);
    };
  }, []);

  const formatEvent = (event: ActivityEvent) => {
    const time = new Date(event.at).toLocaleTimeString();
    const wallet = wallets.find(w => w.id === event.walletId);

    if (event.kind === "check") {
      return {
        time,
        icon: "📊",
        message: `${event.walletLabel}: Balance check - Available: ${formatPi(event.available || "0")}π, Locked: ${formatPi(event.locked || "0")}π, Total: ${formatPi(event.total || "0")}π`,
        type: "check"
      };
    }

    if ("scheduleId" in event) {
      // Payment event
      return {
        time,
        icon: event.kind === "success" ? "✅" : event.kind === "error" ? "❌" : "🔄",
        message: `${wallet?.label || "Unknown"}: ${event.kind === "success" ? "Payment sent" : event.kind === "error" ? "Payment failed" : "Retrying payment"} - ${formatPi(event.amount)}π to ${shortKey(event.destination)}`,
        type: event.kind
      };
    }

    // Sweep event
    return {
      time,
      icon: event.kind === "claim" ? "🔓" : event.kind === "send" ? "🚀" : "⚠️",
      message: `${event.walletLabel}: ${event.kind === "claim" ? `Claimed ${event.count} lockup${event.count! > 1 ? "s" : ""}` : event.kind === "send" ? `Auto-sweep sent ${formatPi(event.amount || "0")}π` : `Error: ${event.message}`}`,
      type: event.kind
    };
  };

  const getCountdown = (nextRun: number) => {
    const diff = nextRun - Date.now();
    if (diff <= 0) return "Due";
    if (diff < 1000) return `${Math.floor(diff)}ms`;
    if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
    if (diff < 3600000) return `${(diff / 60000).toFixed(1)}m`;
    return `${(diff / 3600000).toFixed(1)}h`;
  };

  const recentEvents = events.slice(-100); // Keep last 100 events

  const upcomingSchedules = schedules
    .filter(s => s.enabled && !s.completed)
    .sort((a, b) => a.nextRun - b.nextRun)
    .slice(0, 5);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 p-0"
          size="sm"
        >
          <Terminal className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="font-medium">Activity Terminal</span>
          <Badge variant="secondary">{recentEvents.length} events</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex">
        <ScrollArea className="h-64 flex-1">
          <div className="p-2 space-y-1 font-mono text-xs">
            <div className="font-bold text-primary mb-2">Activity Log</div>
            {recentEvents.length === 0 ? (
              <div className="text-muted-foreground">No activity yet...</div>
            ) : (
              recentEvents.map((event, i) => {
                const formatted = formatEvent(event);
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-[60px]">{formatted.time}</span>
                    <span>{formatted.icon}</span>
                    <span className={`flex-1 ${
                      formatted.type === "error" ? "text-destructive" :
                      formatted.type === "success" ? "text-green-600" :
                      formatted.type === "check" ? "text-blue-600" :
                      "text-foreground"
                    }`}>
                      {formatted.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="w-64 border-l border-border p-2">
          <div className="font-bold text-primary mb-2">Upcoming Schedules</div>
          <div className="space-y-2">
            {upcomingSchedules.length === 0 ? (
              <div className="text-muted-foreground text-xs">No upcoming schedules</div>
            ) : (
              upcomingSchedules.map(schedule => {
                const wallet = wallets.find(w => w.id === schedule.walletId);
                return (
                  <div key={schedule.id} className="text-xs border rounded p-2">
                    <div className="font-medium">{wallet?.label || "Unknown"}</div>
                    <div>{schedule.amount} π → {shortKey(schedule.destination)}</div>
                    <div className="text-primary font-bold">{getCountdown(schedule.nextRun)}</div>
                    <div className="text-muted-foreground">
                      {schedule.isRecurring ? "Recurring" : "One-time"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}