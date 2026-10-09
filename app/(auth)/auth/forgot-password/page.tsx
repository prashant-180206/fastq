import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter your email and we’ll help you get back into your account."
      footer={<Link href="/auth/sign-in" className="font-semibold underline underline-offset-4">Back to sign in</Link>}
    >
      {submitted ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-center">
          <MailCheck className="mx-auto size-8" />
          <h2 className="mt-4 font-semibold">Recovery is not enabled</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">The Convex deployment is currently configured for password sign-in only. Add an email provider before recovery messages can be delivered.</p>
        </div>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" placeholder="you@example.com" required /></div>
          <Button type="submit" className="w-full" size="lg">Send recovery email</Button>
          <p className="text-xs leading-5 text-muted-foreground">Email recovery must be enabled in your Convex Auth deployment before messages can be delivered.</p>
        </form>
      )}
    </AuthShell>
  );
}
