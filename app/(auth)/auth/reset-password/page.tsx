import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  return (
    <AuthShell eyebrow="Account recovery" title="Choose a new password" description="Use a strong password you don’t use anywhere else." footer={<Link href="/auth/sign-in" className="font-semibold underline underline-offset-4">Back to sign in</Link>}>
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}><div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" type="password" minLength={8} required /></div><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" minLength={8} required /></div><Button className="w-full" size="lg">Update password</Button></form>
    </AuthShell>
  );
}
