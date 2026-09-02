"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, RefreshCw, Check, AlertCircle } from "lucide-react";

type CaptureState = "idle" | "camera" | "preview";

interface LiveSelfieCaptureProps {
  onCapture: (dataUrl: string) => void;
}

export function LiveSelfieCapture({ onCapture }: LiveSelfieCaptureProps) {
  const [state, setState] = useState<CaptureState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setState("camera");
    } catch {
      setError("Kamera tidak ditemukan atau akses ditolak. Silakan periksa pengaturan browser Anda.");
      setState("idle");
    }
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    stopStream();

    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);
    setState("preview");
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const handleUsePhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  if (state === "idle") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-deep/10">
          <Camera className="h-8 w-8 text-teal-deep" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ambil Foto Selfie</h3>
          <p className="mt-1 text-xs text-muted">
            Anda perlu mengaktifkan kamera untuk mengambil foto selfie.
          </p>
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red/20 bg-red/10 p-3 text-left">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
            <p className="text-xs text-red">{error}</p>
          </div>
        )}
        <button
          type="button"
          onClick={startCamera}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          <Camera className="h-4 w-4" />
          {error ? "Coba Lagi" : "Ambil Foto Sekarang"}
        </button>
      </div>
    );
  }

  if (state === "camera") {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-[3/4] w-full object-cover sm:aspect-video"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCapture}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
          >
            <Camera className="h-4 w-4" />
            Ambil Foto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {capturedImage && (
        <div className="overflow-hidden rounded-2xl">
          <img
            src={capturedImage}
            alt="Preview selfie"
            className="aspect-[3/4] w-full object-cover sm:aspect-video"
          />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={handleRetake}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gold px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-teal-deep focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" />
          Ambil Ulang
        </button>
        <button
          type="button"
          onClick={handleUsePhoto}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          <Check className="h-4 w-4" />
          Gunakan Foto
        </button>
      </div>
    </div>
  );
}
