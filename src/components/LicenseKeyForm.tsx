"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LicenseKeyForm() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/membership/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo verificar la clave.");
      setState("success");
      setMessage("¡Listo! Tu membresía está activa.");
      router.refresh();
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md">
      <label htmlFor="license" className="mb-2 block font-ui text-xs uppercase tracking-wide text-gold-dim">
        Clave de licencia (la recibiste por email de Gumroad)
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="license"
          required
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
          className="focus-ring flex-1 rounded-full border border-gold/40 bg-transparent px-5 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="focus-ring shrink-0 rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
        >
          {state === "loading" ? "Verificando…" : "Verificar"}
        </button>
      </div>
      {message && (
        <p className={`mt-3 font-ui text-sm ${state === "error" ? "text-wine-bright" : "text-gold"}`}>{message}</p>
      )}
    </form>
  );
}
