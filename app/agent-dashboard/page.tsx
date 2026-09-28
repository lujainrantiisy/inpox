import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import AutoRefresh from "./AutoRefresh";
export const dynamic = "force-dynamic";
type Row = {
  created_at: string;
  input_text: string | null;
  confidence: number | string | null;
  flag_human: boolean | null;
  reason: string | null;
};

type Filter = "all" | "flagged" | "low";

export default async function AgentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; filter?: string }>;
}) {
  const { key, filter: rawFilter } = await searchParams;
  if (!process.env.DASHBOARD_KEY || key !== process.env.DASHBOARD_KEY) {
    return <main style={{ padding: 24 }}>Not authorized</main>;
  }

  const filter: Filter =
    rawFilter === "flagged" || rawFilter === "low" ? rawFilter : "all";

  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("agent_decisions")
    .select("created_at, input_text, confidence, flag_human, reason")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return <main style={{ padding: 24 }}>Error: {error.message}</main>;
  }

  const rows: Row[] = data ?? [];

  const isLow = (r: Row) => r.confidence != null && Number(r.confidence) < 0.5;
  const isFlagged = (r: Row) => !!r.flag_human;

  // الأرقام دايماً من كل الـ rows، والجدول بس هو اللي بيتفلتر
  const lowCount = rows.filter(isLow).length;
  const flaggedCount = rows.filter(isFlagged).length;

  const visible =
    filter === "low"
      ? rows.filter(isLow)
      : filter === "flagged"
      ? rows.filter(isFlagged)
      : rows;

  // لو الكرت مختار وضغطتي عليه ثاني مرة، بترجعي للكل
  const hrefFor = (target: Filter) => {
    const next = filter === target ? "all" : target;
    const base = `/agent-dashboard?key=${encodeURIComponent(key!)}`;
    return next === "all" ? base : `${base}&filter=${next}`;
  };

  const cardStyle = (active: boolean): React.CSSProperties => ({
    border: active ? "2px solid #2563eb" : "1px solid #ddd",
    background: active ? "#eff6ff" : "white",
    borderRadius: 8,
    padding: 16,
    minWidth: 140,
    textDecoration: "none",
    color: "inherit",
    display: "block",
  });

  const cards: { label: string; value: number; target: Filter }[] = [
    { label: "TURNS", value: rows.length, target: "all" },
    { label: "LOW CONFIDENCE", value: lowCount, target: "low" },
    { label: "FLAGGED TO HUMAN", value: flaggedCount, target: "flagged" },
  ];

  const filterLabel =
    filter === "low"
      ? "Low confidence only"
      : filter === "flagged"
      ? "Flagged to human only"
      : "All turns";

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Agent Dashboard (last 7 days)</h1>
<AutoRefresh seconds={6} />

      <div style={{ display: "flex", gap: 16, margin: "16px 0", flexWrap: "wrap" }}>
        {cards.map((c) => (
          <Link
            key={c.label}
            href={hrefFor(c.target)}
            style={cardStyle(filter === c.target)}
          >
            <div>{c.label}</div>
            <strong style={{ fontSize: 28 }}>{c.value}</strong>
          </Link>
        ))}
      </div>

      <p style={{ color: "#555" }}>
        {filterLabel} — showing {visible.length} of {rows.length}
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["Time", "Input", "Conf.", "Flag", "Reason"].map((h) => (
                <th
                  key={h}
                  style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 8 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: "#777" }}>
                  No rows for this filter.
                </td>
              </tr>
            ) : (
              visible.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{r.input_text}</td>
                  <td style={{ padding: 8 }}>{r.confidence}</td>
                  <td style={{ padding: 8 }}>{r.flag_human ? "🚩" : ""}</td>
                  <td style={{ padding: 8 }}>{r.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}