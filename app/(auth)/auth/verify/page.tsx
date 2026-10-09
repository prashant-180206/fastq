import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyPage() {
  return (
    <AuthShell eyebrow="Verify your email" title="One last step" description="Enter the verification code from your email to finish setting up your account." footer={<Link href="/auth/sign-in" className="font-semibold underline underline-offset-4">Back to sign in</Link>}>
      <div className="rounded-xl border bg-muted/30 p-5 text-center"><MailCheck className="mx-auto size-8" /><p className="mt-3 text-sm leading-6 text-muted-foreground">Email verification is available when a verification provider is configured for your Convex deployment.</p></div>
      <form className="mt-6 space-y-5" onSubmit={(event) => event.preventDefault()}><div className="space-y-2"><Label htmlFor="code">Verification code</Label><Input id="code" inputMode="numeric" placeholder="000000" /></div><Button type="submit" className="w-full" size="lg">Verify email</Button></form>
    </AuthShell>
  );
}
