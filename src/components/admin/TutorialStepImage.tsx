"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function TutorialStepImage({
  image,
  imageDesktop,
  imageDesktopHeight,
  imageAlt,
}: {
  image?: string;
  imageDesktop?: string;
  imageDesktopHeight?: number;
  imageAlt?: string;
}) {
  const [zoomed, setZoomed] = useState<string | null>(null);

  useEffect(() => {
    if (!zoomed) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomed]);

  return (
    <>
      {image && (
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setZoomed(image)}
            aria-label="Ampliar captura"
            className="block max-w-[260px] cursor-zoom-in rounded-2xl border border-admin-border bg-admin-bg p-2 shadow-sm transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            <Image src={image} alt={imageAlt ?? ""} width={420} height={860} className="w-full rounded-xl" />
          </button>
          <span className="mt-1 block text-[0.74rem] text-admin-ink-soft">Toca la imagen para ampliarla</span>
        </div>
      )}

      {imageDesktop && (
        <div className="hidden sm:block">
          <button
            type="button"
            onClick={() => setZoomed(imageDesktop)}
            aria-label="Ampliar captura"
            className="block max-w-[520px] cursor-zoom-in rounded-2xl border border-admin-border bg-admin-bg p-2 shadow-sm transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            <Image src={imageDesktop} alt={imageAlt ?? ""} width={1440} height={imageDesktopHeight ?? 900} className="w-full rounded-xl" />
          </button>
          <span className="mt-1 block text-[0.74rem] text-admin-ink-soft">Toca la imagen para ampliarla</span>
        </div>
      )}

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Captura ampliada"
          onClick={() => setZoomed(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/75 p-4 sm:p-10"
        >
          <div className="relative h-full w-full max-w-[1100px]" onClick={(e) => e.stopPropagation()}>
            <Image src={zoomed} alt={imageAlt ?? ""} fill sizes="100vw" className="object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setZoomed(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-admin-ink shadow-lg"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
