"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

type AuthFormProps = {
  mode: "signIn" | "signUp";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isSignUp = mode === "signUp";

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      await signIn("google", { redirectTo: "/customer" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in failed. Please try again."
      );
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: mode,
      });

      router.push("/customer");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-semibold text-primary">
          ← FastQ
        </Link>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {isSignUp ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Create your FastQ account to get started."
                : "Sign in to manage your FastQ account."}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            <Button
              type="button"
              variant="outline"
              disabled={loading || googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full"
            >
              {googleLoading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <GoogleIcon data-icon="inline-start" />
              )}
              {googleLoading
                ? "Connecting to Google..."
                : isSignUp
                  ? "Sign up with Google"
                  : "Sign in with Google"}
            </Button>

            <div className="relative flex items-center justify-center">
              <Separator className="w-full" />
              <span className="absolute bg-card px-2 text-xs uppercase text-muted-foreground">
                Or continue with email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading || googleLoading}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    minLength={8}
                    required
                    disabled={loading || googleLoading}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                  />
                </Field>
              </FieldGroup>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full"
              >
                {loading && <Spinner data-icon="inline-start" />}
                {loading
                  ? "Please wait..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <Link
                href={isSignUp ? "/sign-in" : "/sign-up"}
                className="font-semibold text-primary hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
