import { AppHeader } from "@/components/layout/app-header";

export default function PublicBusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader />
      {children}
    </div>
  );
}