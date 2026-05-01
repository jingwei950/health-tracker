import { useState } from "react";

// ─── Tiny SVG icon helper ─────────────────────────────────────────────────────
const I = ({ d, size = 16, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2m0 0h2m-2 0v-2m0 2v2",
  eat:       "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  move:      "M22 12h-4l-3 9L9 3l-3 9H2",
  sleep:     "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
  bmi:       "M3 3v18h18M9 9l4 4 4-8",
  target:    "M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0M12 2v2M12 20v2M2 12h2M20 12h2",
  sun:       "M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  moon:      "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
  plus:      "M12 5v14M5 12h14",
  search:    "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z",
  trash:     "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  chevL:     "M15 18l-6-6 6-6",
  chevR:     "M9 18l6-6-6-6",
  activity:  "M22 12h-4l-3 9L9 3l-3 9H2",
  fire:      "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3Z",
  zap:       "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      "#111113",
  surface: "#1c1c1e",
  card:    "#242428",
  border:  "#2e2e33",
  muted:   "#71717a",
  sub:     "#a1a1aa",
  text:    "#f4f4f5",
  primary: "#6366f1",
  green:   "#34d399",
  yellow:  "#fbbf24",
  red:     "#f87171",
  blue:    "#60a5fa",
};

// ─── Primitives ───────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, ...style }}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>
    {children}
  </div>
);

const Bar = ({ v, max, color = T.primary, h = 5 }) => (
  <div style={{ height: h, background: T.border, borderRadius: 99, overflow: "hidden", marginTop: 5 }}>
    <div style={{ height: "100%", width: `${Math.min(100, Math.round((v / max) * 100))}%`, background: color, borderRadius: 99 }} />
  </div>
);

const Chip = ({ label, color, bg }) => (
  <span style={{ background: bg ?? `${color}22`, color, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 500 }}>{label}</span>
);

const Divider = () => <div style={{ height: 1, background: T.border, margin: "10px 0" }} />;

// ─── Mock data ────────────────────────────────────────────────────────────────
const DATA = {
  cal: { in: 1840, burn: 420, goal: 2200 },
  macros: [
    { name: "Protein", g: 92,  goal: 150, color: T.blue   },
    { name: "Carbs",   g: 210, goal: 275, color: T.yellow },
    { name: "Fat",     g: 58,  goal: 73,  color: T.red    },
  ],
  sleep: { score: 78, hours: 7.2, label: "Fair", date: "Apr 13", stages: { deep: 22, rem: 19, light: 45, awake: 14 } },
  bmi: { value: 23.1, label: "Healthy", color: T.green, weight: 70, height: 174 },
  activity: { burn: 420, sessions: 2, goal: 600 },
  foods: [
    { id: 1, name: "Chicken Rice", cal: 520, pro: 32, carb: 68, fat: 12 },
    { id: 2, name: "Kaya Toast",   cal: 210, pro: 5,  carb: 36, fat: 7  },
    { id: 3, name: "Teh Tarik",    cal: 130, pro: 3,  carb: 22, fat: 4  },
    { id: 4, name: "Milo",         cal: 140, pro: 4,  carb: 28, fat: 2  },
    { id: 5, name: "Nasi Lemak",   cal: 840, pro: 28, carb: 80, fat: 45 },
  ],
  acts: [
    { id: 1, name: "Morning Run",   dur: 35, cal: 310, intensity: "High" },
    { id: 2, name: "Gym – Weights", dur: 45, cal: 110, intensity: "Med"  },
  ],
  weekCal: [1920, 2100, 1780, 2340, 1650, 1840, 0],
  weekDay: ["M", "T", "W", "T", "F", "S", "S"],
};

// ─── NAV config ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "db", label: "Dashboard", icon: "dashboard" },
  { id: "fd", label: "Nutrition",  icon: "eat"       },
  { id: "ac", label: "Activity",   icon: "move"      },
  { id: "sl", label: "Sleep",      icon: "sleep"     },
  { id: "bm", label: "BMI",        icon: "bmi"       },
];

