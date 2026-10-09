import { Card, CardContent } from "@/components/ui/card";

export default function CustomerQueuePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Your queue</h1>
      <p className="mt-2 text-muted-foreground">
        Live updates for any queue you have joined.
      </p>
      <Card className="mt-8">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          You are not in an active queue.
        </CardContent>
      </Card>
    </main>
  );
}
