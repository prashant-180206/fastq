import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsSecurityPage() {
  return <div><h2 className="text-3xl font-bold tracking-tight">Security</h2><p className="mt-2 text-muted-foreground">Keep your Quiskip account secure.</p><Card className="mt-8 max-w-xl"><CardHeader><CardTitle>Password and sessions</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Use the password recovery flow to update a forgotten password.</CardContent></Card></div>;
}
