import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomerHomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your space</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Good to see you.</h1><p className="mt-2 text-muted-foreground">Keep your visits, appointments, and queue tickets in one place.</p></div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card className="md:col-span-2"><CardHeader><CardTitle>Find a business</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Discover nearby services and see live queue availability before you go.</p><Button className="mt-5"><Link href="/discover">Browse businesses <Search className="ml-2 size-4" /></Link></Button></CardContent></Card>
        <Card><CardHeader><Clock3 className="size-5" /><CardTitle className="mt-3">Current queue</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">You are not in a queue right now.</p><Link href="/discover" className="mt-5 inline-flex items-center text-sm font-semibold">Find a queue <ArrowRight className="ml-2 size-4" /></Link></CardContent></Card>
      </div>
      <Card className="mt-5"><CardHeader><CardTitle>Upcoming appointments</CardTitle></CardHeader><CardContent className="flex items-center gap-4 text-sm text-muted-foreground"><CalendarDays className="size-5" />No upcoming appointments.<Link href="/discover" className="font-semibold text-foreground underline underline-offset-4">Book one</Link></CardContent></Card>
    </main>
  );
}
