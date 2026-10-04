"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { localDate } from "@/lib/date-time";

export type QuickLogKind = "Scripture" | "Workout" | "Deep Work" | "DSA" | "Tutoring Revenue" | "Finance" | "Journal" | "Milestone" | "Mood";
const kinds: QuickLogKind[] = ["Scripture", "Workout", "Deep Work", "DSA", "Tutoring Revenue", "Journal", "Milestone", "Mood"];

type Preferences = { dsaPlatform: string; deepWorkArea: string };
const preferenceKey = "trajectory.quick-log-preferences";

function readPreferences(): Preferences {
  try {
    const value = JSON.parse(window.localStorage.getItem(preferenceKey) ?? "{}") as Partial<Preferences>;
    return { dsaPlatform: value.dsaPlatform ?? "LeetCode", deepWorkArea: value.deepWorkArea ?? "Career" };
  } catch { return { dsaPlatform: "LeetCode", deepWorkArea: "Career" }; }
}

function successMessage(kind: QuickLogKind, quantity: string) {
  if (kind === "DSA") return `DSA logged · +${quantity} problem${quantity === "1" ? "" : "s"}`;
  if (kind === "Workout") return "Workout saved";
  if (kind === "Scripture") return "Scripture logged";
  if (kind === "Deep Work") return `Deep work logged · ${quantity}m`;
  if (kind === "Tutoring Revenue") return "Tutoring revenue logged";
  return `${kind} saved`;
}

export function QuickLogDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (value: boolean) => void; onSaved?: (message: string) => void }) {
  const [kind, setKind] = useState<QuickLogKind>("Deep Work");
  const [detail, setDetail] = useState("");
  const [quantity, setQuantity] = useState("30");
  const [date, setDate] = useState(localDate());
  const [project, setProject] = useState("");
  const [area, setArea] = useState("Career");
  const [platform, setPlatform] = useState("LeetCode");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const preferences = readPreferences();
    setArea(preferences.deepWorkArea);
    setPlatform(preferences.dsaPlatform);
    setDate(localDate());
    setError("");
  }, [open]);

  function selectKind(value: QuickLogKind) {
    setKind(value); setDetail(""); setProject(""); setError("");
    setQuantity(value === "Mood" ? "5" : value === "DSA" ? "1" : value === "Tutoring Revenue" ? "0" : "30");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/quick-log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, detail: detail.trim(), quantity: Number(quantity), date, project: project.trim(), area, platform }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "We couldn't save that entry. Your details are still here.");
      const preferences: Preferences = { dsaPlatform: platform, deepWorkArea: area };
      window.localStorage.setItem(preferenceKey, JSON.stringify(preferences));
      const message = successMessage(kind, quantity);
      onOpenChange(false);
      onSaved?.(message);
      window.dispatchEvent(new Event("trajectory:data-changed"));
      setDetail(""); setProject("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn't save that entry. Your details are still here."); }
    finally { setSaving(false); }
  }

  const detailLabel = kind === "DSA" ? "Topic or category" : kind === "Scripture" ? "Book or passage" : kind === "Workout" ? "Workout type" : kind === "Deep Work" ? "What did you work on?" : kind === "Tutoring Revenue" ? "Student or context" : kind === "Mood" ? "A brief note" : kind;
  const quantityLabel = kind === "DSA" ? "Problems" : kind === "Scripture" || kind === "Workout" || kind === "Deep Work" ? "Minutes" : kind === "Tutoring Revenue" ? "Amount (ZAR)" : kind === "Mood" ? "Mood (1–10)" : "Value";
  const needsQuantity = !["Journal", "Milestone"].includes(kind);

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="quick-log-overlay" />
      <Dialog.Content className="quick-log-dialog" aria-describedby="quick-log-description">
        <div className="quick-log-heading"><div><p className="eyebrow">Quick log <kbd>L</kbd></p><Dialog.Title>What moved today?</Dialog.Title><Dialog.Description id="quick-log-description">Capture one meaningful piece of evidence. You can add detail later.</Dialog.Description></div><Dialog.Close aria-label="Close quick log"><X size={18} /></Dialog.Close></div>
        <div className="quick-log-kinds" aria-label="Log type">{kinds.map((value) => <button type="button" className={kind === value ? "selected" : ""} onClick={() => selectKind(value)} key={value}>{value}</button>)}</div>
        <form onSubmit={submit}>
          <label>{detailLabel}<input name="detail" value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={kind === "DSA" ? "Arrays, graphs, or a problem set" : kind === "Scripture" ? "e.g. John 15" : "Add a concise detail"} autoFocus required /></label>
          {needsQuantity && <label>{quantityLabel}<input name="quantity" type="number" min={kind === "Tutoring Revenue" ? "0.01" : "1"} max={kind === "Mood" ? "10" : undefined} value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>}
          {kind === "DSA" && <label>Platform <input name="platform" value={platform} onChange={(event) => setPlatform(event.target.value)} placeholder="LeetCode" /></label>}
          {kind === "Deep Work" && <div className="quick-log-two-column"><label>Area<select value={area} onChange={(event) => setArea(event.target.value)}><option>Career</option><option>Coding</option><option>Odysseus</option><option>Ledgerly</option><option>Personal</option></select></label><label>Project <input value={project} onChange={(event) => setProject(event.target.value)} placeholder="Optional project" /></label></div>}
          {kind === "Tutoring Revenue" && <label>Project <input value={project} onChange={(event) => setProject(event.target.value)} placeholder="Odysseus" /></label>}
          {kind === "Workout" && <Link className="quick-log-detail-link" href="/log/workout" onClick={() => onOpenChange(false)}>Need sets and exercises? Open detailed workout →</Link>}
          <label>Date <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="quick-log-actions"><button className="primary-action" disabled={saving}>{saving ? "Saving…" : "Log evidence"}</button><Dialog.Close type="button">Cancel</Dialog.Close></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
