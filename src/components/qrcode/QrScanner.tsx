import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QrScannerProps {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false,
    );

    let cancelled = false;

    try {
      scanner.render(
        (decodedText) => {
          if (!cancelled) {
            onScanRef.current(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore frames where no QR code is visible; only surface real
          // camera problems (e.g. permission denied, camera in use).
          const text = String(errorMessage).toLowerCase();
          if (
            !cancelled &&
            onErrorRef.current &&
            !text.includes("not found") &&
            !text.includes("no barcode") &&
            !text.includes("videostream")
          ) {
            onErrorRef.current(String(errorMessage));
          }
        },
      );
    } catch (err) {
      if (!cancelled) {
        onErrorRef.current?.(
          err instanceof Error ? err.message : "Unable to start camera.",
        );
      }
    }

    return () => {
      cancelled = true;
      void scanner.clear().catch(() => {});
    };
  }, []);

  return <div id="qr-reader" />;
}