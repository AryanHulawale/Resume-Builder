import { stripFormatting } from "./richtext";

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const STORAGE_KEY = "resume-builder-v1";

// Orderable resume sections (header with name/contact always stays on top).
export const SECTION_KEYS = ["summary", "experience", "education", "skills", "projects", "certifications", "custom"];
export const SECTION_LABELS = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  custom: "Custom sections",
};
export const DEFAULT_SECTION_ORDER = [...SECTION_KEYS];

export function getSectionOrder(resume) {
  const raw = resume?.settings?.sectionOrder;
  const base = Array.isArray(raw) && raw.length ? raw : DEFAULT_SECTION_ORDER;
  const clean = base.filter((k) => SECTION_KEYS.includes(k));
  for (const k of SECTION_KEYS) if (!clean.includes(k)) clean.push(k);
  return clean;
}

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
    sectionOrder: ["summary", "experience", "education", "skills", "projects", "certifications", "custom"],
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

  const summaryLen = stripFormatting(p.summary || "").trim().split(/\s+/).filter(Boolean).length;
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
    .flatMap((e) => parseBullets(e.bullets).map(stripFormatting));
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
  if (!next.settings) next.settings = { ...structuredClone(defaultResume.settings) };
  else {
    if (!next.settings.fontSize) next.settings.fontSize = defaultResume.settings.fontSize;
    if (!next.settings.accent) next.settings.accent = defaultResume.settings.accent;
    if (!next.settings.template) next.settings.template = defaultResume.settings.template;
    if (!Array.isArray(next.settings.sectionOrder) || !next.settings.sectionOrder.length) {
      // Preserve each template's historic default order for existing saves.
      const t = next.settings.template;
      if (t === "modern") next.settings.sectionOrder = ["summary", "experience", "projects", "education", "skills", "certifications", "custom"];
      else if (t === "minimal") next.settings.sectionOrder = ["summary", "experience", "skills", "education", "projects", "certifications", "custom"];
      else next.settings.sectionOrder = [...DEFAULT_SECTION_ORDER];
    }
  }
  return next;
}

// ---- Experience bullets: one non-empty line = one bullet point ----
// Stored as a "\n"-joined string (backwards compatible). The editor shows
// one box per bullet so long sentences wrap automatically — press Enter
// only for a new point, never mid-sentence.
export function stripBulletMarker(s) {
  return String(s || "")
    .replace(/^[•·▪○●◦‣⁃>›\-–—*+]+\s+/, "")
    .replace(/^\d{1,2}\s*[.\)\:\-–—]\s+/, "")
    .trim();
}

export function parseBullets(text) {
  if (text == null) return [];
  const raw = Array.isArray(text) ? text.join("\n") : String(text);
  return raw
    .split("\n")
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .map(stripBulletMarker)
    .filter(Boolean);
}

// Words that start a NEW accomplishment. Used only to re-join visual
// line-wraps (PDF imports + the editor's "Join wrapped lines" fix) —
// never in preview, where one line is always one •.
const BULLET_START_RE =
  /^(achieved|acted|analyzed|architected|assisted|automated|built|collaborated|contributed|coordinated|created|decreased|delivered|designed|developed|drove|enabled|engineered|engaged|established|executed|facilitated|fixed|founded|handled|headed|improved|implemented|increased|integrated|introduced|launched|led|maintained|managed|mentored|migrated|negotiated|optimized|orchestrated|owned|partnered|performed|piloted|presented|prototyped|published|reduced|refactored|resolved|revamped|shipped|simplified|spearheaded|streamlined|strengthened|supervised|supported|tested|transformed|upgraded|worked|wrote)\b/i;

function isMarkedBulletLine(raw) {
  return /^[•·▪○●◦‣⁃>›\-–—*+]+\s+/.test(raw.trim()) || /^\d{1,2}\s*[.\)\:\-–—]\s+/.test(raw.trim());
}

// Join wrapped fragments back into full points:
// ["Delivered 13 GIS tools, including Reservation", "Status Mapping, and Fire",
//  "Incident Response tool briefly led delivery in absence."]
// -> ["Delivered 13 GIS tools, including Reservation Status Mapping, and Fire Incident Response tool briefly led delivery in absence."]
export function smartJoinBullets(rawLines) {
  const lines = Array.isArray(rawLines)
    ? rawLines
    : String(rawLines ?? "").split("\n");
  const out = [];
  for (const raw of lines) {
    const t = (raw ?? "").trim();
    if (!t) continue;
    const marked = isMarkedBulletLine(raw);
    const clean = stripBulletMarker(t);
    if (!clean) continue;
    if (marked || out.length === 0) {
      out.push(clean);
      continue;
    }
    const prev = out[out.length - 1];
    if (/[.!?…]["'”’)\]]?\s*$/.test(prev)) {
      out.push(clean); // previous point is a complete sentence
    } else if (BULLET_START_RE.test(clean)) {
      out.push(clean); // reads like a new accomplishment
    } else {
      out[out.length - 1] = `${prev} ${clean}`.replace(/\s{2,}/g, " ");
    }
  }
  return out;
}
