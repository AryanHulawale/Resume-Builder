export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const STORAGE_KEY = "resume-builder-v1";

export const defaultResume = {
  personal: {
    fullName: "Aarav Sharma",
    title: "Frontend Developer",
    email: "aarav.sharma@email.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    linkedin: "linkedin.com/in/aaravsharma",
    github: "github.com/aaravsharma",
    website: "aaravsharma.dev",
    summary:
      "Frontend developer with 3+ years of experience building responsive React applications. Passionate about performance, accessibility, and clean UI. Improved conversion by 24% at last role by redesigning checkout flow.",
  },
  experience: [
    {
      id: "exp1",
      role: "Frontend Developer",
      company: "Flipkart",
      location: "Bengaluru",
      start: "Jun 2023",
      end: "Present",
      current: true,
      bullets: [
        "Built React + Tailwind component library used by 4 teams, reducing development time by 30%",
        "Improved Lighthouse performance score from 68 to 94 by code-splitting and image optimization",
        "Mentored 2 junior developers and led weekly code reviews",
      ].join("\n"),
    },
    {
      id: "exp2",
      role: "Web Developer Intern",
      company: "StartupXYZ",
      location: "Remote",
      start: "Jan 2023",
      end: "May 2023",
      current: false,
      bullets: [
        "Developed landing pages that increased signup conversion by 18%",
        "Integrated REST APIs and fixed 40+ UI bugs before launch",
      ].join("\n"),
    },
  ],
  education: [
    {
      id: "edu1",
      degree: "B.Tech, Computer Science",
      school: "VTU, Bengaluru",
      start: "2020",
      end: "2024",
      details: "CGPA: 8.6/10. Relevant coursework: DSA, DBMS, Web Tech.",
    },
  ],
  skills: [
    "Frontend Technologies: React, JavaScript, TypeScript, Tailwind CSS",
    "Backend & Tools: Node.js, Git, REST APIs, Vite",
  ].join("\n"),
  projects: [
    {
      id: "proj1",
      name: "Resume Builder App",
      link: "github.com/aaravsharma/resume-builder",
      tech: "React, Tailwind",
      description: "Live resume editor with templates, ATS check, and PDF export. 500+ users.",
    },
  ],
  certifications: [
    {
      id: "cert1",
      name: "Meta Front-End Developer Professional",
      issuer: "Coursera",
      year: "2024",
    },
  ],
  customSections: [
    {
      id: "cus1",
      title: "Languages",
      content: "English (Fluent), Hindi (Native), Kannada (Basic)",
    },
  ],
  settings: {
    template: "modern",
    accent: "#2563eb",
    fontSize: "medium",
  },
};

export function loadResume() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultResume);
    const parsed = JSON.parse(raw);
    return migrateResume({ ...structuredClone(defaultResume), ...parsed });
  } catch {
    return structuredClone(defaultResume);
  }
}