// ══════════════════════════════════════════════════════════════════════════════
//  PANELS
// ══════════════════════════════════════════════════════════════════════════════

// ── Dashboard ─────────────────────────────────────────────────────────────────
function PanelDashboard({ cols, onNav }) {
  const { cal, macros, sleep, bmi, activity, weekCal, weekDay, foods } = DATA;
  const net = cal.in - cal.burn;
  const maxBar = Math.max(...weekCal.filter(Boolean));

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>

      {/* Alert */}
      <div style={{ gridColumn: "1 / -1", padding: "10px 14px", borderRadius: 10, background: `${T.yellow}18`, border: `1px solid ${T.yellow}44`, color: T.yellow, fontSize: 12 }}>
        ⚡ You&rsquo;re 360 kcal below your goal — consider a healthy snack
      </div>

      {/* Calories */}
      <Card>
        <SectionLabel>Calories today</SectionLabel>
        <div style={{ fontSize: 30, fontWeight: 700, color: T.primary, lineHeight: 1 }}>{cal.in.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>consumed · <span style={{ color: T.red }}>{cal.burn}</span> burned</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: net > cal.goal ? T.yellow : T.green }}>{net} net</div>
        <Bar v={cal.in} max={cal.goal} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: T.muted }}>Goal: {cal.goal} kcal</span>
          <span style={{ fontSize: 10, color: T.muted }}>{Math.round((cal.in / cal.goal) * 100)}%</span>
        </div>
      </Card>

      {/* Macros */}
      <Card>
        <SectionLabel>Macros</SectionLabel>
        {macros.map(({ name, g, goal, color }) => (
          <div key={name} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: T.sub }}>{name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color }}>{g}g <span style={{ color: T.muted, fontWeight: 400 }}>/ {goal}g</span></span>
            </div>
            <Bar v={g} max={goal} color={color} h={4} />
          </div>
        ))}
      </Card>

      {/* Sleep */}
      <Card>
        <SectionLabel>Sleep</SectionLabel>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{sleep.score}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sleep.hours}h · {sleep.date}</div>
        <div style={{ marginTop: 6 }}><Chip label={sleep.label} color={T.yellow} /></div>
      </Card>

      {/* BMI */}
      <Card>
        <SectionLabel>BMI</SectionLabel>
        <div style={{ fontSize: 28, fontWeight: 700, color: bmi.color }}>{bmi.value}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{bmi.weight} kg · {bmi.height} cm</div>
        <div style={{ marginTop: 6 }}><Chip label={bmi.label} color={bmi.color} /></div>
      </Card>

      {/* Activity */}
      <Card>
        <SectionLabel>Activity</SectionLabel>
        <div style={{ fontSize: 28, fontWeight: 700, color: T.red }}>{activity.burn}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>kcal burned · {activity.sessions} sessions</div>
        <Bar v={activity.burn} max={activity.goal} color={T.red} />
      </Card>

      {/* Weekly chart */}
      <Card style={{ gridColumn: cols === 1 ? "1" : "2 / -1" }}>
        <SectionLabel>This week — calories</SectionLabel>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 64 }}>
          {weekCal.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: v ? `${Math.round((v / maxBar) * 56)}px` : 3, background: i === 5 ? T.primary : v ? `${T.primary}55` : T.border }} />
              <span style={{ fontSize: 9, color: i === 5 ? T.sub : T.border }}>{weekDay[i]}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick add */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Quick-add recent foods</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {foods.slice(0, 4).map((f) => (
            <button key={f.id} onClick={() => onNav("fd")} style={{ padding: "4px 10px", borderRadius: 99, fontSize: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.sub, cursor: "pointer" }}>
              {f.name}
            </button>
          ))}
          <button onClick={() => onNav("fd")} style={{ padding: "4px 10px", borderRadius: 99, fontSize: 12, border: `1px solid ${T.primary}`, background: `${T.primary}18`, color: T.primary, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <I d={ICONS.plus} size={12} sw={2.5} /> Add food
          </button>
        </div>
      </Card>
    </div>
  );
}

