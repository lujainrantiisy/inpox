"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    // Refresh Server Component state before redirecting
    router.refresh();
    router.replace("/");
  }

  return (
    <main style={{ maxWidth: 360, margin: "15vh auto", padding: 16 }}>
      <h1>Sign in</h1>
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="email" style={{ display: "none" }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <label htmlFor="password" style={{ display: "none" }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {error && (
          <p role="alert" style={{ color: "crimson", margin: 0 }}>
            {error}
          </p>
        )}
      </form>
    </main>
  );
}