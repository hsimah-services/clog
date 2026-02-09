import { useRef, useState, useCallback, useEffect } from 'react';
import 'barcode-detector/polyfill';

interface UseBarcodeSccannerOptions {
  onDetected: (rawValue: string) => void;
  formats?: string[];
}

export function useBarcodeScanner({ onDetected, formats }: UseBarcodeSccannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const rafRef = useRef<number>(0);
  const lastDetectTimeRef = useRef(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    const now = performance.now();
    if (now - lastDetectTimeRef.current < 150) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }
    lastDetectTimeRef.current = now;

    detector
      .detect(video)
      .then((barcodes) => {
        if (barcodes.length > 0) {
          onDetected(barcodes[0].rawValue);
          stop();
          return;
        }
        rafRef.current = requestAnimationFrame(detect);
      })
      .catch(() => {
        rafRef.current = requestAnimationFrame(detect);
      });
  }, [onDetected, stop]);

  const start = useCallback(async () => {
    setError(null);
    try {
      detectorRef.current = new BarcodeDetector(
        formats ? { formats: formats as BarcodeFormat[] } : undefined
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
      rafRef.current = requestAnimationFrame(detect);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      setError(message);
      stop();
    }
  }, [formats, detect, stop]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) return;

    try {
      const barcodes = await detector.detect(video);
      if (barcodes.length > 0) {
        onDetected(barcodes[0].rawValue);
        stop();
      } else {
        setError('No barcode found. Try adjusting the camera angle.');
      }
    } catch {
      setError('Detection failed. Please try again.');
    }
  }, [onDetected, stop]);

  return { videoRef, start, stop, capture, isScanning, error };
}