export function saveResume(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const ACTION_VERBS = [
  "built", "led", "improved", "increased", "reduced", "developed",
  "designed", "launched", "managed", "created", "optimized", "automated",
  "mentored", "delivered", "achieved", "implemented",
];

export function computeATS(resume) {
  const checks = [];
  const p = resume.personal || {};
  const flatSkills = getFlatSkills(resume.skills);

  checks.push({
    id: "contact",
    label: "Contact info complete (name, email, phone, location)",
    pass: Boolean(p.fullName && p.email && p.phone && p.location),
    tip: "Add missing name, email, phone, or location.",
  });

  const summaryLen = (p.summary || "").trim().split(/\s+/).filter(Boolean).length;
  checks.push({
    id: "summary",
    label: `Professional summary (${summaryLen} words, aim 30–80)`,
    pass: summaryLen >= 30 && summaryLen <= 120,
    tip: "Write 2–4 lines: years, stack, 1–2 measurable wins.",
  });

  const expCount = resume.experience?.length || 0;
  checks.push({
    id: "exp-count",
    label: `Work experience entries (${expCount})`,
    pass: expCount >= 1,
    tip: "Add at least one role with 2–3 bullets.",
  });

  const allBullets = (resume.experience || [])
    .flatMap((e) => (e.bullets || "").split("\n").map((b) => b.trim()).filter(Boolean));
  const withNumbers = allBullets.filter((b) => /\d/.test(b)).length;
  checks.push({
    id: "metrics",
    label: `Bullets with numbers/metrics (${withNumbers}/${allBullets.length || 0})`,
    pass: allBullets.length >= 3 && withNumbers >= Math.ceil(allBullets.length / 2),
    tip: "Quantify impact: %, time saved, users, revenue.",
  });

  const verbHits = allBullets.filter((b) =>
    ACTION_VERBS.some((v) => b.toLowerCase().startsWith(v))
  ).length;
  checks.push({
    id: "verbs",
    label: `Bullets start with action verbs (${verbHits}/${allBullets.length || 0})`,
    pass: verbHits >= Math.ceil(allBullets.length / 2) && allBullets.length > 0,
    tip: "Start bullets with Built, Led, Improved, etc.",
  });

  checks.push({
    id: "skills",
    label: `Skills listed (${flatSkills.length}, aim 6+)`,
    pass: flatSkills.length >= 6,
    tip: "Add 6–12 relevant hard skills / tools.",
  });

  checks.push({
    id: "education",
    label: "Education section filled",
    pass: (resume.education?.length || 0) >= 1 && Boolean(resume.education[0]?.degree && resume.education[0]?.school),
    tip: "Add degree + school + years.",
  });

  checks.push({
    id: "links",
    label: "Professional links (LinkedIn / GitHub / portfolio)",
    pass: Boolean(p.linkedin || p.github || p.website),
    tip: "Add LinkedIn and GitHub/portfolio URLs.",
  });

  const totalWords =
    JSON.stringify(resume).split(/\s+/).length;
  checks.push({
    id: "length",
    label: `Reasonable length (~${totalWords} words total)`,
    pass: totalWords >= 200 && totalWords <= 900,
    tip: "Aim for 1 page: cut fluff if over ~800 words.",
  });

  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  return { score, checks, passed, total: checks.length };
}

export function moveItem(arr, index, dir) {
  const next = [...arr];
  const j = index + dir;
  if (j < 0 || j >= next.length) return next;
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

// ---- Skills helpers: section-wise (newline = new section, comma = separator) ----
// Canonical `resume.skills` is now a multiline string, e.g.
//   "Frontend Technologies: React, HTML5, CSS3\nBackend: Node.js, Express"
// Old saved resumes may still have `skills` as a flat string[] — helpers accept both.

export function getSkillLines(skills) {
  if (skills == null) return [];
  const raw = Array.isArray(skills) ? skills.join("\n") : String(skills);
  return raw
    .split("\n")
    .map((s) => (s || "").trim())
    .filter(Boolean);
}

export function getFlatSkills(skills) {
  const lines = getSkillLines(skills);
  const out = [];
  const seen = new Set();
  for (const line of lines) {
    // Strip "Category:" prefix so Modern pills stay comma-separated individual skills.
    let itemsPart = line;
    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      const after = line.slice(colonIdx + 1).trim();
      if (after) itemsPart = after;
    }
    const parts = itemsPart.split(/[,•·|;]+/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const clean = part.replace(/^[•*–—\s-]+/, "").trim();
      if (!clean || clean.length > 60) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }
  }
  return out;
}

export function normalizeSkillsToText(skills) {
  if (typeof skills === "string") return skills;
  if (Array.isArray(skills)) {
    const flatRaw = skills.map((s) => String(s || "").trim()).filter(Boolean);
    if (!flatRaw.length) return "";
    // Preserve any newlines the user typed before (they were stored inside items).
    const withBreaks = flatRaw.join("\n");
    if (withBreaks.includes("\n")) {
      // Re-join: lines that look like "Label: ..." stay on their own line,
      // loose comma fragments get merged back with ", ".
      const lines = withBreaks.split("\n").map((s) => s.trim()).filter(Boolean);
      if (lines.some((l) => l.includes(":"))) return lines.join("\n");
      return lines.join(", ");
    }
    if (flatRaw.some((s) => s.includes(":") || s.includes(","))) {
      return flatRaw.join("\n");
    }
    return flatRaw.join(", ");
  }
  return "";
}

export function migrateResume(data) {
  if (!data || typeof data !== "object") return structuredClone(defaultResume);
  const next = { ...data };
  next.skills = normalizeSkillsToText(data.skills);
  if (!next.settings) next.settings = { ...defaultResume.settings };
  return next;
}
