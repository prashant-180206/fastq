import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordAuthForm } from "@/components/auth/PasswordAuthForm";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      description="Join queues, book appointments, or start managing your own business."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-semibold underline underline-offset-4">Sign in</Link>
        </>
      }
    >
      <PasswordAuthForm mode="signUp" />
    </AuthShell>
  );
}
