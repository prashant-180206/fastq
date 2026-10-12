import { QRCodeSVG } from "qrcode.react";

export function QrCode({ value }: { value: string }) {
  return <QRCodeSVG value={value} size={220} level="H" marginSize={4} />;
}
