"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { SeasonReflection, SeasonReview } from "@/domain/season-review/types";
import styles from "./season-review.module.css";

type SeasonLink = { id: number; name: string; startDate: string; endDate: string; state: "in_progress" | "reviewed" | "not_reviewed" };
type Response = { review: SeasonReview; seasons: SeasonLink[] };
type Form = Omit<SeasonReflection, "completedAt">;
const blank: Form = { proudOf: "", changedMost: "", obstacles: "", lesson: "", carryForward: "", leaveBehind: "" };
const duration = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
const count = (value: number) => value.toLocaleString("en-ZA", { maximumFractionDigits: 1 });
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00Z`));

export default function SeasonReviewPage() {
  return <Suspense fallback={<main className={styles.page}>Loading season review…</main>}><SeasonReviewContent /></Suspense>;
}

function SeasonReviewContent() {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const initialSeasonId = params.get("seasonId");
  const [seasonId, setSeasonId] = useState(initialSeasonId ?? "");
  const [data, setData] = useState<Response>();
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const query = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : "";

  useEffect(() => {
    let active = true;
    void fetch(`/api/reviews/season${query}`).then(async (response) => {
      const body = await response.json() as Response & { error?: string };
      if (!active) return;
      if (!response.ok) { setError(body.error ?? "Could not load this season review."); return; }
      setData(body);
      setSeasonId(String(body.review.season.id));
      const reflection = body.review.reflection;
      setForm(reflection ? { proudOf: reflection.proudOf, changedMost: reflection.changedMost, obstacles: reflection.obstacles, lesson: reflection.lesson, carryForward: reflection.carryForward, leaveBehind: reflection.leaveBehind } : blank);
      setError("");
    }).catch(() => { if (active) setError("Could not load this season review."); });
    return () => { active = false; };
  }, [query]);

  const selectedIndex = useMemo(() => data?.seasons.findIndex((season) => season.id === data.review.season.id) ?? -1, [data]);
  const previous = selectedIndex > 0 ? data?.seasons[selectedIndex - 1] : undefined;
  const next = selectedIndex >= 0 && selectedIndex < (data?.seasons.length ?? 0) - 1 ? data?.seasons[selectedIndex + 1] : undefined;
  const change = (field: keyof Form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const move = (season?: SeasonLink) => { if (season) setSeasonId(String(season.id)); };

  async function save(complete: boolean) {
    if (!data) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/reviews/season", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ seasonId: data.review.season.id, ...form, complete }) });
      const body = await response.json() as Response & { error?: string };
      if (!response.ok) { setError(body.error ?? "Could not save your reflection."); return; }
      setData(body);
      const reflection = body.review.reflection;
      if (reflection) setForm({ proudOf: reflection.proudOf, changedMost: reflection.changedMost, obstacles: reflection.obstacles, lesson: reflection.lesson, carryForward: reflection.carryForward, leaveBehind: reflection.leaveBehind });
    } catch { setError("Could not save your reflection."); } finally { setSaving(false); }
  }

  const review = data?.review;
  return <main className={styles.page}>
    <header className={styles.navigation}>
      <Link href="/" className="back"><ArrowLeft size={16} /> Today</Link>
      <div>
        <button disabled={!previous} onClick={() => move(previous)} aria-label="Previous season"><ChevronLeft size={16} /> {previous?.name ?? "Previous"}</button>
        <span>{review?.season.name ?? "Loading season"}</span>
        <button disabled={!next} onClick={() => move(next)} aria-label="Next season">{next?.name ?? "Next"} <ChevronRight size={16} /></button>
      </div>
    </header>
    {error && !review ? <p className={styles.error}>{error}</p> : null}
    {review && <>
      <section className={styles.hero}>
        <p className="eyebrow">{review.season.state === "reviewed" ? "Reviewed" : review.season.state === "in_progress" ? "In progress" : "Not reviewed"}</p>
        <h1>{review.season.name}</h1>
        <h2>{review.season.theme || "A season in motion."}</h2>
        <p>{review.season.totalDays} days · A factual record of progress against the goals you chose, not a measure of your worth or life quality.</p>
      </section>

      <section className={styles.trajectory}>
        <p className="eyebrow">Your trajectory</p><h2>Progress has a beginning and an end.</h2>
        <div className={styles.trajectoryNumbers}><article><span>Start of season</span><strong>{review.trajectory.startScore}%</strong></article><b>→</b><article><span>End of season</span><strong>{review.trajectory.endScore}%</strong></article><em className={review.trajectory.change >= 0 ? styles.positive : ""}>{review.trajectory.change >= 0 ? "+" : ""}{review.trajectory.change}</em></div>
        {review.trajectory.expectedEndScore > 0 && <small>Expected position at this point: {review.trajectory.expectedEndScore}%.</small>}
      </section>

      <Section eyebrow="The goals" title="What moved, in exact terms.">
        {review.goals.all.length ? <div className={styles.goals}>{review.goals.all.map((goal) => <article key={goal.id}><p>{goal.area}</p><h3>{goal.title}</h3><strong>{count(goal.endValue)} / {count(goal.target)}</strong><div className={styles.progress}><i style={{ width: `${goal.endPercentage}%` }} /></div><div className={styles.goalDetail}><span>Start {count(goal.startValue)} · {count(goal.startPercentage)}%</span><span>End {count(goal.endValue)} · {count(goal.endPercentage)}%</span><b>{goal.movement >= 0 ? "+" : ""}{count(goal.movement)} points · {goal.trajectoryStatus.replace("_", " ")}</b></div><small>{goal.evidence.records ? `${goal.evidence.records} recorded item${goal.evidence.records === 1 ? "" : "s"} across ${goal.evidence.activeDays} day${goal.evidence.activeDays === 1 ? "" : "s"}.` : "No dated evidence was recorded for this goal."}</small></article>)}</div> : <Empty text="No goals were attached to this season." />}
      </Section>

      <Section eyebrow="In numbers" title={`${review.season.name} in numbers.`}>
        {review.metrics.length ? <div className={styles.metrics}>{review.metrics.map((metric) => <article key={metric.key}><b>{metric.key === "deep_work_minutes" ? duration(metric.total) : metric.key === "tutoring_revenue" || metric.key === "savings" ? `R${count(metric.total)}` : count(metric.total)}</b><span>{metric.label}</span></article>)}</div> : <Empty text="No metric evidence was recorded in this season." />}
      </Section>

      <Section eyebrow="Where your attention went" title="Focused time has its own measure.">
        {review.attention.length ? <div className={styles.attention}>{review.attention.map((item) => <div key={item.name}><span>{item.name}</span><i><b style={{ width: `${item.percentage}%` }} /></i><strong>{duration(item.minutes)}</strong><small>{Math.round(item.percentage)}%</small></div>)}</div> : <Empty text="Not enough evidence was recorded to calculate a meaningful attention breakdown." />}
      </Section>

      <Section eyebrow="How the season moved" title="A weekly record, not a dashboard.">
        {review.weeklyTrend.length ? <div className={styles.trend}>{review.weeklyTrend.map((point) => <article key={`${point.startDate}-${point.endDate}`}><span>{point.label}</span><i style={{ height: `${Math.max(point.score, 3)}%` }} /><b>{point.score}%</b></article>)}</div> : <Empty text="There are no weeks to plot yet." />}
      </Section>

      {(review.movement.most.length > 0 || review.movement.least.length > 0) && <section className={styles.movement}><div><p className="eyebrow">Most movement</p>{review.movement.most.map((goal) => <p key={goal.id}><b>{goal.area}</b> +{count(goal.movement)} percentage points</p>)}</div><div><p className="eyebrow">Least movement</p>{review.movement.least.map((goal) => <p key={goal.id}><b>{goal.area}</b> +{count(goal.movement)} percentage points</p>)}</div></section>}

      {!!review.consistency.length && <Section eyebrow="Weekly consistency" title="What you returned to."><div className={styles.consistency}>{review.consistency.map((summary) => <article key={summary.key}><h3>{summary.label}</h3>{summary.weeks.map((week) => <p key={week.label}><span>{week.label}</span><b>{summary.key === "deep_work_minutes" ? duration(week.value) : count(week.value)}</b></p>)}</article>)}</div></Section>}

      <Section eyebrow="Milestones" title="The moments you explicitly marked.">{review.milestones.length ? <ul className={styles.milestones}>{review.milestones.map((milestone) => <li key={milestone.id}><Check size={16} /><span>{milestone.title}<small>{milestone.area} · {dateLabel(milestone.achievedAt)}</small></span></li>)}</ul> : <Empty text="No milestones were recorded in this season." />}</Section>

      <Section eyebrow="Your weeks" title="The focus and obstacles you recorded.">{review.weeklyReviews.length ? <div className={styles.weeks}>{review.weeklyReviews.map((week) => <article key={week.weekStart}><p>{dateLabel(week.weekStart)} — {dateLabel(week.weekEnd)}</p>{week.primaryFocus && <><h3>Focus</h3><blockquote>{week.primaryFocus}</blockquote></>}{week.obstacles && <><h3>Obstacle</h3><blockquote>{week.obstacles}</blockquote></>}{week.lesson && <><h3>Lesson</h3><blockquote>{week.lesson}</blockquote></>}</article>)}</div> : <Empty text="No completed weekly reviews were recorded in this season." />}</Section>

      <Section eyebrow="From your journal" title="A little context, in your own words.">{review.journalHighlights.length ? <div className={styles.journal}>{review.journalHighlights.map((entry) => <blockquote key={entry.id}>“{entry.content}”<footer>{dateLabel(entry.entryDate)}</footer></blockquote>)}</div> : <Empty text="No journal entries were recorded in this season." />}</Section>

      <section className={styles.reflection}><p className="eyebrow">Your reflection</p><h2>Interpret the evidence in your own words.</h2><label>What am I proud of from this season?<textarea value={form.proudOf} onChange={(event) => change("proudOf", event.target.value)} /></label><label>What changed the most?<textarea value={form.changedMost} onChange={(event) => change("changedMost", event.target.value)} /></label><label>What got in the way?<textarea value={form.obstacles} onChange={(event) => change("obstacles", event.target.value)} /></label><label>What did I learn?<textarea value={form.lesson} onChange={(event) => change("lesson", event.target.value)} /></label><label>What should I carry forward?<textarea value={form.carryForward} onChange={(event) => change("carryForward", event.target.value)} /></label><label>What should I leave behind?<textarea value={form.leaveBehind} onChange={(event) => change("leaveBehind", event.target.value)} /></label>{error && <p className={styles.error}>{error}</p>}<div><button disabled={saving} onClick={() => void save(false)}>{saving ? "Saving…" : "Save reflection"}</button><button className={styles.complete} disabled={saving || Boolean(review.reflection?.completedAt)} onClick={() => void save(true)}>{review.reflection?.completedAt ? "Season review complete" : "Complete Season Review"}</button></div></section>
    </>}
  </main>;
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <section className={styles.section}><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</section>; }
function Empty({ text }: { text: string }) { return <p className={styles.empty}>{text}</p>; }
