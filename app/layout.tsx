import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

export const metadata: Metadata = {
  title: {
    default: "Quiskip",
    template: "%s | Quiskip",
  },
  description:
    "Skip the wait. Join queues, book appointments, and manage your visits with Quiskip.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
