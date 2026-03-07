import { useState, useEffect, useRef } from "react";

/* ═══════════════════════ UTILITIES ═══════════════════════ */
const DB = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

async function callAI(sys, usr) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: sys,
      messages: [{ role: "user", content: usr }],
    }),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "";
}

/* ═══════════════════════ CONSTANTS ═══════════════════════ */
const FONTS = ["Georgia", "Arial", "Times New Roman", "Garamond", "Verdana", "Calibri", "Helvetica Neue"];
const THEMES = [
  { id: "indigo", name: "Indigo", accent: "#4f46e5", bg: "#eef2ff" },
  { id: "ocean",  name: "Ocean",  accent: "#0284c7", bg: "#e0f2fe" },
  { id: "slate",  name: "Slate",  accent: "#334155", bg: "#f1f5f9" },
  { id: "rose",   name: "Rose",   accent: "#be185d", bg: "#fdf2f8" },
  { id: "forest", name: "Forest", accent: "#047857", bg: "#ecfdf5" },
  { id: "amber",  name: "Amber",  accent: "#b45309", bg: "#fffbeb" },
];
const EMPTY_PROFILE = {
  name: "", headline: "", email: "", phone: "", location: "",
  linkedin: "", github: "", summary: "", skills: "", certifications: "",
  experience: [{ id: 1, company: "", role: "", from: "", to: "", bullets: "" }],
  education: [{ id: 1, school: "", degree: "", year: "", gpa: "" }],
};
const NAV = [
  { id: "dashboard", label: "Dashboard",   icon: "⊞" },
  { id: "apply",     label: "Quick Apply", icon: "⚡", badge: "AI" },
  { id: "resumes",   label: "My Resumes",  icon: "📄" },
  { id: "profile",   label: "My Profile",  icon: "👤" },
];

/* ═══════════════════════ MICRO UI ═══════════════════════ */
function Toast({ msg, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  const ok = type === "success";
  return (
    <div style={{
      position: "fixed", top: 22, right: 22, zIndex: 9999,
      padding: "12px 18px", borderRadius: 12, backdropFilter: "blur(20px)",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      background: ok ? "rgba(34,197,94,.14)" : "rgba(239,68,68,.14)",
      border: `1px solid ${ok ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"}`,
      color: ok ? "#22c55e" : "#f87171", fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,.35)",
      display: "flex", alignItems: "center", gap: 8,
      animation: "slideIn .3s ease"
    }}>
      {ok ? "✓" : "✗"} {msg}
    </div>
  );
}

