"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadCatalogFileClient } from "@/lib/catalog-upload-client";
import { logCatalogUploadAction } from "@/app/admin/catalogo/actions";

export function CatalogUploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setMessage({ ok: false, text: "Selecciona el archivo del catálogo." });
    setMessage(null);
    startTransition(async () => {
      try {
        const { count } = await uploadCatalogFileClient(file);
        await logCatalogUploadAction(count);
        setMessage({ ok: true, text: `✓ Catálogo actualizado — ${count} productos.` });
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } catch (err) {
        setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudo subir el catálogo." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Archivo de SICAR X (Excel)
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="mt-1.5 block w-full max-w-xs rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.82rem] text-admin-ink"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Subiendo…" : "Subir y reemplazar catálogo"}
      </button>
      {message && <p className={`w-full text-[0.82rem] font-semibold ${message.ok ? "text-admin-ok-text" : "text-admin-bad-text"}`}>{message.text}</p>}
    </form>
  );
}
