"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { Manrope, Instrument_Serif } from "next/font/google";
import { PublicHeader } from "@/components/layout/public-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";

/* ────────────────────────────────────────────────────────────
   Brand + fonts
   ──────────────────────────────────────────────────────────── */
const BRAND = "FastQ";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-fq-sans",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-fq-serif",
  display: "swap",
});

const SERIF = "[font-family:var(--font-fq-serif)]";
const EASE = [0.22, 1, 0.36, 1] as const;

/* ────────────────────────────────────────────────────────────
   Theme tokens — follow your existing toggle (.dark on <html>)
   @property lets the browser *animate* the colour variables,
   so light ⇄ dark crossfades smoothly instead of snapping.
   ──────────────────────────────────────────────────────────── */
const TOKENS = {
  bg: ["#F2F4EF", "#0C1310"], // page paper
  surface: ["#FBFBF8", "#121B17"], // cards / bands
  ink: ["#12291F", "#E6EEE8"], // main text
  muted: ["#6B7A71", "#8FA096"], // secondary text
  accent: ["#4C8A69", "#7CC39D"], // sage green
  sand: ["#EDE0C4", "#2A2A20"], // warm highlight
  line: ["#DDE3DB", "#22302A"], // hairlines
  solid: ["#12291F", "#CFE7D9"], // filled buttons / dark cards
  "on-solid": ["#FFFFFF", "#0C1310"], // text on solid
  "cta-accent": ["#EDE0C4", "#2F6B4C"], // italic line in CTA
  shadow: ["rgba(18,41,31,0.35)", "rgba(0,0,0,0.65)"],
} as const;

const themeCss = `
${Object.entries(TOKENS)
  .map(
    ([k, [light]]) =>
      `@property --fq-${k} { syntax: '<color>'; inherits: true; initial-value: ${light}; }`
  )
  .join("\n")}

.fq-root {
${Object.entries(TOKENS)
  .map(([k, [light]]) => `  --fq-${k}: ${light};`)
  .join("\n")}
  transition: ${Object.keys(TOKENS)
    .map((k) => `--fq-${k} 0.7s cubic-bezier(0.22,1,0.36,1)`)
    .join(", ")};
}

:is(.dark, [data-theme="dark"]) .fq-root {
${Object.entries(TOKENS)
  .map(([k, [, dark]]) => `  --fq-${k}: ${dark};`)
  .join("\n")}
}

@media (prefers-reduced-motion: reduce) {
  .fq-root { transition: none; }
}
`;

