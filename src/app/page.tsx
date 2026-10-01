"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  Attention,
  areaColors,
  LifeOrbit,
  ProgressChart,
} from "@/components/dashboard-visuals";
import { formatDashboardDate, localDate } from "@/lib/date-time";
type Area = {
  area: string;
  score: number;
  expected: number;
  delta: number;
  momentum:
    "accelerating" | "steady" | "slowing" | "stalled" | "insufficient_data";
};
type Goal = {
  id: number;
  area: string;
  title: string;
  target: number;
  current: number;
};
type Dashboard = {
  score: number;
  expected: number;
  delta: number;
  projected: number;
  season: { name: string; theme: string };
  seasonProgress: { percentage: number };
  deepWorkMinutes: number;
  areas: Area[];
  goals: Goal[];
};
type Entry = {
  id: number;
  type: string;
  detail: string;
  amount: number | null;
  entry_date: string;
  area: string | null;
  project: string | null;
};
type Journal = {
  id: number;
  content: string;
  entry_type: string;
  entry_date: string;
};
const areaOrder = [
  "Faith",
  "Fitness",
  "Odysseus",
  "Ledgerly",
  "Career",
  "Coding",
  "Finance",
  "Personal",
];
const logKinds = [
  "Scripture",
  "Workout",
  "Deep Work",
  "DSA",
  "Tutoring Revenue",
  "Finance",
  "Journal",
  "Milestone",
  "Mood",
];
export default function Home() {
  const [data, setData] = useState<Dashboard>(),
    [entries, setEntries] = useState<Entry[]>([]),
    [journal, setJournal] = useState<Journal[]>([]),
    [open, setOpen] = useState(false),
    [kind, setKind] = useState("Deep Work"),
    [detail, setDetail] = useState(""),
    [quantity, setQuantity] = useState("30"),
    [date, setDate] = useState(localDate()),
    [project, setProject] = useState(""),
    [error, setError] = useState("");
  const reload = async () => {
    const [dashboard, entryList, journalList] = await Promise.all(
      ["/api/dashboard", "/api/entries", "/api/journal"].map((url) =>
        fetch(url).then((response) => response.json()),
      ),
    );
    setData(dashboard);
    setEntries(entryList);
    setJournal(journalList);
  };
  useEffect(() => {
    void reload();
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "l" &&
        !(
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        )
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  async function log(event: React.FormEvent) {
    event.preventDefault();
    if (!detail.trim()) return;
    const response = await fetch("/api/quick-log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind,
        detail: detail.trim(),
        quantity: Number(quantity),
        date,
        project,
      }),
    });
    if (!response.ok) {
      setError((await response.json()).error ?? "Could not save this record.");
      return;
    }
    setDetail("");
    setProject("");
    setError("");
    setOpen(false);
    void reload();
  }
  const areas = areaOrder.map(
    (area) =>
      data?.areas?.find((item) => item.area === area) ?? {
        area,
        score: 0,
        expected: 0,
        delta: 0,
        momentum: "insufficient_data" as const,
      },
  );
  const attentionParts = Object.entries(
    entries
      .filter((entry) => entry.area || entry.project)
      .reduce<Record<string, number>>((total, entry) => {
        const key = entry.project ?? entry.area;
        if (key) total[key] = (total[key] ?? 0) + Number(entry.amount ?? 0);
        return total;
      }, {}),
  ).map(([name, value]) => ({ name, value }));
  const latest = journal[0];
  return (
    <main className="app-shell">
      <div className="dashboard">
        <header className="topline">
          <div>
            <p>{formatDashboardDate()}</p>
            <h1>Good morning, Jaydin.</h1>
          </div>
          <div className="top-actions">
            <Link href="/search">
              <Search size={16} /> Search
            </Link>
            <button className="primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> Quick log
            </button>
          </div>
        </header>
        <p className="month-context">
          {data?.season?.name ?? "Current season"} · {data?.season?.theme ?? ""}{" "}
          · {(data?.seasonProgress?.percentage ?? 0).toFixed(0)}% of the season
          has elapsed
        </p>
        <section className="performance-hero">
          <div className="hero-copy">
            <p className="eyebrow2">{data?.season?.name ?? "Current season"}</p>
            <h2>{data?.season?.theme ?? "Set a season"}</h2>
            <div className="score-row">
              <strong>{data?.score ?? 0}</strong>
              <div>
                <b>Trajectory</b>
                <span>
                  {data
                    ? `${data.delta >= 0 ? "+" : ""}${data.delta} vs expected pace`
                    : "Calculating from your evidence"}
                </span>
              </div>
            </div>
            <p className="delta">
              Actual {data?.score ?? 0}% · Expected {data?.expected ?? 0}% ·
              Projected finish {data?.projected ?? 0}%
            </p>
            <q>
              {data?.goals?.length
                ? "Your trajectory is calculated from goals and recorded evidence."
                : "Create a goal, then log evidence to see your trajectory."}
            </q>
          </div>
          <div className="orbit-panel">
            <LifeOrbit areas={areas} />
          </div>
        </section>
        <section className="momentum-strip">
          {areas.map((area) => (
            <Link
              href={`/areas/${area.area.toLowerCase()}`}
              className="momentum"
              style={
                {
                  "--area": areaColors[area.area] ?? "#777",
                } as React.CSSProperties
              }
              key={area.area}
            >
              <b>{area.area}</b>
              <em>{area.momentum.replace("_", " ")}</em>
              <small>
                {area.score
                  ? `${area.score}% actual · ${area.expected}% expected`
                  : "No goal yet"}
              </small>
            </Link>
          ))}
        </section>
        <section className="today-grid">
          <div className="today-timeline">
            <p className="eyebrow2">Today</p>
            <h2 className="section-title">What moved today?</h2>
            {entries.slice(0, 3).map((entry, index) => (
              <Event
                key={`${entry.type}-${entry.id}`}
                time={index === 0 ? "Latest" : entry.entry_date.slice(5)}
                title={entry.type}
                detail={entry.detail}
                color={areaColors[entry.area ?? "Career"] ?? "#777"}
              />
            ))}
            {!entries.length && (
              <p className="empty-state">
                Nothing logged yet. Start with one honest piece of evidence.
              </p>
            )}
            <button className="event-add" onClick={() => setOpen(true)}>
              <Plus size={16} /> Log something
            </button>
          </div>
          <div className="attention-section">
            <p className="eyebrow2">Where your attention went</p>
            <h2 className="section-title">Focused, not fragmented.</h2>
            <Attention
              minutes={data?.deepWorkMinutes ?? 0}
              parts={attentionParts}
            />
          </div>
        </section>
        <section className="chart-section">
          <div className="chart-heading">
            <div>
              <p className="eyebrow2">Trajectory vs time</p>
              <h2 className="section-title">Actual life progress</h2>
            </div>
            <p>
              Actual progress in orange. Expected season pace in the dotted
              line.
            </p>
          </div>
          <ProgressChart
            score={data?.score ?? 0}
            expected={data?.expected ?? 0}
          />
        </section>
        <section className="horizon">
          <p className="eyebrow2">On the horizon</p>
          <h2 className="section-title">What you are approaching.</h2>
          <div className="horizon-items">
            {data?.goals?.slice(0, 4).map((goal) => (
              <Link href={`/areas/${goal.area.toLowerCase()}`} key={goal.id}>
                <b>{goal.area}</b>
                <span>
                  {goal.title} ·{" "}
                  {Math.max(0, Math.round(goal.target - goal.current))}{" "}
                  remaining
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="journal-quote">
          “
          {latest?.content ??
            "A journal becomes useful when it makes the next honest action easier to see."}
          ”
          <footer>
            {latest ? `${latest.entry_date} · ${latest.entry_type} · ` : ""}
            <Link href="/journal">Read reflection →</Link>
          </footer>
        </section>
      </div>
      {open && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={log}>
            <p className="eyebrow2">Quick log · L</p>
            <h2>What moved today?</h2>
            <div className="log-kinds">
              {logKinds.map((value) => (
                <button
                  type="button"
                  className={kind === value ? "selected" : ""}
                  onClick={() => setKind(value)}
                  key={value}
                >
                  {value}
                </button>
              ))}
            </div>
            <label>
              {kind}
              <input
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                autoFocus
                placeholder={
                  kind === "DSA"
                    ? "Topic or category"
                    : kind === "Scripture"
                      ? "Book or passage"
                      : `${kind} details`
                }
              />
            </label>
            {!["Journal", "Milestone"].includes(kind) && (
              <label>
                {kind === "DSA"
                  ? "Problems"
                  : kind === "Tutoring Revenue" || kind === "Finance"
                    ? "Amount"
                    : kind === "Mood"
                      ? "Mood (1–10)"
                      : "Minutes"}
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </label>
            )}
            {["Deep Work", "Tutoring Revenue"].includes(kind) && (
              <label>
                Project
                <input
                  value={project}
                  onChange={(event) => setProject(event.target.value)}
                  placeholder={
                    kind === "Tutoring Revenue" ? "Odysseus" : "Optional project"
                  }
                />
              </label>
            )}
            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            {error && <p className="saved-note">{error}</p>}
            <button className="save">Log it</button>
            <button type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
function Event({
  time,
  title,
  detail,
  color,
}: {
  time: string;
  title: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="event">
      <time>{time}</time>
      <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12 }}>
        <b>{title}</b>
        <small>{detail}</small>
      </div>
    </div>
  );
}
