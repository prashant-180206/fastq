import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/hooks/ConvexProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "QuiLess",
  description: "Queue and appointment management made simple.",
};

async function AuthBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth + Convex sessions depend on the incoming request, and prerendering
  // touches the clock (session freshness, footer year) which cacheComponents
  // rejects. connection() inside <Suspense> keeps the shell prerenderable
  // while the authenticated tree renders at request time.
  await connection();

  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ConvexAuthNextjsServerProvider>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={null}>
      <AuthBoundary>
        <html
          lang="en"
          className={cn("font-sans", figtree.variable)}
          suppressHydrationWarning
        >
          <body>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </body>
        </html>
      </AuthBoundary>
    </Suspense>
  );
}
