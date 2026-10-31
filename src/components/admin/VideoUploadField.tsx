"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { VIDEO_MAX_BYTES, VIDEO_UPLOAD_PREFIX, resolveVideoType } from "@/lib/media";

const inputClass =
  "w-full rounded-lg border border-gold/25 bg-transparent px-4 py-2.5 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
const uploadBtnClass =
  "focus-ring shrink-0 cursor-pointer rounded-lg border border-gold/40 px-3 py-2.5 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10";
const removeBtnClass = "font-ui text-xs uppercase tracking-wide text-wine-bright hover:underline";

/**
 * Campo para cargar un video desde el panel: se sube directo a Vercel Blob (así entran videos grandes),
 * muestra el porcentaje de avance y una vista previa. También se puede pegar la dirección de un video ya alojado.
 * onBusyChange avisa al formulario cuando hay una subida en curso, para que no se guarde a mitad de camino.
 */
export function VideoUploadField({
  value,
  onChange,
  onBusyChange,
}: {
  value: string;
  onChange: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState("");

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onBusyChange?.(busy);
  };

  // Si se intenta cerrar o recargar la página en medio de una subida, el navegador pide confirmación.
  useEffect(() => {
    if (!uploading) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const contentType = resolveVideoType(file.name, file.type);
    if (!contentType) {
      setError("El archivo debe ser un video MP4, WebM o MOV.");
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      const mb = Math.round(file.size / (1024 * 1024));
      setError(`Ese video pesa ${mb} MB y el máximo es ${VIDEO_MAX_BYTES / (1024 * 1024)} MB. Comprímelo o expórtalo en menor calidad.`);
      return;
    }

    setError("");
    setPercent(0);
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const blob = await upload(`${VIDEO_UPLOAD_PREFIX}${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload-video",
        multipart: true,
        contentType,
        onUploadProgress: ({ percentage }) => setPercent(Math.round(percentage)),
      });
      onChange(blob.url);
    } catch (err) {
      console.error("Error subiendo el video:", err);
      const detail = err instanceof Error && err.message.includes("No autorizado") ? " Vuelve a ingresar al panel." : "";
      setError(`No se pudo subir el video. Revisa tu conexión e inténtalo de nuevo.${detail}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={uploading}
          placeholder="Se completa al subir el video, o pega la dirección de un video MP4"
        />
        <label className={`${uploadBtnClass} ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          {uploading ? `Subiendo… ${percent}%` : value ? "Cambiar video" : "Subir video"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.m4v,.webm,.mov"
            className="hidden"
            disabled={uploading}
            onChange={onFileChange}
          />
        </label>
      </div>

      {uploading && (
        <div role="status" aria-live="polite">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gold/15">
            <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1.5 font-ui text-xs text-gold-pale">
            Subiendo el video: {percent}%. No cierres esta página hasta que llegue al 100 %.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="font-ui text-xs text-wine-bright">
          {error}
        </p>
      )}

      {value && !uploading && (
        <div className="space-y-2">
          <video
            src={value}
            controls
            preload="metadata"
            playsInline
            className="max-h-64 w-full max-w-md rounded-lg border border-gold/20 bg-black"
          />
          <button type="button" onClick={() => onChange("")} className={removeBtnClass}>
            Quitar el video
          </button>
        </div>
      )}

      <p className="font-ui text-xs text-gold-dim">
        Formato recomendado: MP4 (H.264), hasta {VIDEO_MAX_BYTES / (1024 * 1024)} MB. Para que cargue rápido en celulares, conviene que pese menos de 50 MB.
        Los .mov de iPhone pueden no verse en todos los navegadores: si puedes, expórtalo como MP4.
      </p>
    </div>
  );
}
