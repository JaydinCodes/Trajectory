"use client";

import Link from "next/link";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const areaColors: Record<string, string> = { Faith: "#7e2637", Fitness: "#ff6038", Odysseus: "#287da6", Ledgerly: "#17845f", Career: "#7956c8", Coding: "#18a5d2", Finance: "#c99726", Personal: "#be6178" };
type Area = { area: string; score: number };

export function LifeOrbit({ areas }: { areas: Area[] }) {
  const positions = [[50, 12], [78, 23], [89, 51], [72, 79], [48, 89], [23, 77], [10, 49], [23, 22]];
  return <div className="life-orbit" aria-label="Life area orbit"><div className="orbit-center"><b>OCT</b><span>LIVE</span></div>{areas.map((area, index) => { const [left, top] = positions[index % positions.length]; return <Link title={`${area.area}: ${area.score}%`} href={`/areas/${area.area.toLowerCase()}`} className="orbit-node" style={{ left: `${left}%`, top: `${top}%`, "--area": areaColors[area.area] ?? "#777", "--size": `${42 + area.score * .16}px` } as React.CSSProperties} key={area.area}><i>{area.score}</i><span>{area.area}</span></Link>; })}</div>;
}

export function ProgressChart({ score, expected }: { score: number; expected: number }) {
  const data = [{ day: "Season start", expected: 0, actual: 0 }, { day: "Today", expected, actual: score }];
  return <div className="trajectory-chart"><ResponsiveContainer width="100%" height={250}><LineChart data={data}><XAxis dataKey="day" tickLine={false} axisLine={false} /><YAxis hide domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="expected" stroke="#aaa69e" strokeDasharray="4 5" strokeWidth={2} /><Line type="monotone" dataKey="actual" stroke="#ff6038" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>;
}

export function Attention({ minutes, parts }: { minutes: number; parts: { name: string; value: number }[] }) {
  const total = parts.reduce((sum, item) => sum + item.value, 0);
  const display = total ? parts.map((item) => ({ ...item, percent: Math.round(item.value / total * 100) })) : [];
  return <div className="attention"><div className="attention-bar">{display.map((item) => <i key={item.name} style={{ width: `${item.percent}%`, background: areaColors[item.name] ?? "#857f74" }} />)}</div>{display.map((item) => <p key={item.name}><span>{item.name}</span><b>{item.percent}%</b></p>)}{!display.length && <p><span>No focused work recorded yet</span><b>—</b></p>}<small>This week · {Math.round(minutes / 60)}h focused work</small></div>;
}
