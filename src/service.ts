import { useEffect, useState } from "react";
export interface State {
  user: { id: number; name: string; email: string } | null;
  stock: Record<string, number>;
  favorites: string[];
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(
    "/api/" + path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "Request failed.");
  return value;
}
export function useLoad<T>(path: string) {
  const [value, setValue] = useState<T>(),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) { setValue(undefined); setRevision(n => n + 1); }
    };
    window.addEventListener("pageshow", restore);
    setError("");
    api<T>(path)
      .then((v) => {
        if (active) setValue(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
      window.removeEventListener("pageshow", restore);
    };
  }, [path, revision]);
  return { value, error, reload: () => setRevision((n) => n + 1) };
}
export function useAction() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, message, setMessage };
}
