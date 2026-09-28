import { createClient } from "@supabase/supabase-js";

// يعيد الحساب كل زيارة، ما يكاشي وقت الـ build
export const dynamic = "force-dynamic";

type Row = {
  created_at: string;
  input_text: string | null;
  confidence: number | string | null;
  flag_human: boolean | null;
  reason: string | null;
};

export default async function AgentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  // حماية بسيطة: الصفحة ما بتفتح إلا مع ?key=...
  const { key } = await searchParams;
  if (!process.env.DASHBOARD_KEY || key !== process.env.DASHBOARD_KEY) {
    return <main style={{ padding: 24 }}>Not authorized</main>;
  }

  // client على السيرفر فقط، بالمفتاح السري
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
  const lowConf = rows.filter((r) => Number(r.confidence) < 0.5).length;
  const flagged = rows.filter((r) => r.flag_human).length;

  const card: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    minWidth: 140,
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Agent Dashboard (last 7 days)</h1>

      <div style={{ display: "flex", gap: 16, margin: "16px 0" }}>
        <div style={card}>
          <div>TURNS</div>
          <strong style={{ fontSize: 28 }}>{rows.length}</strong>
        </div>
        <div style={card}>
          <div>LOW CONFIDENCE</div>
          <strong style={{ fontSize: 28 }}>{lowConf}</strong>
        </div>
        <div style={card}>
          <div>FLAGGED TO HUMAN</div>
          <strong style={{ fontSize: 28 }}>{flagged}</strong>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["Time", "Input", "Conf.", "Flag", "Reason"].map((h) => (
                <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 8 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{r.input_text}</td>
                <td style={{ padding: 8 }}>{r.confidence}</td>
                <td style={{ padding: 8 }}>{r.flag_human ? "🚩" : ""}</td>
                <td style={{ padding: 8 }}>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}