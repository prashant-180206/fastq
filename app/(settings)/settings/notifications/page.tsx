import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsNotificationsPage() {
  return <div><h2 className="text-3xl font-bold tracking-tight">Notifications</h2><p className="mt-2 text-muted-foreground">Choose how you receive queue updates.</p><Card className="mt-8 max-w-xl"><CardHeader><CardTitle>Notification preferences</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Notification preferences will be available once delivery channels are configured.</CardContent></Card></div>;
}
