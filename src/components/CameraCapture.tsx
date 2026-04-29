"use client";

import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";

// Live-camera modal that works on desktop + mobile via getUserMedia.
// Requires HTTPS (or localhost). Asks the browser for camera permission;
// if denied or unavailable, shows a fallback message and "Use Upload"
// button.

export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setError(
          "Your browser doesn't support live camera capture. Tap Upload instead.",
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // rear camera on phones
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        const name = (err as DOMException)?.name ?? "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError(
            "Camera permission denied. You can change this in your browser's site settings, or tap Upload instead.",
          );
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setError("No camera found on this device. Tap Upload instead.");
        } else if (name === "NotReadableError") {
          setError(
            "Another app is using the camera. Close it and try again.",
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't start the camera. Tap Upload instead.",
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ESC closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function capture() {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Camera"
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close camera"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-2xl text-white backdrop-blur hover:bg-white/25"
      >
        ×
      </button>

      {error ? (
        <div className="m-auto flex max-w-sm flex-col items-center gap-4 p-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed text-white/90">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-full max-w-full"
            />
          </div>
          <div className="flex items-center justify-center gap-6 p-6 pb-10">
            <button
              type="button"
              onClick={capture}
              disabled={!ready}
              aria-label="Take photo"
              className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-lg ring-4 ring-white/30 transition active:scale-95 disabled:cursor-wait disabled:opacity-50"
            >
              <span className="block h-12 w-12 rounded-full bg-white ring-2 ring-zinc-300" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
