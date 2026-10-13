import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main>
        <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-24 text-center">
          <Badge variant="secondary" className="rounded-full px-4 py-1">
            Queue management, made simpler
          </Badge>

          <h1 className="mt-8 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Less waiting.
            <br />
            <span className="text-primary">More doing.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            QuiLess helps businesses manage live queues and appointments
            in one place, while giving customers a simpler way to plan
            their visits.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/business/new"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Add your business
            </Link>
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Create an account
            </Link>
          </div>
        </section>

        <section className="bg-muted/50">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Live queues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  Let customers join a queue and follow their progress.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  Let customers plan visits ahead of time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>One platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  Support queue-only, appointment-only, or hybrid businesses.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="px-6 py-6 text-center text-sm text-muted-foreground">
          <Separator className="mb-6" />
          <p>© 2026 QuiLess</p>
        </footer>
      </main>
    </div>
  );
}
