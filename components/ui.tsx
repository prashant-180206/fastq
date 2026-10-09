import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-[#e85d3f] text-white shadow-[0_8px_20px_rgba(232,93,63,.2)] hover:bg-[#d84f32]",
    secondary: "bg-[#183b45] text-white hover:bg-[#245562]",
    ghost: "bg-transparent text-[#31545b] hover:bg-[#eef4f1]",
    danger: "bg-[#fff0ed] text-[#b63d2c] hover:bg-[#ffe1db]",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#dce8e3] bg-white shadow-[0_8px_30px_rgba(24,59,69,.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: "green" | "orange" | "gray" | "red";
}) {
  const styles = {
    green: "bg-[#e5f5ed] text-[#257554]",
    orange: "bg-[#fff0e8] text-[#c75532]",
    gray: "bg-[#eef3f2] text-[#567076]",
    red: "bg-[#ffebe8] text-[#bf4737]",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-label="Loading"
    />
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-bold tracking-tight text-[#183b45]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e85d3f] text-lg text-white shadow-[0_5px_15px_rgba(232,93,63,.2)]">
        Q
      </span>
      {!compact && (
        <span className="text-xl">
          quiless<span className="text-[#e85d3f]">.</span>
        </span>
      )}
    </span>
  );
}
