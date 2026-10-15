import Link from "next/link";
import { cn } from "cn";

interface LogoProps {
  href?: string;
  className?: string;
}

export function Logo({ href = "/", className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("text-xl font-bold tracking-tight", className)}
    >
      FastQ<span className="text-primary">.</span>
    </Link>
  );
}