// ── Nutrition ─────────────────────────────────────────────────────────────────
function PanelNutrition({ cols }) {
  const [q, setQ] = useState("");
  const { cal, macros, foods } = DATA;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>

      {/* Search */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Find food</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px" }}>
            <I d={ICONS.search} size={14} sw={2} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. Chicken rice, 1 plate…"
              style={{ background: "transparent", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1, caretColor: T.primary }} />
          </div>
          <button style={{ padding: "0 16px", borderRadius: 8, background: T.primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
            Search
          </button>
        </div>
      </Card>

      {/* Today summary */}
      <Card>
        <SectionLabel>Today&rsquo;s total</SectionLabel>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.primary }}>{cal.in} <span style={{ fontSize: 13, fontWeight: 400, color: T.muted }}>kcal</span></div>
        <Bar v={cal.in} max={cal.goal} />
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>Goal: {cal.goal} kcal</div>
      </Card>

      {/* Macro rings */}
      <Card>
        <SectionLabel>Macro breakdown</SectionLabel>
        {macros.map(({ name, g, goal, color }) => (
          <div key={name} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 12, color: T.sub }}>{name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color }}>{g}g / {goal}g</span>
            </div>
            <Bar v={g} max={goal} color={color} h={4} />
          </div>
        ))}
      </Card>

      {/* Food log */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Food log</SectionLabel>
        {foods.map((f, i) => (
          <div key={f.id}>
            {i > 0 && <Divider />}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${T.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <I d={ICONS.eat} size={14} sw={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
                  P {f.pro}g · C {f.carb}g · F {f.fat}g
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.primary }}>{f.cal}</div>
                <div style={{ fontSize: 10, color: T.muted }}>kcal</div>
              </div>
              <button style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", color: T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <I d={ICONS.trash} size={12} sw={2} />
              </button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Activity ──────────────────────────────────────────────────────────────────
function PanelActivity({ cols }) {
  const { acts, activity } = DATA;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>

      {/* Stats row */}
      <Card>
        <SectionLabel>Burned today</SectionLabel>
        <div style={{ fontSize: 28, fontWeight: 700, color: T.red }}>{activity.burn} <span style={{ fontSize: 12, fontWeight: 400, color: T.muted }}>kcal</span></div>
        <Bar v={activity.burn} max={activity.goal} color={T.red} />
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>Goal: {activity.goal} kcal</div>
      </Card>

      <Card>
        <SectionLabel>Sessions</SectionLabel>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{acts.length}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
          {acts.reduce((s, a) => s + a.dur, 0)} min total
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
          <Chip label="Active" color={T.green} />
        </div>
      </Card>

      {/* Log */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Activity log</SectionLabel>
        {acts.map((a, i) => (
          <div key={a.id}>
            {i > 0 && <Divider />}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${T.red}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <I d={ICONS.move} size={14} sw={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{a.dur} min · <Chip label={a.intensity} color={a.intensity === "High" ? T.red : T.yellow} /></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.red }}>{a.cal}</div>
                <div style={{ fontSize: 10, color: T.muted }}>kcal</div>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Add form */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Log activity</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: cols > 1 ? "1fr 80px" : "1fr", gap: 8 }}>
          <input placeholder="Activity name" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none" }} />
          <input placeholder="Minutes" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {["Low", "Medium", "High"].map((level) => (
            <button key={level} style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, border: `1px solid ${level === "Medium" ? T.primary : T.border}`, background: level === "Medium" ? `${T.primary}18` : "transparent", color: level === "Medium" ? T.primary : T.sub, cursor: "pointer" }}>
              {level}
            </button>
          ))}
        </div>
        <button style={{ width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 8, background: T.primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <I d={ICONS.plus} size={14} sw={2.5} /> Add session
        </button>
      </Card>
    </div>
  );
}

// ── Sleep ─────────────────────────────────────────────────────────────────────
function PanelSleep({ cols }) {
  const { sleep } = DATA;
  const stages = [
    { label: "Deep",  pct: sleep.stages.deep,  color: T.primary },
    { label: "REM",   pct: sleep.stages.rem,   color: T.blue    },
    { label: "Light", pct: sleep.stages.light, color: T.sub     },
    { label: "Awake", pct: sleep.stages.awake, color: T.yellow  },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>

      {/* Score */}
      <Card>
        <SectionLabel>Sleep score</SectionLabel>
        <div style={{ fontSize: 36, fontWeight: 700 }}>{sleep.score}</div>
        <div style={{ marginTop: 4 }}><Chip label={sleep.label} color={T.yellow} /></div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>{sleep.date}</div>
      </Card>

      {/* Duration */}
      <Card>
        <SectionLabel>Duration</SectionLabel>
        <div style={{ fontSize: 36, fontWeight: 700 }}>{sleep.hours}<span style={{ fontSize: 14, fontWeight: 400, color: T.muted }}> hrs</span></div>
        <Bar v={sleep.hours} max={9} color={T.blue} />
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>Goal: 8 hrs</div>
      </Card>

      {/* Stage breakdown */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Sleep stages</SectionLabel>
        {/* Stacked bar */}
        <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 1, marginBottom: 14 }}>
          {stages.map(({ label, pct, color }) => (
            <div key={label} style={{ width: `${pct}%`, background: color, transition: "width .3s" }} title={`${label}: ${pct}%`} />
          ))}
        </div>
        {stages.map(({ label, pct, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.sub }}>{label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
          </div>
        ))}
      </Card>

      {/* Import JSON */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Import sleep data</SectionLabel>
        <textarea placeholder={`Paste watch export JSON…\n{\n  "date": "2026-04-14",\n  "total_hours": 7.5,\n  "stages": { "deep": 20, "rem": 18, "light": 48, "awake": 14 }\n}`}
          style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", color: T.text, fontSize: 12, fontFamily: "monospace", resize: "vertical", minHeight: 90, outline: "none", boxSizing: "border-box" }} />
        <button style={{ width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 8, background: T.primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          Import
        </button>
      </Card>
    </div>
  );
}

// ── BMI ───────────────────────────────────────────────────────────────────────
function PanelBmi({ cols }) {
  const { bmi } = DATA;
  const bands = [
    { label: "Underweight", range: "< 18.5", color: T.blue   },
    { label: "Healthy",     range: "18.5–24.9", color: T.green  },
    { label: "Overweight",  range: "25–29.9", color: T.yellow },
    { label: "Obese",       range: "≥ 30",    color: T.red    },
  ];

  // BMI gauge position (18.5 to 32 range, clamped)
  const pct = Math.min(100, Math.max(0, ((bmi.value - 16) / (34 - 16)) * 100));

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>

      {/* Value card */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Body Mass Index</SectionLabel>
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: bmi.color, lineHeight: 1 }}>{bmi.value}</div>
          <div style={{ marginTop: 8 }}><Chip label={bmi.label} color={bmi.color} /></div>

          {/* Gradient gauge */}
          <div style={{ marginTop: 20, position: "relative", height: 10, borderRadius: 99, background: `linear-gradient(to right, ${T.blue}, ${T.green} 30%, ${T.yellow} 65%, ${T.red})` }}>
            <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: "#fff", border: `3px solid ${bmi.color}`, boxShadow: "0 1px 4px rgba(0,0,0,.4)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: T.muted }}>16</span>
            <span style={{ fontSize: 10, color: T.muted }}>34</span>
          </div>
        </div>
      </Card>

      {/* Weight & height inputs */}
      <Card>
        <SectionLabel>Weight</SectionLabel>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{bmi.weight}</div>
          <span style={{ fontSize: 12, color: T.muted }}>kg</span>
        </div>
        <input type="range" min={40} max={140} defaultValue={bmi.weight} style={{ width: "100%", marginTop: 10, accentColor: T.primary }} />
      </Card>

      <Card>
        <SectionLabel>Height</SectionLabel>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{bmi.height}</div>
          <span style={{ fontSize: 12, color: T.muted }}>cm</span>
        </div>
        <input type="range" min={140} max={210} defaultValue={bmi.height} style={{ width: "100%", marginTop: 10, accentColor: T.primary }} />
      </Card>

      {/* Band guide */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>BMI reference</SectionLabel>
        {bands.map(({ label, range, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 13, fontWeight: label === bmi.label ? 600 : 400, color: label === bmi.label ? T.text : T.sub }}>{label}</span>
              {label === bmi.label && <Chip label="You" color={color} />}
            </div>
            <span style={{ fontSize: 12, color: T.muted }}>{range}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  LAYOUT CHROME
// ══════════════════════════════════════════════════════════════════════════════

// Sidebar (desktop + tablet icon-only)
function Sidebar({ tab, onTab, collapsed, onToggle, theme, onTheme }) {
  return (
    <aside style={{
      width: collapsed ? 58 : 200, minHeight: "100%",
      background: T.card, borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      transition: "width .2s", flexShrink: 0, overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "15px 12px" : "15px 14px", borderBottom: `1px solid ${T.border}`, minHeight: 54 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <I d={ICONS.fire} size={13} sw={2.5} />
        </div>
        {!collapsed && <span style={{ fontWeight: 700, fontSize: 14, color: T.text, whiteSpace: "nowrap" }}>HealthTrack SG</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 5px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ id, label, icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => onTab(id)} title={collapsed ? label : ""} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 11px", borderRadius: 8, border: "none", cursor: "pointer",
              background: active ? `${T.primary}20` : "transparent",
              color: active ? T.primary : T.sub, width: "100%", textAlign: "left",
              transition: "background .12s, color .12s",
            }}>
              <I d={ICONS[icon]} size={16} sw={2} />
              {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: "nowrap", flex: 1 }}>{label}</span>}
              {!collapsed && active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.primary }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "8px 5px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 2 }}>
        <button onClick={onTheme} title={collapsed ? "Toggle theme" : ""} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: T.muted, width: "100%" }}>
          <I d={theme === "dark" ? ICONS.sun : ICONS.moon} size={16} sw={2} />
          {!collapsed && <span style={{ fontSize: 13 }}>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>
        <button onClick={onToggle} title={collapsed ? "Expand" : "Collapse"} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: T.muted, width: "100%" }}>
          <I d={collapsed ? ICONS.chevR : ICONS.chevL} size={16} sw={2} />
          {!collapsed && <span style={{ fontSize: 13 }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

// Desktop top bar
function TopBar({ tab }) {
  const current = NAV.find((n) => n.id === tab);
  return (
    <div style={{ height: 52, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: T.surface, flexShrink: 0 }}>
      <div>
        <span style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{current?.label}</span>
        <span style={{ fontSize: 12, color: T.muted, marginLeft: 10 }}>Tuesday, 14 April 2026</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.sub, fontSize: 12, cursor: "pointer" }}>
          <I d={ICONS.target} size={13} sw={2} /> Goals
        </button>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>J</div>
      </div>
    </div>
  );
}

// Mobile header
function MobileHeader({ tab, theme, onTheme }) {
  const current = NAV.find((n) => n.id === tab);
  return (
    <header style={{ height: 52, background: T.card, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <I d={ICONS.fire} size={13} sw={2.5} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{current?.label}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onTheme} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.sub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <I d={theme === "dark" ? ICONS.sun : ICONS.moon} size={13} sw={2} />
        </button>
        <button style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.sub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <I d={ICONS.target} size={13} sw={2} />
        </button>
      </div>
    </header>
  );
}

// Mobile bottom tab bar — NO position:fixed, sits in flex column naturally
function BottomNav({ tab, onTab }) {
  return (
    <nav style={{ height: 58, background: T.card, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "stretch", flexShrink: 0 }}>
      {NAV.map(({ id, label, icon }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => onTab(id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            border: "none", background: "transparent", cursor: "pointer",
            color: active ? T.primary : T.muted,
            borderTop: active ? `2px solid ${T.primary}` : "2px solid transparent",
            paddingTop: 2,
          }}>
            <I d={ICONS[icon]} size={18} sw={2} />
            <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, letterSpacing: "0.02em" }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  RENDER PANEL
// ══════════════════════════════════════════════════════════════════════════════
function Panel({ tab, onNav, isMobile, isTablet }) {
  const cols = isMobile ? 1 : isTablet ? 2 : 4;
  const wrap = { padding: isMobile ? "12px 12px" : "18px 20px", flex: 1, overflowY: "auto" };
  return (
    <div style={wrap}>
      {tab === "db" && <PanelDashboard cols={cols} onNav={onNav} />}
      {tab === "fd" && <PanelNutrition cols={cols} />}
      {tab === "ac" && <PanelActivity cols={cols} />}
      {tab === "sl" && <PanelSleep cols={cols} />}
      {tab === "bm" && <PanelBmi cols={cols} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════════════════════
const VIEWPORTS = [
  { id: "desktop", label: "Desktop", w: "100%" },
  { id: "tablet",  label: "Tablet",  w: 768    },
  { id: "mobile",  label: "Mobile",  w: 375    },
];

export default function HealthDashboardMockup() {
  const [vp, setVp]           = useState("desktop");
  const [tab, setTab]         = useState("db");
  const [collapsed, setCol]   = useState(false);
  const [theme, setTheme]     = useState("dark");

  const cur      = VIEWPORTS.find((v) => v.id === vp);
  const isMobile  = vp === "mobile";
  const isTablet  = vp === "tablet";
  const isDesktop = vp === "desktop";
  const frameH    = isMobile ? 720 : isTablet ? 620 : "calc(100vh - 45px)";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "system-ui, -apple-system, sans-serif", color: T.text }}>

      {/* Viewport switcher bar */}
      <div style={{ padding: "8px 14px", borderBottom: `1px solid #28282d`, display: "flex", alignItems: "center", gap: 6, background: "#16161a", height: 45, boxSizing: "border-box" }}>
        <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 6 }}>Mockup</span>
        {VIEWPORTS.map((v) => (
          <button key={v.id} onClick={() => setVp(v.id)} style={{
            padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none",
            background: vp === v.id ? T.primary : "#27272b",
            color: vp === v.id ? "#fff" : T.muted,
            fontWeight: vp === v.id ? 600 : 400,
          }}>{v.label}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: T.muted }}>
          {isMobile ? "375px" : isTablet ? "768px" : "Full width"} · interactive
        </span>
      </div>

      {/* Device frame wrapper */}
      <div style={{ display: "flex", justifyContent: "center", padding: isMobile || isTablet ? "20px 16px 24px" : 0 }}>
        <div style={{
          width: cur?.w, maxWidth: "100%",
          height: frameH,
          background: T.surface,
          borderRadius: isMobile ? 26 : isTablet ? 16 : 0,
          overflow: "hidden",
          boxShadow: isMobile || isTablet ? "0 12px 48px rgba(0,0,0,.55)" : "none",
          border: isMobile || isTablet ? `1px solid ${T.border}` : "none",
          display: "flex", flexDirection: "column",
        }}>

          {/* ── Mobile ── */}
          {isMobile && (
            <>
              <MobileHeader tab={tab} theme={theme} onTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />
              <Panel tab={tab} onNav={setTab} isMobile isTablet={false} />
              <BottomNav tab={tab} onTab={setTab} />
            </>
          )}

          {/* ── Tablet ── */}
          {isTablet && (
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              <Sidebar tab={tab} onTab={setTab} collapsed={true} onToggle={() => {}} theme={theme} onTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <TopBar tab={tab} />
                <Panel tab={tab} onNav={setTab} isMobile={false} isTablet />
              </div>
            </div>
          )}

          {/* ── Desktop ── */}
          {isDesktop && (
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              <Sidebar tab={tab} onTab={setTab} collapsed={collapsed} onToggle={() => setCol(c => !c)} theme={theme} onTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <TopBar tab={tab} />
                <Panel tab={tab} onNav={setTab} isMobile={false} isTablet={false} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
