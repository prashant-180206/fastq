import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordAuthForm } from "@/components/auth/PasswordAuthForm";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Quiskip"
      description="Manage your business or pick up where you left off."
      footer={
        <>
          New to Quiskip?{" "}
          <Link href="/auth/sign-up" className="font-semibold underline underline-offset-4">Create an account</Link>
        </>
      }
    >
      <PasswordAuthForm mode="signIn" />
    </AuthShell>
  );
}
