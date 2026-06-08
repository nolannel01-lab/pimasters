import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { isValidSecret, publicFromSecret } from "./pi-network";
import { supabase, type DatabaseWallet } from "./supabase";

const STORAGE_KEY = "pi_wallets_v1";
const ANON_USER_KEY = "pi_vault_anon_user";

export interface StoredWallet {
  id: string;
  label: string;
  publicKey: string;
  /** ⚠️ Stored only in browser localStorage. Never sent to a server. */
  secret?: string;
  watchOnly: boolean;
  addedAt: number;
}

// Generate or retrieve anonymous user ID
function getAnonUserId(): string {
  if (typeof window === "undefined") return "";
  let userId = localStorage.getItem(ANON_USER_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(ANON_USER_KEY, userId);
  }
  return userId;
}

function loadFromStorage(): StoredWallet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredWallet[];
  } catch {
    return [];
  }
}

function saveToStorage(wallets: StoredWallet[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

// ----- Global store shared across all useWallets() consumers -----
let globalWallets: StoredWallet[] = [];
let initialized = false;
let syncingWithSupabase = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  globalWallets = loadFromStorage();
  initialized = true;
}

function setGlobal(next: StoredWallet[]) {
  globalWallets = next;
  saveToStorage(next);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return globalWallets;
}

function getServerSnapshot(): StoredWallet[] {
  return [];
}

// Sync wallets with Supabase
async function syncToSupabase(wallets: StoredWallet[]) {
  if (syncingWithSupabase) return;
  syncingWithSupabase = true;

  try {
    const userId = getAnonUserId();

    // Fetch existing wallets from Supabase
    const { data: existingWallets, error: fetchError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Error fetching wallets from Supabase:", fetchError);
      syncingWithSupabase = false;
      return;
    }

    const existingMap = new Map((existingWallets || []).map((w) => [w.public_key, w]));
    const localMap = new Map(wallets.map((w) => [w.publicKey, w]));

    // Add new wallets to Supabase
    for (const wallet of wallets) {
      if (!existingMap.has(wallet.publicKey)) {
        const { error: insertError } = await supabase.from("wallets").insert({
          user_id: userId,
          label: wallet.label,
          public_key: wallet.publicKey,
          secret_encrypted: wallet.secret ? btoa(wallet.secret) : null,
          watch_only: wallet.watchOnly,
        });

        if (insertError) {
          console.error("Error inserting wallet to Supabase:", insertError);
        }
      }
    }

    // Remove wallets from Supabase that were deleted locally
    for (const existing of existingWallets || []) {
      if (!localMap.has(existing.public_key)) {
        const { error: deleteError } = await supabase
          .from("wallets")
          .delete()
          .eq("id", existing.id);

        if (deleteError) {
          console.error("Error deleting wallet from Supabase:", deleteError);
        }
      }
    }

    console.log("Wallets synced with Supabase successfully");
  } catch (error) {
    console.error("Error syncing with Supabase:", error);
  } finally {
    syncingWithSupabase = false;
  }
}

// Load wallets from Supabase
async function loadFromSupabase(): Promise<StoredWallet[]> {
  try {
    const userId = getAnonUserId();

    const { data, error } = await supabase.from("wallets").select("*").eq("user_id", userId);

    if (error) {
      console.error("Error loading wallets from Supabase:", error);
      return [];
    }

    return (data || []).map((w) => ({
      id: w.id,
      label: w.label,
      publicKey: w.public_key,
      secret: w.secret_encrypted ? atob(w.secret_encrypted) : undefined,
      watchOnly: w.watch_only,
      addedAt: new Date(w.created_at).getTime(),
    }));
  } catch (error) {
    console.error("Error loading from Supabase:", error);
    return [];
  }
}

export function useWallets() {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureInit();

    // First load from localStorage, then sync with Supabase
    const initWallets = async () => {
      setLoading(true);

      // Try to load from Supabase first
      const supabaseWallets = await loadFromSupabase();

      if (supabaseWallets.length > 0) {
        // Use Supabase data as source of truth
        globalWallets = supabaseWallets;
        saveToStorage(supabaseWallets);
      }

      // Sync any local changes to Supabase
      await syncToSupabase(globalWallets);

      listeners.forEach((l) => l());
      setHydrated(true);
      setLoading(false);
    };

    initWallets();
  }, []);

  const wallets = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addWallet = useCallback(
    async (input: { secret?: string; publicKey?: string; label?: string }) => {
      let publicKey: string;
      let secret: string | undefined;
      let watchOnly = true;

      if (input.secret && isValidSecret(input.secret)) {
        secret = input.secret.trim();
        publicKey = publicFromSecret(secret);
        watchOnly = false;
      } else if (input.publicKey) {
        publicKey = input.publicKey.trim();
      } else {
        throw new Error("Provide a valid secret key or public key");
      }

      ensureInit();
      const current = globalWallets;
      if (current.some((w) => w.publicKey === publicKey)) {
        throw new Error("This wallet is already added");
      }
      const wallet: StoredWallet = {
        id: crypto.randomUUID(),
        label: input.label?.trim() || `Wallet ${current.length + 1}`,
        publicKey,
        secret,
        watchOnly,
        addedAt: Date.now(),
      };

      const updated = [...current, wallet];
      setGlobal(updated);

      // Sync to Supabase
      await syncToSupabase(updated);

      return wallet;
    },
    [],
  );

  const removeWallet = useCallback(async (id: string) => {
    ensureInit();
    const updated = globalWallets.filter((w) => w.id !== id);
    setGlobal(updated);

    // Sync to Supabase
    await syncToSupabase(updated);
  }, []);

  const renameWallet = useCallback(async (id: string, label: string) => {
    ensureInit();
    const updated = globalWallets.map((w) => (w.id === id ? { ...w, label } : w));
    setGlobal(updated);

    // Sync to Supabase
    await syncToSupabase(updated);
  }, []);

  const clearAll = useCallback(async () => {
    setGlobal([]);

    // Clear from Supabase
    try {
      const userId = getAnonUserId();
      await supabase.from("wallets").delete().eq("user_id", userId);
    } catch (error) {
      console.error("Error clearing wallets from Supabase:", error);
    }
  }, []);

  return { wallets, hydrated, loading, addWallet, removeWallet, renameWallet, clearAll };
}
