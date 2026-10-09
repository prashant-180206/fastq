import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Quiskip
        </Link>
        <div>
          <p className="max-w-md text-5xl font-bold leading-[1.05] tracking-tight">
            More doing.
            <br />
            <span className="text-muted-foreground">Less waiting.</span>
          </p>
          <p className="mt-6 max-w-md leading-7 text-muted">
            One calm place for queues, appointments, and better customer
            experiences.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Quiskip
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="size-4" />
            Back to Quiskip
          </Link>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-3 leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {children}
          {footer && <div className="mt-7 text-center text-sm">{footer}</div>}
        </div>
      </section>
    </main>
  );
}
