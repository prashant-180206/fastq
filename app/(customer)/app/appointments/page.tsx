import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CustomerAppointmentsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your upcoming and past visits.
      </p>
      <Card className="mt-8">
        <CardContent className="flex flex-col items-center px-6 py-16 text-center">
          <CalendarDays className="size-10 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No appointments yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Find a business and book a time that works for you.
          </p>
          <Link
            href="/discover"
            className="mt-5 text-sm font-semibold underline underline-offset-4"
          >
            Discover businesses
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