/* ────────────────────────────────────────────────────────────
   Small motion helpers
   ──────────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--fq-muted)]">
      {children}
    </p>
  );
}

function MaskLine({
  children,
  delay,
  className,
}: {
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <span className="block overflow-hidden pb-1">
      <motion.span
        className={cn("block", className)}
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */
export default function HomePage() {
  const reduce = useReducedMotion();

  // top reading-progress bar
  const { scrollYProgress: pageProgress } = useScroll();
  const progress = useSpring(pageProgress, { stiffness: 120, damping: 30 });

  // hero parallax
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroP } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const m = reduce ? 0 : 1;
  const yText = useTransform(heroP, [0, 1], [0, -90 * m]);
  const yCardA = useTransform(heroP, [0, 1], [0, -220 * m]);
  const yCardB = useTransform(heroP, [0, 1], [0, -360 * m]);
  const yChip = useTransform(heroP, [0, 1], [0, -120 * m]);
  const yGrid = useTransform(heroP, [0, 1], [0, 140 * m]);
  const heroFade = useTransform(heroP, [0, 0.85], [1, 0]);

  // editorial section parallax
  const storyRef = useRef<HTMLElement>(null);
  const { scrollYProgress: storyP } = useScroll({
    target: storyRef,
    offset: ["start end", "end start"],
  });
  const yStory = useTransform(storyP, [0, 1], [80 * m, -80 * m]);

  // how-it-works line
  const stepsRef = useRef<HTMLElement>(null);
  const { scrollYProgress: stepsP } = useScroll({
    target: stepsRef,
    offset: ["start 75%", "end 60%"],
  });

  const services = [
    "Clinics",
    "Salons",
    "Banks",
    "Service centres",
    "Govt. offices",
    "Labs",
    "Cafés",
    "Repair shops",
    "Pharmacies",
    "Spas",
  ];

  const solidBtn =
    "h-12 rounded-full bg-[var(--fq-solid)] px-7 text-[15px] text-[var(--fq-on-solid)] shadow-[0_10px_30px_-12px_var(--fq-shadow)] transition-[transform,opacity] duration-300 hover:-translate-y-0.5 hover:bg-[var(--fq-solid)] hover:opacity-90";
  const ghostBtn =
    "h-12 rounded-full border-[var(--fq-line)] bg-transparent px-7 text-[15px] text-[var(--fq-ink)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[var(--fq-surface)] hover:text-[var(--fq-ink)]";

  return (
    <div
      className={cn(
        sans.variable,
        serif.variable,
        "fq-root min-h-screen bg-[var(--fq-bg)] text-[var(--fq-ink)] antialiased [font-family:var(--font-fq-sans),ui-sans-serif,system-ui] selection:bg-[var(--fq-accent)] selection:text-[var(--fq-on-solid)]"
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />

      {/* reading progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-[var(--fq-accent)]"
      />

      <PublicHeader />

      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section ref={heroRef} className="relative isolate overflow-hidden">
          {/* parallax dot grid */}
          <motion.div
            aria-hidden
            style={{ y: yGrid }}
            className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(var(--fq-line)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 top-10 -z-10 h-[520px] w-[520px] rounded-full bg-[var(--fq-sand)] opacity-50 blur-3xl"
          />

          <motion.div
            style={{ opacity: heroFade }}
            className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]"
          >
            {/* copy */}
            <motion.div style={{ y: yText }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <Badge
                  variant="secondary"
                  className="rounded-full border border-[var(--fq-line)] bg-[var(--fq-surface)] px-4 py-1 text-[12px] font-medium text-[var(--fq-muted)]"
                >
                  <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fq-accent)]" />
                  Queue management, made simpler
                </Badge>
              </motion.div>

              <h1 className="mt-8 text-5xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-7xl">
                <MaskLine delay={0.15}>Less waiting.</MaskLine>
                <MaskLine
                  delay={0.3}
                  className={cn(
                    SERIF,
                    "font-normal italic tracking-[-0.01em] text-[var(--fq-accent)]"
                  )}
                >
                  More doing.
                </MaskLine>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
                className="mt-7 max-w-md text-[17px] leading-8 text-[var(--fq-muted)]"
              >
                {BRAND} helps businesses manage live queues and appointments
                in one place, while giving customers a simpler way to plan
                their visits.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.7 }}
                className="mt-10 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/business/new"
                  className={cn(buttonVariants({ size: "lg" }), solidBtn, "group")}
                >
                  Add your business
                  <span className="ml-2 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    ghostBtn
                  )}
                >
                  Create an account
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 1 }}
                className="mt-14 hidden text-[11px] uppercase tracking-[0.22em] text-[var(--fq-muted)] lg:block"
              >
                Scroll ↓
              </motion.p>
            </motion.div>

            {/* parallax product cards */}
            <div className="relative mx-auto h-[440px] w-full max-w-[420px]">
              {/* main token card */}
              <motion.div
                style={{ y: yCardA }}
                initial={{ opacity: 0, y: 40, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.4 }}
                className="absolute left-0 top-6 w-[82%] rounded-2xl border border-[var(--fq-line)] bg-[var(--fq-surface)] p-6 shadow-[0_30px_60px_-30px_var(--fq-shadow)]"
              >
                <div className="flex items-center justify-between">
                  <p className={cn(SERIF, "text-xl")}>Greenleaf Clinic</p>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--fq-accent)]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fq-accent)]" />
                    Live
                  </span>
                </div>
                <div className="mt-3 h-px bg-[var(--fq-line)]" />
                <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-[var(--fq-muted)]">
                  Your token
                </p>
                <p className={cn(SERIF, "mt-1 text-6xl leading-none")}>A-24</p>
                <div className="mt-6 flex justify-between text-sm text-[var(--fq-muted)]">
                  <span>3 ahead of you</span>
                  <span className="font-medium text-[var(--fq-ink)]">~6 min</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--fq-line)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    transition={{ duration: 1.8, ease: EASE, delay: 1 }}
                    className="h-full rounded-full bg-[var(--fq-accent)]"
                  />
                </div>
              </motion.div>

              {/* appointment card */}
              <motion.div
                style={{ y: yCardB }}
                initial={{ opacity: 0, y: 40, rotate: 3 }}
                animate={{ opacity: 1, y: 0, rotate: 3 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.6 }}
                className="absolute bottom-4 right-0 w-[64%] rounded-2xl bg-[var(--fq-solid)] p-5 text-[var(--fq-on-solid)] shadow-[0_30px_60px_-25px_var(--fq-shadow)]"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-60">
                  Appointment
                </p>
                <p className={cn(SERIF, "mt-2 text-2xl")}>Sat · 10:30 AM</p>
                <p className="mt-1 text-sm opacity-70">Willow Salon</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-current/20 px-3 py-1 text-xs">
                  ✓ Confirmed
                </div>
              </motion.div>

              {/* now-serving chip */}
              <motion.div
                style={{ y: yChip }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.9 }}
                className="absolute -right-2 top-0 rounded-full border border-[var(--fq-line)] bg-[var(--fq-sand)] px-4 py-2 text-xs font-medium shadow-sm"
              >
                Now serving · A-21
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── SERVICES MARQUEE ─────────────────────────────── */}
        <section className="overflow-hidden border-y border-[var(--fq-line)] bg-[var(--fq-surface)] py-6">
          <motion.div
            className="flex w-max gap-12 whitespace-nowrap"
            animate={reduce ? undefined : { x: ["0%", "-50%"] }}
            transition={{ duration: 35, ease: "linear", repeat: Infinity }}
          >
            {[...services, ...services].map((s, i) => (
              <span
                key={i}
                className={cn(SERIF, "flex items-center gap-12 text-3xl opacity-80")}
              >
                {s}
                <span className="text-base text-[var(--fq-accent)]">✦</span>
              </span>
            ))}
          </motion.div>
        </section>

        {/* ── EDITORIAL: THE QUESTIONS ─────────────────────── */}
        <section ref={storyRef} className="mx-auto max-w-6xl px-6 py-32">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <Reveal>
                <Eyebrow>Before you leave home</Eyebrow>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                  One visit.
                  <br />
                  <span className={cn(SERIF, "font-normal italic text-[var(--fq-accent)]")}>
                    A different set of questions.
                  </span>
                </h2>
              </Reveal>
              <div className="mt-8 space-y-3">
                {[
                  "Is it open right now?",
                  "How long is the line?",
                  "Can I book a slot instead?",
                ].map((q, i) => (
                  <Reveal key={q} delay={0.2 + i * 0.1}>
                    <p className="flex items-center gap-4 text-[17px] text-[var(--fq-muted)]">
                      <span className="text-xs tabular-nums text-[var(--fq-accent)]">
                        0{i + 1}
                      </span>
                      {q}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>

            <motion.div style={{ y: yStory }}>
              <Reveal>
                <div className="rounded-2xl border border-[var(--fq-line)] bg-[var(--fq-surface)] p-8 shadow-[0_30px_70px_-35px_var(--fq-shadow)]">
                  <div className="flex items-baseline justify-between">
                    <p className={cn(SERIF, "text-2xl")}>Greenleaf Clinic</p>
                    <p className="text-xs text-[var(--fq-muted)]">Open · till 9 PM</p>
                  </div>
                  <div className="mt-4 h-px bg-[var(--fq-ink)] opacity-70" />
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    {[
                      ["12", "min wait"],
                      ["5", "in queue"],
                      ["4:30", "next slot"],
                    ].map(([v, l]) => (
                      <div key={l}>
                        <p className={cn(SERIF, "text-4xl leading-none")}>{v}</p>
                        <p className="mt-2 text-xs text-[var(--fq-muted)]">{l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--fq-accent)]">
                      ● Answered before you step out
                    </span>
                    <span className="rounded-md bg-[var(--fq-solid)] px-4 py-2 text-xs font-medium text-[var(--fq-on-solid)]">
                      Join queue
                    </span>
                  </div>
                </div>
              </Reveal>
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────── */}
        <section className="bg-[var(--fq-surface)]">
          <div className="mx-auto max-w-6xl px-6 py-28">
            <Reveal>
              <Eyebrow>What {BRAND} does</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                Everything a visit needs.{" "}
                <span className={cn(SERIF, "font-normal italic text-[var(--fq-muted)]")}>
                  Nothing it doesn’t.
                </span>
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-6 sm:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Live queues",
                  body: "Let customers join a queue and follow their progress.",
                },
                {
                  n: "02",
                  title: "Appointments",
                  body: "Let customers plan visits ahead of time.",
                },
                {
                  n: "03",
                  title: "One platform",
                  body: "Support queue-only, appointment-only, or hybrid businesses.",
                },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 0.12}>
                  <motion.div
                    whileHover={reduce ? undefined : { y: -6 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="h-full"
                  >
                    <Card className="group h-full rounded-2xl border-[var(--fq-line)] bg-[var(--fq-bg)] text-[var(--fq-ink)] shadow-none transition-shadow duration-500 hover:shadow-[0_25px_50px_-30px_var(--fq-shadow)]">
                      <CardHeader>
                        <span className="text-xs tabular-nums text-[var(--fq-accent)]">
                          {f.n}
                        </span>
                        <CardTitle className={cn(SERIF, "mt-6 text-3xl font-normal")}>
                          {f.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-6 text-[var(--fq-muted)]">
                          {f.body}
                        </p>
                        <div className="mt-8 h-px origin-left scale-x-[0.25] bg-[var(--fq-accent)] transition-transform duration-700 group-hover:scale-x-100" />
                      </CardContent>
                    </Card>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS (scroll-linked line) ────────────── */}
        <section ref={stepsRef} className="mx-auto max-w-6xl px-6 py-32">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              First, find.{" "}
              <span className={cn(SERIF, "font-normal italic text-[var(--fq-accent)]")}>
                Then just show up.
              </span>
            </h2>
          </Reveal>

          <div className="relative mt-20">
            <div className="absolute left-0 right-0 top-[7px] hidden h-px bg-[var(--fq-line)] sm:block" />
            <motion.div
              style={{ scaleX: stepsP }}
              className="absolute left-0 right-0 top-[7px] hidden h-px origin-left bg-[var(--fq-accent)] sm:block"
            />
            <div className="grid gap-12 sm:grid-cols-3">
              {[
                ["Find a service", "Search nearby businesses and see live wait times."],
                ["Join or book", "Take a token now, or reserve a slot for later."],
                ["Walk in on time", "Get notified when it’s your turn. No standing around."],
              ].map(([t, d], i) => (
                <Reveal key={t} delay={i * 0.15}>
                  <span className="relative block h-[15px] w-[15px] rounded-full border-2 border-[var(--fq-accent)] bg-[var(--fq-bg)]" />
                  <p className="mt-6 text-xs tabular-nums text-[var(--fq-muted)]">
                    Step 0{i + 1}
                  </p>
                  <p className={cn(SERIF, "mt-2 text-3xl")}>{t}</p>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--fq-muted)]">
                    {d}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="px-6 pb-24">
          <Reveal>
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[var(--fq-solid)] px-8 py-20 text-center text-[var(--fq-on-solid)] sm:px-16">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(var(--fq-on-solid)_1px,transparent_1px)] [background-size:24px_24px]"
              />
              <h2 className="relative text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
                Your time is
                <br />
                <span className={cn(SERIF, "font-normal italic text-[var(--fq-cta-accent)]")}>
                  worth more than a line.
                </span>
              </h2>
              <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/business/new"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-full bg-[var(--fq-on-solid)] px-7 text-[15px] text-[var(--fq-solid)] transition-[transform,opacity] duration-300 hover:-translate-y-0.5 hover:bg-[var(--fq-on-solid)] hover:opacity-90"
                  )}
                >
                  Add your business
                </Link>
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-full border-current/25 bg-transparent px-7 text-[15px] text-[var(--fq-on-solid)] transition-[transform,opacity] duration-300 hover:-translate-y-0.5 hover:bg-transparent hover:text-[var(--fq-on-solid)] hover:opacity-80"
                  )}
                >
                  Create an account
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <footer className="mx-auto max-w-6xl px-6 pb-10 text-sm text-[var(--fq-muted)]">
          <Separator className="mb-6 bg-[var(--fq-line)]" />
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className={cn(SERIF, "text-lg text-[var(--fq-ink)]")}>{BRAND}</p>
            <p>© 2026 {BRAND}</p>
          </div>
        </footer>
      </main>
    </div>
  );
}