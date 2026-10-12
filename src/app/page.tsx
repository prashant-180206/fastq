
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Quiskip<span className="text-blue-700">.</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-24 text-center">
        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          Queue management, made simpler
        </span>

        <h1 className="mt-8 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
          Less waiting.
          <br />
          <span className="text-blue-700">More doing.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Quiskip helps businesses manage live queues and appointments
          in one place, while giving customers a simpler way to plan
          their visits.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/businesses/new"
            className="rounded-lg bg-blue-700 px-6 py-3.5 font-semibold text-white hover:bg-blue-800"
          >
            Add your business
          </Link>

          <Link
            href="/sign-up"
            className="rounded-lg border border-slate-300 px-6 py-3.5 font-semibold text-slate-800 hover:bg-slate-50"
          >
            Create an account
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
          <article>
            <h2 className="font-semibold">Live queues</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Let customers join a queue and follow their progress.
            </p>
          </article>

          <article>
            <h2 className="font-semibold">Appointments</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Let customers plan visits ahead of time.
            </p>
          </article>

          <article>
            <h2 className="font-semibold">One platform</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Support queue-only, appointment-only, or hybrid businesses.
            </p>
          </article>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-500">
        © {2020} Quiskip
      </footer>
    </main>
  );
}