function GlassInput({ label, val, set, ph, type = "text", half }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: half ? "1 1 calc(50% - 6px)" : "1 1 100%", minWidth: 0 }}>
      {label && <label style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</label>}
      <input
        type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
        style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "all .2s" }}
        onFocus={e => { e.target.style.border = "1px solid rgba(99,102,241,.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,.12)"; }}
        onBlur={e => { e.target.style.border = "1px solid rgba(99,102,241,.2)"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function GlassTextarea({ label, val, set, ph, rows = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 100%" }}>
      {label && <label style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</label>}
      <textarea
        value={val} onChange={e => set(e.target.value)} placeholder={ph} rows={rows}
        style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", transition: "all .2s" }}
        onFocus={e => { e.target.style.border = "1px solid rgba(99,102,241,.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,.12)"; }}
        onBlur={e => { e.target.style.border = "1px solid rgba(99,102,241,.2)"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function Btn({ ch, onClick, v = "p", disabled, s = {} }) {
  const vs = {
    p: { background: disabled ? "#1a1a3a" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: disabled ? "#3a3a6a" : "#fff", boxShadow: disabled ? "none" : "0 4px 20px rgba(99,102,241,.35)" },
    g: { background: "rgba(99,102,241,.1)", color: "#a78bfa", border: "1px solid rgba(99,102,241,.25)" },
    d: { background: "rgba(239,68,68,.08)", color: "#f87171", border: "1px solid rgba(239,68,68,.2)" },
    w: { background: "rgba(255,255,255,.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,.1)" },
    ghost: { background: "transparent", color: "#64748b", border: "1px solid rgba(255,255,255,.08)" },
    success: { background: "rgba(34,197,94,.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,.25)" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 22px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .2s", ...vs[v], ...s }}>
      {ch}
    </button>
  );
}

/* CRITICAL: Must be module-level — never inside another component */
function SectionCard({ title, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(99,102,241,.12)", borderRadius: 16, padding: "20px 22px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,.3))" }} />
        <span style={{ fontSize: 9, color: "#6366f1", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(99,102,241,.3),transparent)" }} />
      </div>
      {children}
    </div>
  );
}

function ToolBtn({ onExec, active, title, children }) {
  return (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); onExec(); }}
      style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontFamily: "serif", fontSize: 14, transition: "all .15s", background: active ? "rgba(99,102,241,.25)" : "transparent", color: active ? "#a78bfa" : "#94a3b8" }}>
      {children}
    </button>
  );
}

/* ═══════════════════════ LANDING PAGE ═══════════════════════ */
function Landing({ goto }) {
  const features = [
    { e: "🎯", t: "ATS Optimized", d: "Every resume is engineered to pass Applicant Tracking Systems with the highest possible match score." },
    { e: "⚡", t: "30-Second Resume", d: "Paste a job description and get a fully tailored, recruiter-ready resume in seconds — not hours." },
    { e: "✏️", t: "Rich Editor", d: "Fine-tune with Word-like tools — fonts, colors, 6 templates, section reordering and inline editing." },
    { e: "🔒", t: "Profile Once", d: "Build your master profile once. AI uses it for every job automatically. No re-entering data." },
    { e: "🧠", t: "Claude AI Core", d: "Built on Anthropic's Claude — the most nuanced AI for understanding context, tone, and keywords." },
    { e: "📊", t: "Match Score", d: "See your resume's ATS match percentage before you apply. No more guessing if you're qualified." },
  ];
  const steps = [
    { n: "01", t: "Build Once", d: "Create your master profile with all your experience, skills, and achievements." },
    { n: "02", t: "Paste Any JD", d: "Copy any job description from LinkedIn, Indeed, or any careers page and paste it in." },
    { n: "03", t: "AI Tailors It", d: "Claude rewrites your resume with the exact language, keywords, and tone the recruiter wants." },
    { n: "04", t: "Edit & Download", d: "Fine-tune in our rich editor, pick a theme, then download as a perfect PDF and apply." },
  ];
  return (
    <div style={{ background: "#050512", color: "#e2e8f0", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 52px", borderBottom: "1px solid rgba(255,255,255,.04)", position: "sticky", top: 0, background: "rgba(5,5,18,.92)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 33, height: 33, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 18px rgba(99,102,241,.5)" }}>✦</div>
          <span style={{ fontSize: 16, fontWeight: 900, background: "linear-gradient(135deg,#818cf8,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ResumeAI</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn ch="Log In" v="w" onClick={() => goto("login")} s={{ padding: "8px 20px", fontSize: 13 }} />
          <Btn ch="Get Started Free →" onClick={() => goto("signup")} s={{ padding: "8px 20px", fontSize: 13 }} />
        </div>
      </nav>

      <div style={{ position: "relative", overflow: "hidden", padding: "90px 52px 70px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "10%", left: "12%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.11) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "15%", right: "8%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)", borderRadius: 99, padding: "6px 16px", marginBottom: 24, fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block", animation: "pulse 2s infinite" }} /> Powered by Claude AI · Free to start
          </div>
          <h1 style={{ fontSize: 60, fontWeight: 900, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: -1 }}>
            Land Your Dream Job<br />
            <span style={{ background: "linear-gradient(135deg,#818cf8,#c4b5fd,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>in 30 Seconds</span>
          </h1>
          <p style={{ fontSize: 17, color: "#64748b", lineHeight: 1.7, margin: "0 0 34px", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Paste any job description. AI builds a perfectly tailored, ATS-optimized resume from your saved profile — instantly.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <Btn ch="🚀 Create Free Account" onClick={() => goto("signup")} s={{ padding: "13px 36px", fontSize: 15, borderRadius: 12 }} />
            <Btn ch="See How It Works ↓" v="w" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} s={{ padding: "13px 26px", fontSize: 15, borderRadius: 12 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.04)", background: "rgba(255,255,255,.01)" }}>
        {[["10K+", "Resumes Generated"], ["87%", "Interview Rate"], ["3x", "Faster Hiring"], ["60s", "Avg. Time to Resume"]].map(([n, l], i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "26px 16px", borderRight: i < 3 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
            <div style={{ fontSize: 26, fontWeight: 900, background: "linear-gradient(135deg,#818cf8,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "72px 52px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Everything You Need</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>Built for serious job seekers</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: "24px 22px", transition: "all .25s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.e}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 7 }}>{f.t}</div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div id="how" style={{ padding: "72px 52px", background: "rgba(99,102,241,.03)", borderTop: "1px solid rgba(99,102,241,.08)", borderBottom: "1px solid rgba(99,102,241,.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Simple Process</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>From zero to hired</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, maxWidth: 960, margin: "0 auto" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: "center", position: "relative" }}>
              {i < 3 && <div style={{ position: "absolute", top: 21, left: "calc(50% + 28px)", right: "calc(-50% + 28px)", height: 1, background: "linear-gradient(90deg,rgba(99,102,241,.4),rgba(99,102,241,.08))" }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,rgba(99,102,241,.18),rgba(139,92,246,.18))", border: "1px solid rgba(99,102,241,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 12, fontWeight: 900, color: "#a78bfa" }}>{s.n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 5 }}>{s.t}</div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "72px 52px", textAlign: "center" }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: "#e2e8f0", margin: "0 0 10px" }}>Ready to land your next role?</h2>
        <p style={{ color: "#475569", marginBottom: 28, fontSize: 14 }}>Join thousands already using ResumeAI Pro. Free forever.</p>
        <Btn ch="🚀 Get Started Free" onClick={() => goto("signup")} s={{ padding: "14px 48px", fontSize: 15, borderRadius: 12 }} />
      </div>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,.04)", padding: "18px 52px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#1e1e3a", fontWeight: 700 }}>✦ ResumeAI Pro</span>
        <span style={{ fontSize: 11, color: "#1e1e3a" }}>Powered by Claude AI · For job seekers everywhere</span>
      </footer>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

/* ═══════════════════════ AUTH PAGE ═══════════════════════ */
function AuthPage({ mode, goto, setUser, toast }) {
  const [tab, setTab] = useState(mode);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

  const login = () => {
    setErr(""); setLoading(true);
    const u = DB.get(`user:${email.toLowerCase().trim()}`);
    if (!u) { setErr("No account found with that email."); setLoading(false); return; }
    if (u.password !== password) { setErr("Incorrect password. Please try again."); setLoading(false); return; }
    DB.set("session", { email: u.email });
    setUser(u); toast(`Welcome back, ${u.name.split(" ")[0]}! 👋`);
    goto(u.profileComplete ? "dashboard" : "onboarding");
    setLoading(false);
  };

  const signup = () => {
    setErr(""); setLoading(true);
    if (!name.trim() || !email.trim() || !password.trim()) { setErr("Please fill in all fields."); setLoading(false); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); setLoading(false); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setErr("Please enter a valid email address."); setLoading(false); return; }
    if (DB.get(`user:${email.toLowerCase().trim()}`)) { setErr("An account already exists with this email."); setLoading(false); return; }
    const u = { name: name.trim(), email: email.toLowerCase().trim(), password, profileComplete: false, profile: { ...EMPTY_PROFILE, email: email.toLowerCase().trim(), name: name.trim() }, resumes: [], createdAt: Date.now() };
    DB.set(`user:${u.email}`, u); DB.set("session", { email: u.email });
    setUser(u); toast("Account created! Let's set up your profile 🎉");
    goto("onboarding"); setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050512", display: "flex", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ width: "44%", background: "linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.07))", borderRight: "1px solid rgba(99,102,241,.14)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 50px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56, cursor: "pointer" }} onClick={() => goto("landing")}>
            <div style={{ width: 35, height: 35, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>✦</div>
            <span style={{ fontSize: 17, fontWeight: 900, background: "linear-gradient(135deg,#818cf8,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ResumeAI</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#e2e8f0", lineHeight: 1.25, margin: "0 0 14px" }}>Your career,<br />on autopilot.</h2>
          <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.7, marginBottom: 32 }}>Build once. Apply everywhere. Let AI tailor every resume to every job — in seconds.</p>
          {["One profile, infinite applications", "ATS score before you apply", "6 professional templates", "Download as PDF instantly"].map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#6366f1", fontWeight: 700 }}>✦</span>{t}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,.04)", borderRadius: 12, padding: 4, marginBottom: 26, border: "1px solid rgba(255,255,255,.06)" }}>
            {["login", "signup"].map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(""); }}
                style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .2s", background: tab === t ? "rgba(99,102,241,.75)" : "transparent", color: tab === t ? "#fff" : "#475569" }}>
                {t === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: "0 0 4px" }}>{tab === "login" ? "Welcome back 👋" : "Create your account"}</h2>
          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 20px" }}>{tab === "login" ? "Sign in to access your profile and resumes." : "Start landing more interviews today. Free forever."}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tab === "signup" && <GlassInput label="Full Name" val={name} set={setName} ph="Jane Smith" />}
            <GlassInput label="Email Address" val={email} set={setEmail} ph="jane@email.com" type="email" />
            <GlassInput label="Password" val={password} set={setPassword} ph={tab === "signup" ? "Min. 6 characters" : "Your password"} type="password" />
          </div>
          {err && <div style={{ marginTop: 10, padding: "10px 13px", background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 9, fontSize: 12, color: "#f87171" }}>{err}</div>}
          <Btn ch={loading ? (tab === "login" ? "Signing in..." : "Creating account...") : (tab === "login" ? "Sign In →" : "Create Account →")}
            onClick={tab === "login" ? login : signup} disabled={loading} s={{ width: "100%", padding: "13px", marginTop: 16, fontSize: 14, borderRadius: 11 }} />
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#334155" }}>
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setTab(tab === "login" ? "signup" : "login"); setErr(""); }}
              style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>
              {tab === "login" ? "Sign Up" : "Log In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ ONBOARDING ═══════════════════════ */
function Onboarding({ user, setUser, goto, toast }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(user?.profile || EMPTY_PROFILE);
  const set = k => v => setForm(p => ({ ...p, [k]: v }));
  const setExp = (i, k) => v => setForm(p => { const e = [...p.experience]; e[i] = { ...e[i], [k]: v }; return { ...p, experience: e }; });
  const setEdu = (i, k) => v => setForm(p => { const e = [...p.education]; e[i] = { ...e[i], [k]: v }; return { ...p, education: e }; });
  const STEPS = ["Personal Info", "Experience", "Education & Skills", "You're Ready!"];

  const save = () => {
    const updated = { ...user, profile: form, profileComplete: true };
    DB.set(`user:${user.email}`, updated);
    setUser(updated); toast("Profile saved! Ready to generate resumes 🚀");
    goto("dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050512", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 20px" }}>
      <div style={{ width: "100%", maxWidth: 620, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, transition: "all .3s", background: i < step ? "#6366f1" : i === step ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,.04)", border: i <= step ? "2px solid #6366f1" : "2px solid rgba(255,255,255,.08)", color: i <= step ? "#fff" : "#2a2a4a", boxShadow: i === step ? "0 0 14px rgba(99,102,241,.5)" : "none" }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 9, color: i === step ? "#a78bfa" : i < step ? "#6366f1" : "#2a2a4a", fontWeight: i === step ? 700 : 400, textAlign: "center", maxWidth: 58, whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 64, height: 1, margin: "0 3px", marginBottom: 18, background: i < step ? "#6366f1" : "rgba(255,255,255,.06)", transition: "all .3s" }} />}
            </div>
          ))}
        </div>
        <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round((step / (STEPS.length - 1)) * 100)}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 3, transition: "width .5s ease" }} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 620 }}>
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 4 }}>Tell us about yourself</h2>
            <p style={{ color: "#475569", fontSize: 13, marginBottom: 18 }}>This becomes your master profile — used for every resume you generate.</p>
            <SectionCard title="Basic Information">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <GlassInput label="Full Name" val={form.name} set={set("name")} ph="Jane Smith" half />
                <GlassInput label="Professional Headline" val={form.headline} set={set("headline")} ph="Senior Software Engineer" half />
                <GlassInput label="Location" val={form.location} set={set("location")} ph="San Francisco, CA" half />
                <GlassInput label="Phone" val={form.phone} set={set("phone")} ph="+1 555 000 0000" half />
                <GlassInput label="LinkedIn" val={form.linkedin} set={set("linkedin")} ph="linkedin.com/in/you" half />
                <GlassInput label="GitHub / Portfolio" val={form.github} set={set("github")} ph="github.com/you" half />
              </div>
            </SectionCard>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 4 }}>Work Experience</h2>
            <p style={{ color: "#475569", fontSize: 13, marginBottom: 18 }}>Add your roles — AI will craft powerful bullet points tailored to each job.</p>
            {form.experience.map((exp, i) => (
              <SectionCard key={exp.id || i} title={`Role #${i + 1}`}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                  <GlassInput label="Company" val={exp.company} set={setExp(i, "company")} ph="Acme Corp" half />
                  <GlassInput label="Role / Title" val={exp.role} set={setExp(i, "role")} ph="Software Engineer" half />
                  <GlassInput label="From" val={exp.from} set={setExp(i, "from")} ph="Jan 2022" half />
                  <GlassInput label="To" val={exp.to} set={setExp(i, "to")} ph="Present" half />
                </div>
                <GlassTextarea label="Key Achievements" val={exp.bullets} set={setExp(i, "bullets")} ph="What you built, improved, or led. AI will rewrite these as strong bullet points." rows={3} />
                {form.experience.length > 1 && <Btn ch="Remove" v="d" onClick={() => setForm(p => ({ ...p, experience: p.experience.filter((_, j) => j !== i) }))} s={{ padding: "4px 12px", fontSize: 11, marginTop: 10 }} />}
              </SectionCard>
            ))}
            <Btn ch="+ Add Another Role" v="g" onClick={() => setForm(p => ({ ...p, experience: [...p.experience, { id: Date.now(), company: "", role: "", from: "", to: "", bullets: "" }] }))} s={{ width: "100%", justifyContent: "center", padding: "11px" }} />
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 4 }}>Education & Skills</h2>
            <p style={{ color: "#475569", fontSize: 13, marginBottom: 18 }}>Fill once — AI adapts these for every application automatically.</p>
            {form.education.map((edu, i) => (
              <SectionCard key={edu.id || i} title={`Education #${i + 1}`}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <GlassInput label="School" val={edu.school} set={setEdu(i, "school")} ph="MIT" half />
                  <GlassInput label="Degree" val={edu.degree} set={setEdu(i, "degree")} ph="B.S. Computer Science" half />
                  <GlassInput label="Year" val={edu.year} set={setEdu(i, "year")} ph="2020" half />
                  <GlassInput label="GPA (optional)" val={edu.gpa} set={setEdu(i, "gpa")} ph="3.9/4.0" half />
                </div>
              </SectionCard>
            ))}
            <SectionCard title="Skills & More">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <GlassTextarea label="Skills (comma-separated)" val={form.skills} set={set("skills")} ph="React, Python, AWS, Docker, Figma, SQL..." rows={2} />
                <GlassTextarea label="Professional Summary (optional)" val={form.summary} set={set("summary")} ph="Brief overview — AI will enhance and tailor this for each role..." rows={3} />
                <GlassTextarea label="Certifications / Awards (optional)" val={form.certifications} set={set("certifications")} ph="AWS Solutions Architect, Dean's List..." rows={2} />
              </div>
            </SectionCard>
          </div>
        )}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 58, marginBottom: 14 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#e2e8f0", marginBottom: 10 }}>You're all set, {form.name.split(" ")[0]}!</h2>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 26, maxWidth: 400, margin: "0 auto 26px" }}>Your master profile is saved. Whenever you want to apply, just paste a job description — we'll handle the rest.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {["✓ Profile saved & ready to use", "✓ AI tailoring enabled", "✓ ATS optimization active", "✓ 6 templates · Rich editor · PDF export"].map((t, i) => (
                <div key={i} style={{ fontSize: 13, color: "#6366f1", fontWeight: 600 }}>{t}</div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.04)" }}>
          {step > 0 ? <Btn ch="← Back" v="ghost" onClick={() => setStep(s => s - 1)} /> : <div />}
          {step < STEPS.length - 1
            ? <Btn ch="Continue →" onClick={() => setStep(s => s + 1)} />
            : <Btn ch="🚀 Go to Dashboard" onClick={save} s={{ padding: "12px 32px", fontSize: 14 }} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ SIDEBAR ═══════════════════════ */
function Sidebar({ view, setView, user, logout }) {
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  return (
    <div style={{ width: 216, flexShrink: 0, background: "rgba(5,5,18,.98)", borderRight: "1px solid rgba(99,102,241,.1)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 14px rgba(99,102,241,.4)" }}>✦</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, background: "linear-gradient(135deg,#818cf8,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ResumeAI</div>
            <div style={{ fontSize: 8, color: "#2a2a4a", letterSpacing: 2, fontWeight: 700 }}>PRO</div>
          </div>
        </div>
      </div>
      <div style={{ margin: "10px 10px 4px", padding: "11px 12px", background: "rgba(99,102,241,.06)", borderRadius: 12, border: "1px solid rgba(99,102,241,.12)", cursor: "pointer" }} onClick={() => setView("profile")}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{initials}</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "User"}</div>
            <div style={{ fontSize: 10, color: "#6366f1" }}>{user?.resumes?.length || 0} resume{user?.resumes?.length !== 1 ? "s" : ""} generated</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: "8px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, transition: "all .2s", background: view === n.id ? "rgba(99,102,241,.15)" : "transparent", color: view === n.id ? "#a78bfa" : "#3a3a6a", boxShadow: view === n.id ? "inset 2px 0 0 #6366f1" : "none" }}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>{n.label}
            {n.badge && <span style={{ marginLeft: "auto", fontSize: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <button onClick={logout} style={{ width: "100%", padding: "9px", borderRadius: 9, border: "1px solid rgba(255,255,255,.05)", background: "transparent", color: "#2a2a4a", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#2a2a4a"; e.currentTarget.style.borderColor = "rgba(255,255,255,.05)"; }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ DASHBOARD ═══════════════════════ */
function Dashboard({ user, setView }) {
  const first = user?.name?.split(" ")?.[0] || "there";
  const resumes = user?.resumes || [];
  const avgATS = resumes.length > 0 ? Math.round(resumes.reduce((a, r) => a + (r.atsScore || 75), 0) / resumes.length) : null;
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <div style={{ padding: "34px 38px", maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>{greeting}</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#e2e8f0", margin: "0 0 6px" }}>Hey, {first} 👋</h1>
        <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>Ready to land your next role? Paste a job description and let AI do the work.</p>
      </div>
      <div style={{ background: "linear-gradient(135deg,rgba(99,102,241,.16),rgba(139,92,246,.1))", border: "1px solid rgba(99,102,241,.28)", borderRadius: 18, padding: "26px 30px", marginBottom: 18, position: "relative", overflow: "hidden", cursor: "pointer", transition: "all .2s" }}
        onClick={() => setView("apply")}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, marginBottom: 5 }}>⚡</div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", margin: "0 0 5px" }}>Quick Apply</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 14px", maxWidth: 380 }}>Paste any job description → AI generates a tailored resume in seconds.</p>
            <Btn ch="Generate My Resume →" onClick={e => { e.stopPropagation(); setView("apply"); }} s={{ padding: "9px 22px", fontSize: 13 }} />
          </div>
          <div style={{ fontSize: 64, opacity: .12 }}>✦</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Resumes Created", val: resumes.length || "0", icon: "📄", color: "#6366f1" },
          { label: "Avg ATS Score", val: avgATS ? `${avgATS}%` : "—", icon: "🎯", color: avgATS >= 80 ? "#22c55e" : "#f59e0b" },
          { label: "Last Generated", val: resumes.length > 0 ? new Date(resumes[resumes.length - 1].createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never", icon: "🕐", color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 18, marginBottom: 7 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, marginBottom: 2 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#2a2a4a" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 14, padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Recent Resumes</span>
          {resumes.length > 0 && <button onClick={() => setView("resumes")} style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>View all →</button>}
        </div>
        {resumes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#2a2a4a", fontSize: 13 }}>
            No resumes yet. <button onClick={() => setView("apply")} style={{ color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Create your first →</button>
          </div>
        ) : resumes.slice().reverse().slice(0, 4).map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px", borderRadius: 9, background: "rgba(255,255,255,.02)", marginBottom: 6, border: "1px solid rgba(255,255,255,.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>📄</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{r.title || "Resume"}</div>
                <div style={{ fontSize: 10, color: "#2a2a4a" }}>{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: r.atsScore >= 80 ? "rgba(34,197,94,.1)" : "rgba(245,158,11,.1)", color: r.atsScore >= 80 ? "#22c55e" : "#f59e0b" }}>{r.atsScore}% ATS</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ APPLY PAGE ═══════════════════════ */
function ApplyPage({ user, setUser, onEdit, toast }) {
  const [jd, setJd] = useState(""); const [stage, setStage] = useState("input");
  const [si, setSi] = useState(-1); const [result, setResult] = useState(null);
  const running = useRef(false);
  const STAGES = ["Parsing job description", "Extracting key requirements", "Matching your experience", "Tailoring summary & bullets", "Optimizing ATS keywords", "Calculating match score", "Finalizing your resume"];

  if (!user?.profile?.name) return (
    <div style={{ padding: "70px 40px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>👤</div>
      <h2 style={{ color: "#e2e8f0", marginBottom: 8 }}>Complete Your Profile First</h2>
      <p style={{ color: "#475569", fontSize: 14 }}>Your profile needs to be set up before generating resumes.</p>
    </div>
  );

  const generate = async () => {
    if (running.current || !jd.trim()) return;
    running.current = true; setStage("loading"); setSi(0);
    const p = user.profile;
    try {
      const delay = ms => new Promise(r => setTimeout(r, ms));
      for (let i = 0; i < 4; i++) { setSi(i); await delay(480 + i * 90); }
      const expText = p.experience.filter(e => e.company).map(e => `${e.role} at ${e.company} (${e.from}–${e.to}): ${e.bullets}`).join("\n");
      const raw = await callAI(
        "You are an expert resume writer and ATS optimization specialist. Return ONLY valid JSON. No markdown fences. No explanation.",
        `Tailor this candidate's resume for the job. Return this exact JSON shape:
{"summary":"3-4 sentence tailored professional summary","skills":["skill1","skill2"],"experience":[{"role":"","company":"","duration":"","bullets":["b1","b2","b3"]}],"education":[{"degree":"","school":"","year":"","gpa":""}],"keywords":["kw1","kw2"],"atsScore":85,"improvements":["tip1","tip2","tip3"],"jobTitle":"Job Title from JD"}

JOB DESCRIPTION:
${jd}

CANDIDATE:
Name: ${p.name} | Headline: ${p.headline} | Location: ${p.location}
Email: ${user.email} | Phone: ${p.phone}
Summary: ${p.summary} | Skills: ${p.skills}
Experience: ${expText}
Education: ${p.education.filter(e => e.school).map(e => `${e.degree}, ${e.school} (${e.year})`).join("; ")}`
      );
      setSi(5); await delay(400); setSi(6); await delay(350);
      let parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
      catch { parsed = { summary: p.summary, skills: (p.skills || "").split(",").map(s => s.trim()), experience: p.experience.map(e => ({ role: e.role, company: e.company, duration: `${e.from}–${e.to}`, bullets: [e.bullets] })), education: p.education, keywords: [], atsScore: 74, improvements: [], jobTitle: "Resume" }; }
      const resume = { id: Date.now(), title: parsed.jobTitle || "Resume", atsScore: parsed.atsScore || 75, createdAt: Date.now() };
      const updated = { ...user, resumes: [...(user.resumes || []), resume] };
      DB.set(`user:${user.email}`, updated);
      setUser(updated); setResult(parsed); setStage("done");
    } catch (e) { running.current = false; setStage("input"); toast("Generation failed. Please check your API key.", "error"); }
  };

  const wc = jd.trim().split(/\s+/).filter(Boolean).length;

  if (stage === "input") return (
    <div style={{ padding: "34px 38px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", margin: "0 0 5px" }}>⚡ Quick Apply</h1>
        <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Paste the job description below. AI will generate a tailored resume from your saved profile.</p>
      </div>
      <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(99,102,241,.14)", borderRadius: 16, padding: "22px" }}>
        <GlassTextarea label="Job Description" val={jd} set={setJd} ph="Paste the full job posting here..." rows={15} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 12, color: wc > 30 ? "#22c55e" : "#f59e0b" }}>{wc} words · {wc > 30 ? "Looks good!" : "Paste more for best results"}</span>
          <Btn ch="✨ Generate Resume" onClick={generate} disabled={wc < 15} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "34px 38px", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", margin: "0 0 5px" }}>Building Your Resume</h1>
      <p style={{ color: "#475569", fontSize: 13, margin: "0 0 26px" }}>Claude AI is crafting a tailored, ATS-optimized resume just for this role.</p>
      <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(99,102,241,.14)", borderRadius: 16, padding: "26px 28px" }}>
        {STAGES.map((s, i) => {
          const done = i < si; const active = i === si;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: i < STAGES.length - 1 ? 13 : 0 }}>
              <div style={{ width: 25, height: 25, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, transition: "all .3s", background: done ? "#6366f1" : active ? "rgba(99,102,241,.14)" : "rgba(0,0,0,.25)", border: done ? "2px solid #6366f1" : active ? "2px solid #a78bfa" : "2px solid rgba(99,102,241,.08)", boxShadow: active ? "0 0 12px rgba(99,102,241,.5)" : "none" }}>
                {done ? <span style={{ color: "#fff", fontSize: 11 }}>✓</span> : active ? <span style={{ color: "#a78bfa", animation: "spin .8s linear infinite", display: "block", fontSize: 14 }}>↻</span> : <span style={{ color: "#1a1a3a" }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 13, color: done ? "#e2e8f0" : active ? "#a78bfa" : "#1a1a3a", fontWeight: active ? 600 : 400 }}>{s}</span>
            </div>
          );
        })}
        {stage === "done" && result && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.14)", borderRadius: 12, padding: "13px 15px", marginBottom: 14 }}>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: result.atsScore >= 80 ? "#22c55e" : "#f59e0b", lineHeight: 1 }}>{result.atsScore}</div>
                <div style={{ fontSize: 8, color: "#64748b", fontWeight: 700, letterSpacing: 1 }}>ATS SCORE</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 2 }}>{result.atsScore >= 80 ? "Strong match!" : "Good match"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Resume optimized and ready to edit</div>
              </div>
            </div>
            {result.improvements?.slice(0, 3).map((t, i) => (
              <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "5px 0 5px 11px", borderLeft: "2px solid rgba(99,102,241,.4)", marginBottom: 5 }}>💡 {t}</div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Btn ch="← New JD" v="g" onClick={() => { setStage("input"); setResult(null); setJd(""); running.current = false; }} s={{ flex: 1, justifyContent: "center" }} />
              <Btn ch="Open in Editor →" onClick={() => onEdit(result)} s={{ flex: 2, justifyContent: "center", padding: "12px" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ RESUMES PAGE ═══════════════════════ */
function ResumesPage({ user, setView }) {
  const resumes = user?.resumes || [];
  return (
    <div style={{ padding: "34px 38px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", margin: "0 0 4px" }}>My Resumes</h1>
          <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>All resumes generated from your profile</p>
        </div>
        <Btn ch="⚡ New Resume" onClick={() => setView("apply")} s={{ padding: "9px 18px" }} />
      </div>
      {resumes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 46, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#475569", marginBottom: 6 }}>No resumes yet</div>
          <div style={{ fontSize: 13, color: "#2a2a4a", marginBottom: 18 }}>Generate your first tailored resume from a job description.</div>
          <Btn ch="⚡ Quick Apply" onClick={() => setView("apply")} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {resumes.slice().reverse().map((r, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 13, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,.06)"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(99,102,241,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>📄</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: "#2a2a4a" }}>{new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: r.atsScore >= 80 ? "rgba(34,197,94,.1)" : "rgba(245,158,11,.1)", color: r.atsScore >= 80 ? "#22c55e" : "#f59e0b" }}>{r.atsScore}% ATS</span>
                <Btn ch="Regenerate" v="g" onClick={() => setView("apply")} s={{ padding: "5px 12px", fontSize: 11 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ PROFILE PAGE ═══════════════════════ */
function ProfilePage({ user, setUser, toast }) {
  const [form, setForm] = useState(user?.profile || EMPTY_PROFILE);
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
  const set = k => v => setForm(p => ({ ...p, [k]: v }));
  const setExp = (i, k) => v => setForm(p => { const e = [...p.experience]; e[i] = { ...e[i], [k]: v }; return { ...p, experience: e }; });
  const setEdu = (i, k) => v => setForm(p => { const e = [...p.education]; e[i] = { ...e[i], [k]: v }; return { ...p, education: e }; });

  const save = () => {
    setSaving(true);
    const updated = { ...user, profile: form };
    DB.set(`user:${user.email}`, updated);
    setUser(updated); setSaving(false); setSaved(true);
    toast("Profile updated! ✓");
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div style={{ padding: "32px 38px", maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", margin: "0 0 4px" }}>My Profile</h1>
          <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Your master profile — saved once, used for every job application</p>
        </div>
        <Btn ch={saved ? "✓ Saved!" : saving ? "Saving..." : "Save Profile"} onClick={save} disabled={saving} v={saved ? "success" : "p"} s={{ padding: "9px 22px" }} />
      </div>
      <SectionCard title="Personal Information">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <GlassInput label="Full Name" val={form.name} set={set("name")} ph="Jane Smith" half />
          <GlassInput label="Professional Headline" val={form.headline} set={set("headline")} ph="Senior Software Engineer" half />
          <GlassInput label="Location" val={form.location} set={set("location")} ph="San Francisco, CA" half />
          <GlassInput label="Phone" val={form.phone} set={set("phone")} ph="+1 555 000 0000" half />
          <GlassInput label="LinkedIn" val={form.linkedin} set={set("linkedin")} ph="linkedin.com/in/you" half />
          <GlassInput label="GitHub / Portfolio" val={form.github} set={set("github")} ph="github.com/you" half />
          <GlassTextarea label="Professional Summary" val={form.summary} set={set("summary")} ph="AI will tailor this for each role..." rows={3} />
        </div>
      </SectionCard>
      <SectionCard title="Work Experience">
        {form.experience.map((exp, i) => (
          <div key={exp.id || i} style={{ background: "rgba(0,0,0,.18)", borderRadius: 11, padding: "13px 15px", marginBottom: 10, border: "1px solid rgba(99,102,241,.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
              <span style={{ fontSize: 9, color: "#6366f1", fontWeight: 700 }}>ROLE #{i + 1}</span>
              {form.experience.length > 1 && <Btn ch="Remove" v="d" onClick={() => setForm(p => ({ ...p, experience: p.experience.filter((_, j) => j !== i) }))} s={{ padding: "3px 10px", fontSize: 11 }} />}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <GlassInput label="Company" val={exp.company} set={setExp(i, "company")} ph="Acme Corp" half />
              <GlassInput label="Role" val={exp.role} set={setExp(i, "role")} ph="Software Engineer" half />
              <GlassInput label="From" val={exp.from} set={setExp(i, "from")} ph="Jan 2022" half />
              <GlassInput label="To" val={exp.to} set={setExp(i, "to")} ph="Present" half />
            </div>
            <GlassTextarea label="Key Achievements" val={exp.bullets} set={setExp(i, "bullets")} ph="What you built, improved, or led..." rows={3} />
          </div>
        ))}
        <Btn ch="+ Add Role" v="g" onClick={() => setForm(p => ({ ...p, experience: [...p.experience, { id: Date.now(), company: "", role: "", from: "", to: "", bullets: "" }] }))} s={{ width: "100%", justifyContent: "center", padding: "10px" }} />
      </SectionCard>
      <SectionCard title="Education">
        {form.education.map((edu, i) => (
          <div key={edu.id || i} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            <GlassInput label="School" val={edu.school} set={setEdu(i, "school")} ph="MIT" half />
            <GlassInput label="Degree" val={edu.degree} set={setEdu(i, "degree")} ph="B.S. Computer Science" half />
            <GlassInput label="Year" val={edu.year} set={setEdu(i, "year")} ph="2020" half />
            <GlassInput label="GPA" val={edu.gpa} set={setEdu(i, "gpa")} ph="3.9/4.0" half />
          </div>
        ))}
        <Btn ch="+ Add Education" v="g" onClick={() => setForm(p => ({ ...p, education: [...p.education, { id: Date.now(), school: "", degree: "", year: "", gpa: "" }] }))} s={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: 4 }} />
      </SectionCard>
      <SectionCard title="Skills & Certifications">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <GlassTextarea label="Skills (comma-separated)" val={form.skills} set={set("skills")} ph="React, Python, AWS, Docker, SQL..." rows={2} />
          <GlassTextarea label="Certifications & Awards" val={form.certifications} set={set("certifications")} ph="AWS Solutions Architect, Dean's List..." rows={2} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════ EDITOR ═══════════════════════ */
function Editor({ aiData, profile, onBack }) {
  const paperRef = useRef();
  const [theme, setTheme] = useState(THEMES[0]); const [font, setFont] = useState("Georgia"); const [fsize, setFsize] = useState(13);
  const [sections, setSections] = useState(["summary", "skills", "experience", "education", "certifications"]);
  const [hidden, setHidden] = useState(new Set()); const [styleOpen, setStyleOpen] = useState(true);
  const [sel, setSel] = useState({ bold: false, italic: false, underline: false });

  const exec = cmd => { document.execCommand(cmd, false, null); updateSel(); };
  const execV = (cmd, v) => document.execCommand(cmd, false, v);
  const updateSel = () => setSel({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline") });
  const moveSection = (i, d) => setSections(s => { const a = [...s]; const j = i + d; if (j < 0 || j >= a.length) return s; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const toggleSection = id => setHidden(h => { const n = new Set(h); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const skills = aiData?.skills || (profile.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const exp = aiData?.experience || profile.experience?.filter(e => e.company).map(e => ({ role: e.role, company: e.company, duration: `${e.from}–${e.to}`, bullets: [e.bullets] })) || [];
  const edu = aiData?.education || profile.education?.filter(e => e.school) || [];
  const summary = aiData?.summary || profile.summary || "";
  const skillsHtml = skills.map(s => `<span style="display:inline-block;background:${theme.accent}18;color:${theme.accent};padding:2px 9px;border-radius:3px;font-size:${fsize - 1}px;margin:2px;font-family:Arial,sans-serif">${s}</span>`).join(" ");
  const expHtml = exp.map(e => `<div style="margin-bottom:13px"><div style="display:flex;justify-content:space-between;align-items:baseline"><strong style="color:#0f0f1a;font-size:${fsize + 1}px">${e.role}</strong><span style="font-size:${fsize - 2}px;color:#777;font-family:Arial,sans-serif">${e.duration}</span></div><div style="color:${theme.accent};font-size:${fsize - 1}px;font-weight:600;margin:2px 0 5px;font-family:Arial,sans-serif">${e.company}</div><ul style="margin:0;padding-left:18px">${(Array.isArray(e.bullets) ? e.bullets : [e.bullets]).filter(Boolean).map(b => `<li style="margin-bottom:3px;line-height:1.55;font-size:${fsize}px">${b}</li>`).join("")}</ul></div>`).join("");
  const eduHtml = edu.map(e => `<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:${fsize}px"><span><strong>${e.degree}</strong><span style="color:#555"> · ${e.school}</span></span><span style="color:#777;font-size:${fsize - 1}px">${e.year}</span></div>`).join("");
  const sLabel = { summary: "Summary", skills: "Core Skills", experience: "Experience", education: "Education", certifications: "Certifications" };

  const download = () => {
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${profile.name} Resume</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'${font}',serif;font-size:${fsize}px;color:#1a1a1a;padding:38px 46px;max-width:794px;margin:0 auto}[contenteditable]{outline:none!important}.sec-ctl{display:none!important}</style></head><body>${paperRef.current.innerHTML}</body></html>`);
    win.document.close(); setTimeout(() => win.print(), 400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "'Inter','Segoe UI',sans-serif", background: "#050512" }}>
      <div style={{ background: "rgba(5,5,18,.99)", borderBottom: "1px solid rgba(99,102,241,.12)", padding: "0 10px", display: "flex", alignItems: "center", gap: 2, height: 50, flexShrink: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginRight: 5 }}>← Back</button>
        <div style={{ width: 1, height: 26, background: "rgba(255,255,255,.08)", margin: "0 3px" }} />
        <select value={font} onChange={e => setFont(e.target.value)} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, padding: "4px 7px", color: "#e2e8f0", fontSize: 12, cursor: "pointer", outline: "none", fontFamily: font, maxWidth: 128 }}>
          {FONTS.map(f => <option key={f} value={f} style={{ background: "#0a0a1e" }}>{f}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 1, marginLeft: 4 }}>
          {[["−", () => setFsize(f => Math.max(9, f - 1))], ["+", () => setFsize(f => Math.min(24, f + 1))]].map(([lbl, fn], i) => (
            <button key={i} onMouseDown={e => { e.preventDefault(); fn(); }} style={{ width: 20, height: 24, border: "1px solid rgba(255,255,255,.08)", borderRadius: i === 0 ? "4px 0 0 4px" : "0 4px 4px 0", background: "rgba(255,255,255,.04)", color: "#94a3b8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{lbl}</button>
          ))}
          <span style={{ width: 26, textAlign: "center", fontSize: 12, color: "#e2e8f0", fontWeight: 700, background: "rgba(255,255,255,.04)", height: 24, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.08)", borderLeft: "none", borderRight: "none" }}>{fsize}</span>
        </div>
        <div style={{ width: 1, height: 26, background: "rgba(255,255,255,.08)", margin: "0 3px" }} />
        <ToolBtn onExec={() => exec("bold")} active={sel.bold} title="Bold"><b>B</b></ToolBtn>
        <ToolBtn onExec={() => exec("italic")} active={sel.italic} title="Italic"><i>I</i></ToolBtn>
        <ToolBtn onExec={() => exec("underline")} active={sel.underline} title="Underline"><u>U</u></ToolBtn>
        <button onMouseDown={e => { e.preventDefault(); exec("strikeThrough"); }} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 6, cursor: "pointer", background: "transparent", color: "#94a3b8", fontSize: 14 }}><s>S</s></button>
        <div style={{ width: 1, height: 26, background: "rgba(255,255,255,.08)", margin: "0 3px" }} />
        {[["justifyLeft", "⫷"], ["justifyCenter", "≡"], ["justifyRight", "⫸"]].map(([cmd, ic]) => (
          <button key={cmd} onMouseDown={e => { e.preventDefault(); exec(cmd); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 5, cursor: "pointer", background: "transparent", color: "#94a3b8", fontSize: 15 }}>{ic}</button>
        ))}
        <div style={{ width: 1, height: 26, background: "rgba(255,255,255,.08)", margin: "0 3px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {["#1a1a1a", "#4f46e5", "#0891b2", "#dc2626", "#15803d", "#b45309", "#64748b", "#7c3aed"].map(c => (
            <button key={c} onMouseDown={e => { e.preventDefault(); execV("foreColor", c); }} style={{ width: 15, height: 15, borderRadius: 3, background: c, border: "1.5px solid rgba(255,255,255,.12)", cursor: "pointer" }} />
          ))}
        </div>
        <div style={{ width: 1, height: 26, background: "rgba(255,255,255,.08)", margin: "0 3px" }} />
        <button onMouseDown={e => { e.preventDefault(); exec("undo"); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 5, cursor: "pointer", background: "transparent", color: "#94a3b8", fontSize: 16 }}>↩</button>
        <button onMouseDown={e => { e.preventDefault(); exec("redo"); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 5, cursor: "pointer", background: "transparent", color: "#94a3b8", fontSize: 16 }}>↪</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setStyleOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: styleOpen ? "rgba(99,102,241,.12)" : "rgba(255,255,255,.04)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 7, color: "#a78bfa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🎨 Styles</button>
        <button onClick={download} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginLeft: 6, boxShadow: "0 2px 12px rgba(99,102,241,.4)", whiteSpace: "nowrap" }}>↓ Download PDF</button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", background: "#12122a", display: "flex", justifyContent: "center", padding: "30px 20px" }}>
          <div ref={paperRef} onMouseUp={updateSel} onKeyUp={updateSel}
            style={{ background: "#fff", width: "100%", maxWidth: 794, minHeight: 1100, borderRadius: 3, boxShadow: "0 8px 60px rgba(0,0,0,.6)", fontFamily: font, fontSize: `${fsize}px`, color: "#1a1a1a", padding: "44px 50px", lineHeight: 1.55 }}>
            <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: `3px solid ${theme.accent}` }}>
              <div contentEditable suppressContentEditableWarning style={{ fontSize: fsize + 17, fontWeight: 900, color: "#0f0f1a", outline: "none", lineHeight: 1.15, marginBottom: 3 }}>{profile.name || "Your Name"}</div>
              <div contentEditable suppressContentEditableWarning style={{ fontSize: fsize + 2, color: theme.accent, fontWeight: 700, outline: "none", marginBottom: 7, fontFamily: "Arial,sans-serif" }}>{profile.headline || profile.title || "Professional Title"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 16px", fontSize: fsize - 1, color: "#555", fontFamily: "Arial,sans-serif" }}>
                {[profile.email && `✉ ${profile.email}`, profile.phone && `📱 ${profile.phone}`, profile.location && `📍 ${profile.location}`, profile.linkedin && `🔗 ${profile.linkedin}`, profile.github && `💻 ${profile.github}`].filter(Boolean).map((c, i) => (
                  <span key={i} contentEditable suppressContentEditableWarning style={{ outline: "none" }}>{c}</span>
                ))}
              </div>
            </div>
            {sections.filter(id => !hidden.has(id)).map((id, i) => (
              <div key={id} style={{ marginBottom: 14, position: "relative" }}
                onMouseEnter={e => { const c = e.currentTarget.querySelector(".sec-ctl"); if (c) c.style.opacity = "1"; }}
                onMouseLeave={e => { const c = e.currentTarget.querySelector(".sec-ctl"); if (c) c.style.opacity = "0"; }}>
                <div className="sec-ctl" style={{ position: "absolute", right: -34, top: 0, display: "flex", flexDirection: "column", gap: 2, opacity: 0, transition: "opacity .2s", zIndex: 5 }}>
                  <button onClick={() => moveSection(i, -1)} style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid rgba(99,102,241,.3)", background: "rgba(5,5,18,.9)", color: "#a78bfa", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                  <button onClick={() => moveSection(i, 1)} style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid rgba(99,102,241,.3)", background: "rgba(5,5,18,.9)", color: "#a78bfa", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
                </div>
                <div style={{ fontSize: fsize - 2, textTransform: "uppercase", letterSpacing: 2, color: theme.accent, borderBottom: `1.5px solid ${theme.accent}`, paddingBottom: 4, marginBottom: 9, fontWeight: 700, fontFamily: "Arial,sans-serif" }}>{sLabel[id]}</div>
                {id === "summary" && <div contentEditable suppressContentEditableWarning style={{ outline: "none", lineHeight: 1.7, color: "#333" }}>{summary}</div>}
                {id === "skills" && <div contentEditable suppressContentEditableWarning style={{ outline: "none" }} dangerouslySetInnerHTML={{ __html: `<div style="display:flex;flex-wrap:wrap;gap:4px">${skillsHtml}</div>` }} />}
                {id === "experience" && <div contentEditable suppressContentEditableWarning style={{ outline: "none" }} dangerouslySetInnerHTML={{ __html: expHtml }} />}
                {id === "education" && <div contentEditable suppressContentEditableWarning style={{ outline: "none" }} dangerouslySetInnerHTML={{ __html: eduHtml }} />}
                {id === "certifications" && profile.certifications && <div contentEditable suppressContentEditableWarning style={{ outline: "none", lineHeight: 1.7, color: "#333" }}>{profile.certifications}</div>}
              </div>
            ))}
            {aiData?.keywords?.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 8, borderTop: "1px solid #eee", fontSize: 8, color: "#ccc", fontFamily: "Arial,sans-serif" }}>
                <span style={{ color: theme.accent, fontWeight: 700 }}>KEYWORDS: </span>{aiData.keywords.join(", ")}
              </div>
            )}
            <style>{`[contenteditable]:hover{outline:1.5px dashed rgba(99,102,241,.22)!important;border-radius:2px}[contenteditable]:focus{outline:1.5px solid rgba(99,102,241,.5)!important;border-radius:2px}`}</style>
          </div>
        </div>
        {styleOpen && (
          <div style={{ width: 206, background: "rgba(5,5,18,.99)", borderLeft: "1px solid rgba(99,102,241,.1)", overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 9, color: "#2a2a4a", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 9 }}>Color Theme</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setTheme(t)} style={{ padding: "8px 4px", borderRadius: 9, border: `2px solid ${theme.id === t.id ? t.accent : "rgba(255,255,255,.05)"}`, background: theme.id === t.id ? "rgba(99,102,241,.08)" : "rgba(255,255,255,.02)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all .2s" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: t.accent }} />
                    <span style={{ fontSize: 8, color: theme.id === t.id ? "#e2e8f0" : "#2a2a4a", fontWeight: theme.id === t.id ? 700 : 400 }}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#2a2a4a", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Font Family</div>
              {FONTS.map(f => (
                <button key={f} onClick={() => setFont(f)} style={{ display: "block", width: "100%", padding: "6px 10px", borderRadius: 7, border: `1px solid ${font === f ? "rgba(99,102,241,.4)" : "rgba(255,255,255,.04)"}`, background: font === f ? "rgba(99,102,241,.08)" : "transparent", cursor: "pointer", textAlign: "left", color: font === f ? "#a78bfa" : "#2a2a4a", fontSize: 12, fontFamily: f, marginBottom: 3, transition: "all .15s" }}>
                  {f}
                </button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#2a2a4a", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Sections</div>
              {sections.map((id, i) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 3, padding: "5px 7px", borderRadius: 7, marginBottom: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
                  <span style={{ flex: 1, fontSize: 11, color: hidden.has(id) ? "#1a1a3a" : "#94a3b8" }}>{sLabel[id]}</span>
                  <button onClick={() => moveSection(i, -1)} style={{ width: 16, height: 16, border: "none", background: "transparent", color: "#2a2a4a", cursor: "pointer", fontSize: 11, padding: 0 }}>↑</button>
                  <button onClick={() => moveSection(i, 1)} style={{ width: 16, height: 16, border: "none", background: "transparent", color: "#2a2a4a", cursor: "pointer", fontSize: 11, padding: 0 }}>↓</button>
                  <button onClick={() => toggleSection(id)} style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 99, border: "none", cursor: "pointer", background: hidden.has(id) ? "rgba(239,68,68,.12)" : "rgba(34,197,94,.12)", color: hidden.has(id) ? "#ef4444" : "#22c55e" }}>
                    {hidden.has(id) ? "OFF" : "ON"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ APP ═══════════════════════ */
export default function App() {
  const [page, setPage] = useState("loading");
  const [user, setUser] = useState(null);
  const [editorData, setEditorData] = useState(null);
  const [toastState, setToastState] = useState(null);

  const toast = (msg, type = "success") => setToastState({ msg, type, id: Date.now() });
  const updateUser = u => { setUser(u); DB.set(`user:${u.email}`, u); };
  const logout = () => { DB.del("session"); setUser(null); setPage("landing"); toast("Signed out. See you soon!"); };

  useEffect(() => {
    const sess = DB.get("session");
    if (sess?.email) {
      const u = DB.get(`user:${sess.email}`);
      if (u) { setUser(u); setPage(u.profileComplete ? "dashboard" : "onboarding"); }
      else setPage("landing");
    } else setPage("landing");
  }, []);

  const ToastEl = toastState ? <Toast key={toastState.id} msg={toastState.msg} type={toastState.type} onClose={() => setToastState(null)} /> : null;

  if (page === "loading") return (
    <div style={{ background: "#050512", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 0 28px rgba(99,102,241,.5)" }}>✦</div>
      <span style={{ color: "#2a2a4a", fontSize: 14 }}>Loading...</span>
    </div>
  );

  if (page === "landing") return <>{<Landing goto={setPage} />}{ToastEl}</>;
  if (page === "login" || page === "signup") return <>{<AuthPage mode={page} goto={setPage} setUser={setUser} toast={toast} />}{ToastEl}</>;
  if (page === "onboarding") return <>{<Onboarding user={user} setUser={setUser} goto={setPage} toast={toast} />}{ToastEl}</>;
  if (page === "editor") return (
    <>
      <Editor aiData={editorData} profile={user?.profile || {}} onBack={() => setPage("apply")} />
      {ToastEl}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#070714", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#e2e8f0" }}>
      <Sidebar view={page} setView={setPage} user={user} logout={logout} />
      <main style={{ flex: 1, overflowY: "auto" }}>
        {page === "dashboard" && <Dashboard user={user} setView={setPage} />}
        {page === "apply" && <ApplyPage user={user} setUser={updateUser} onEdit={ai => { setEditorData(ai); setPage("editor"); }} toast={toast} />}
        {page === "resumes" && <ResumesPage user={user} setView={setPage} />}
        {page === "profile" && <ProfilePage user={user} setUser={updateUser} toast={toast} />}
      </main>
      {ToastEl}
      <style>{`
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.22);border-radius:4px}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideIn{from{transform:translateX(16px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
      `}</style>
    </div>
  );
}
