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
    return (
      <main style={{ padding: 40, background: "#0B1622", color: "#ef4444", fontFamily: "sans-serif", minHeight: "100vh" }}>
        Not authorized
      </main>
    );
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
    return (
      <main style={{ padding: 40, background: "#0B1622", color: "#ef4444", fontFamily: "sans-serif", minHeight: "100vh" }}>
        Error: {error.message}
      </main>
    );
  }

  const rows: Row[] = data ?? [];

  const isLow = (r: Row) => r.confidence != null && Number(r.confidence) < 0.5;
  const isFlagged = (r: Row) => !!r.flag_human;

  const lowCount = rows.filter(isLow).length;
  const flaggedCount = rows.filter(isFlagged).length;

  const visible =
    filter === "low"
      ? rows.filter(isLow)
      : filter === "flagged"
      ? rows.filter(isFlagged)
      : rows;

  const hrefFor = (target: Filter) => {
    const next = filter === target ? "all" : target;
    const base = `/agent-dashboard?key=${encodeURIComponent(key!)}`;
    return next === "all" ? base : `${base}&filter=${next}`;
  };

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
    <main
      style={{
        backgroundColor: "#0B1622",
        color: "#F1F5F9",
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(34, 211, 238, 0.18)",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#F1F5F9" }}>
            Agent Dashboard <span style={{ fontSize: "14px", color: "#8FA3B8", fontWeight: 400 }}>(last 7 days)</span>
          </h1>
          <AutoRefresh seconds={6} />
        </div>

        {/* Filter Cards */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
          {cards.map((c) => {
            const isActive = filter === c.target;
            return (
              <Link
                key={c.label}
                href={hrefFor(c.target)}
                style={{
                  flex: "1 1 200px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: isActive ? "rgba(34, 211, 238, 0.1)" : "rgba(255, 255, 255, 0.04)",
                  border: isActive ? "1px solid #22D3EE" : "1px solid rgba(34, 211, 238, 0.18)",
                  color: "#F1F5F9",
                  textDecoration: "none",
                  display: "block",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ fontSize: "12px", color: "#8FA3B8", fontWeight: 600, marginBottom: "8px" }}>
                  {c.label}
                </div>
                <strong style={{ fontSize: "28px", color: isActive ? "#22D3EE" : "#F1F5F9" }}>
                  {c.value}
                </strong>
              </Link>
            );
          })}
        </div>

        {/* Info label */}
        <p style={{ color: "#8FA3B8", fontSize: "14px", marginBottom: "16px" }}>
          {filterLabel} — showing <strong style={{ color: "#22D3EE" }}>{visible.length}</strong> of {rows.length}
        </p>

        {/* Table Container with Vertical & Horizontal Scroll */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(34, 211, 238, 0.18)",
            borderRadius: "12px",
            maxHeight: "600px",
            overflowX: "auto",
            overflowY: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr
                style={{
                  background: "#0F1E2E",
                  borderBottom: "1px solid rgba(34, 211, 238, 0.18)",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                <th style={{ padding: "12px 16px", color: "#8FA3B8", fontWeight: 600 }}>Time</th>
                <th style={{ padding: "12px 16px", color: "#8FA3B8", fontWeight: 600 }}>Input</th>
                <th style={{ padding: "12px 16px", color: "#8FA3B8", fontWeight: 600 }}>Conf.</th>
                <th style={{ padding: "12px 16px", color: "#8FA3B8", fontWeight: 600 }}>Flag</th>
                <th style={{ padding: "12px 16px", color: "#8FA3B8", fontWeight: 600 }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#8FA3B8" }}>
                    No rows for this filter.
                  </td>
                </tr>
              ) : (
                visible.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "12px 16px", color: "#8FA3B8", whiteSpace: "nowrap", fontSize: "12px" }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#F1F5F9", maxWidth: "300px" }}>
                      {r.input_text ?? "-"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#22D3EE", fontWeight: "bold" }}>
                      {r.confidence != null ? Number(r.confidence).toFixed(2) : "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {r.flag_human ? "🚩" : ""}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#8FA3B8", fontSize: "13px" }}>
                      {r.reason ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}