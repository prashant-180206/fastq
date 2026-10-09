import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [["/settings/profile", "Profile", "Update your personal information."], ["/settings/security", "Security", "Manage your password and sessions."], ["/settings/notifications", "Notifications", "Choose how Quiskip keeps you informed."]];

export default function SettingsPage() {
  return <div><h2 className="text-3xl font-bold tracking-tight">Settings</h2><p className="mt-2 text-muted-foreground">Manage your account preferences.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{sections.map(([href, title, description]) => <Link key={href} href={href}><Card className="h-full transition hover:shadow-md"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{description}</CardContent></Card></Link>)}</div></div>;
}
