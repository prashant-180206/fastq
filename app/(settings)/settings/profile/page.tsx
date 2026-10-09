import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsProfilePage() {
  return <div><h2 className="text-3xl font-bold tracking-tight">Profile</h2><p className="mt-2 text-muted-foreground">Your personal account details.</p><Card className="mt-8 max-w-xl"><CardHeader><CardTitle>Account profile</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Profile editing can be connected to the user record here.</CardContent></Card></div>;
}
