import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QrScannerProps {
  onScan: (value: string) => void;
}

export function QrScanner({ onScan }: QrScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false,
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
      },
      () => {
        // Ignore frames where no QR code is detected.
      },
    );

    return () => {
      void scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return <div id="qr-reader" />;
}
