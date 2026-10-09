"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordAuthForm({ mode }: { mode: "signIn" | "signUp" }) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("flow", mode);

    try {
      await signIn("password", formData);
      router.push(mode === "signUp" ? "/business/new" : "/app");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Authentication failed.",
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {mode === "signIn" && (
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          minLength={8}
          placeholder="At least 8 characters"
          required
          disabled={loading}
        />
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {mode === "signIn" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
