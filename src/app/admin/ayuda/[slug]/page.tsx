import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { getTutorial } from "@/lib/tutorials";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = await getTutorial(slug);
  return { title: tutorial?.title ?? "Ayuda" };
}

export default async function TutorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireSession();
  const { slug } = await params;
  const [profile, tutorial] = await Promise.all([getProfileById(session.uid), getTutorial(slug)]);

  if (!tutorial) notFound();
  if (!tutorial.visible && session.role !== "admin") notFound();

  return (
    <AdminShell activeHref="/admin/ayuda" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <Link href="/admin/ayuda" className="text-[0.82rem] font-semibold text-admin-ink-soft hover:underline">
        ← Ayuda
      </Link>

      <h1 className="mt-2 font-display text-2xl text-admin-ink">{tutorial.title}</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">{tutorial.summary}</p>

      {!tutorial.visible && session.role === "admin" && (
        <p className="mt-3 inline-block rounded-lg bg-admin-pending-bg px-3 py-2 text-[0.8rem] font-semibold text-admin-pending-text">
          Oculto para el equipo — solo tú lo ves porque eres administración.
        </p>
      )}

      <div className="mt-6 flex max-w-[640px] flex-col gap-8">
        {tutorial.steps.map((step, i) => (
          <div key={step.title} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-admin-primary font-data text-[0.8rem] font-bold text-admin-primary">
                {i + 1}
              </span>
              <h2 className="font-display text-[1.05rem] text-admin-ink">{step.title}</h2>
            </div>
            <p className="text-[0.9rem] text-admin-ink-soft">{step.body}</p>
            {step.image && (
              <div className="max-w-[260px] rounded-2xl border border-admin-border bg-admin-bg p-2 shadow-sm">
                <Image src={step.image} alt={step.imageAlt ?? step.title} width={420} height={860} className="w-full rounded-xl" />
              </div>
            )}
            {step.cue && (
              <span
                className={`inline-block w-fit rounded-lg px-3 py-1.5 text-[0.8rem] font-semibold ${
                  step.cueTone === "warn" ? "bg-admin-pending-bg text-admin-pending-text" : step.cueTone === "ok" ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-primary-soft text-admin-primary-deep"
                }`}
              >
                {step.cue}
              </span>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
