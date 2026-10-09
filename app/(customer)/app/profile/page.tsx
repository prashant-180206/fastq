import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomerProfilePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your personal details and preferences.
      </p>
      <Card className="mt-8 max-w-xl">
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Profile editing will be connected to your account settings here.
        </CardContent>
      </Card>
    </main>
  );
}
