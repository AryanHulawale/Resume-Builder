import { defaultResume, uid } from "./resume";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s\-().]{6,}\d)/;
const LINKEDIN_RE = /(linkedin\.com\/[^\s,;|)\]]+)/i;
const GITHUB_RE = /(github\.com\/[^\s,;|)\]]+)/i;
const URL_RE = /(https?:\/\/[^\s,;|)\]]+|(?:www\.)?[a-z0-9-]+\.(?:dev|com|io|me|tech|net|org|in)(?:\/[^\s,;|)\]]*)?)/i;
const DATE_TOKEN = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{4}|\\d{4}";
const DATE_RANGE_RE = new RegExp(`(${DATE_TOKEN})\\s*(?:[–—\\-|to]+)\\s*(Present|${DATE_TOKEN})`, "i");
const YEAR_RE = /(19|20)\d{2}/g;

const SECTION_DEFS = [
  { key: "summary", names: ["professional summary", "summary", "objective", "profile", "about me"] },
  { key: "experience", names: ["work experience", "experience", "employment history", "employment", "work history"] },
  { key: "education", names: ["education", "academic background", "academics", "qualifications"] },
  { key: "skills", names: ["skills", "technical skills", "tech stack", "technologies", "core skills", "key skills"] },
  { key: "projects", names: ["projects", "personal projects", "selected projects", "key projects"] },
  { key: "certifications", names: ["certifications", "certification", "certificates", "licenses", "license"] },
  { key: "custom", names: ["languages", "hobbies", "interests", "awards", "achievements", "publications", "volunteer", "references"] },
];

function normHeader(line) {
  return line.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
}

function detectSection(line) {
  const n = normHeader(line);
  if (!n || line.length > 45) return null;
  for (const def of SECTION_DEFS) {
    for (const name of def.names) {
      if (n === name || n.startsWith(name + " ") || n.endsWith(" " + name)) return def.key;
      // ALL-CAPS short headers like "EXPERIENCE"
      if (n === name) return def.key;
    }
  }
  return null;
}

function splitSections(lines) {
  const sections = { head: [] };
  let current = "head";
  let currentTitle = "";
  for (const raw of lines) {
    const line = raw.trim();
    const key = detectSection(line);
    if (key) {
      if (key === "custom") {
        // Keep original title for custom sections (e.g. "Languages")
        current = `custom:${line.replace(/[^A-Za-z ]/g, "").trim() || "Additional"}`;
      } else {
        current = key;
      }
      if (!sections[current]) sections[current] = [];
      currentTitle = line;
      void currentTitle;
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(raw);
  }
  return sections;
}

function cleanLines(arr) {
  return (arr || []).map((s) => (s || "").trim()).filter(Boolean);
}

function extractContact(fullText, headLines) {
  const email = fullText.match(EMAIL_RE)?.[0] || "";
  const github = fullText.match(GITHUB_RE)?.[1] || fullText.match(GITHUB_RE)?.[0] || "";
  const linkedin = fullText.match(LINKEDIN_RE)?.[1] || fullText.match(LINKEDIN_RE)?.[0] || "";

  // Phone: prefer match with 7-15 digits
  let phone = "";
  const phoneCandidates = fullText.match(new RegExp(PHONE_RE, "g")) || [];
  for (const c of phoneCandidates) {
    const digits = c.replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 15 && !(digits.length === 4 && /^19|^20/.test(digits))) {
      // skip pure year ranges already handled, accept first plausible
      if (c.includes("@")) continue;
      phone = c.trim();
      break;
    }
  }

  // Website: first URL that isn't linkedin/github/email domain
  let website = "";
  const urlMatches = fullText.match(new RegExp(URL_RE, "gi")) || [];
  for (const u of urlMatches) {
    const low = u.toLowerCase();
    if (low.includes("linkedin.com") || low.includes("github.com") || low.includes("@")) continue;
    website = u.replace(/[.,;]+$/, "");
    break;
  }

  // Location: top lines with a comma, not contact-ish.
  // Also handles contact lines like "email | phone | City, Country" by splitting on separators.
  let location = "";
  const headFragments = headLines.slice(0, 12).flatMap((l) => String(l).split(/[|•·▪]+/));
  for (const frag of headFragments) {
    const t = frag.trim();
    if (!t || t.length > 70 || !t.includes(",")) continue;
    if (EMAIL_RE.test(t) || /linkedin|github|https?:|www\./i.test(t)) continue;
    if (/^\+?[\d\s\-().]{7,}$/.test(t)) continue;
    if (/\d{4}/.test(t) && /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(t)) continue;
    if (/^[•·▪\-*]/.test(t)) continue;
    // Must contain letters on both sides of the comma (avoids "Doe, John" false positives excluded elsewhere,
    // but here we want "City, Country")
    location = t;
    break;
  }

  // Name: first meaningful line
  let fullName = "";
  for (const line of headLines.slice(0, 6)) {
    const t = line.trim();
    if (!t) continue;
    if (EMAIL_RE.test(t) || PHONE_RE.test(t) || /linkedin|github|http/i.test(t)) continue;
    if (detectSection(t)) continue;
    if (t.length > 45 || /\d/.test(t)) continue;
    const words = t.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      fullName = t;
      break;
    }
  }
  if (!fullName) {
    const first = (headLines.find((l) => l.trim() && !EMAIL_RE.test(l)) || "").trim();
    if (first && first.length <= 60 && !/http|linkedin|github/i.test(first)) fullName = first;
  }

  // Title: line right after name
  let title = "";
  if (fullName) {
    const idx = headLines.findIndex((l) => l.trim() === fullName);
    for (let i = idx + 1; i < Math.min(idx + 4, headLines.length); i++) {
      const t = (headLines[i] || "").trim();
      if (!t || EMAIL_RE.test(t) || /linkedin|github|http|@/i.test(t)) continue;
      if (detectSection(t)) break;
      if (t.includes(",") && t.length > 50) continue; // likely location
      if (/^\+?[\d\s\-().]{7,}$/.test(t)) continue; // phone line
      if (t.length <= 80) {
        title = t;
        break;
      }
    }
  }

  return { fullName, title, email, phone, location, linkedin, github, website };
}

function stripBullet(s) {
  return s.replace(/^[•·▪○●*–—-]+\s*/, "").trim();
}

function isBulletLine(s) {
  return /^[•·▪○●*–—-]/.test(s.trim());
}

function parseExperience(lines) {
  const clean = cleanLines(lines);
  if (!clean.length) return [];
  // Find job start indices: lines with date range
  const starts = [];
  clean.forEach((l, i) => {
    if (DATE_RANGE_RE.test(l)) starts.push(i);
  });
  let blocks = [];
  if (starts.length === 0) {
    // Fallback: treat whole section as one job if it has content
    blocks = [clean];
  } else {
    // Include 1-2 lines before the date line as part of header (role/company)
    starts.forEach((s, k) => {
      const end = starts[k + 1] ?? clean.length;
      let begin = s;
      // walk back up to 2 lines if they don't look like bullets
      for (let b = s - 1; b >= Math.max(0, s - 2); b--) {
        if (isBulletLine(clean[b]) || DATE_RANGE_RE.test(clean[b])) break;
        // stop at previous block end
        if (k > 0 && b < starts[k - 1]) break;
        if (k > 0 && b <= starts[k - 1]) break;
        begin = b;
      }
      blocks.push(clean.slice(begin, end));
    });
    // Preamble before first job that's not header -> attach to first block
    const firstBegin = (() => {
      let b = starts[0];
      for (let x = starts[0] - 1; x >= Math.max(0, starts[0] - 2); x--) {
        if (isBulletLine(clean[x]) || DATE_RANGE_RE.test(clean[x])) break;
        b = x;
      }
      return b;
    })();
    if (firstBegin > 0) {
      const pre = clean.slice(0, firstBegin).filter((l) => !detectSection(l));
      if (pre.length) blocks[0] = [...pre.slice(-2), ...blocks[0]];
    }
  }

  return blocks.slice(0, 10).map((block) => {
    const dateIdx = block.findIndex((l) => DATE_RANGE_RE.test(l));
    let headerLines = [];
    let bulletLines = [];
    if (dateIdx === -1) {
      headerLines = block.slice(0, 1);
      bulletLines = block.slice(1);
    } else {
      // header = lines up to and including date line
      headerLines = block.slice(0, dateIdx + 1);
      bulletLines = block.slice(dateIdx + 1);
      // If header got too long (bullets absorbed), split: keep first 2 + date line
      if (headerLines.length > 3) {
        const dateLine = block[dateIdx];
        const before = block.slice(0, dateIdx);
        headerLines = [...before.slice(0, 2), dateLine];
        bulletLines = [...before.slice(2), ...bulletLines];
      }
    }

    const headerText = headerLines.join(" | ");
    const m = headerText.match(DATE_RANGE_RE);
    let start = "", end = "", current = false;
    if (m) {
      start = (m[1] || "").trim();
      end = (m[2] || "").trim();
      if (/present/i.test(end)) current = true;
    }
    // Remove date from header to get role/company
    let roleCompany = headerText.replace(DATE_RANGE_RE, "").replace(/[|•]+/g, " ").replace(/\s{2,}/g, " ").trim();
    roleCompany = roleCompany.replace(/^[,\-–—|]+\s*/, "").replace(/\s*[,\-–—|]+\s*$/, "");
    let role = "", company = "", location = "";
    const parts = roleCompany.split(/\s+@\s+|\s+at\s+|\s*\|\s*|\s+—\s+|\s+–\s+|\s+-\s+/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      role = parts[0];
      company = parts[1];
      location = parts.slice(2).join(", ");
    } else if (parts.length === 1) {
      // Try comma split "Role, Company"
      const c = parts[0].split(/,\s*/);
      if (c.length >= 2 && c[0].length < 60) {
        role = c[0].trim();
        company = c[1].trim();
        location = c.slice(2).join(", ").trim();
      } else {
        role = parts[0];
      }
    }

    const bullets = bulletLines
      .map((l) => stripBullet(l))
      .filter((l) => l && !DATE_RANGE_RE.test(l))
      .join("\n");

    return {
      id: uid(),
      role: role.slice(0, 120),
      company: company.slice(0, 120),
      location: location.slice(0, 120),
      start,
      end: current ? "" : end,
      current,
      bullets,
    };
  }).filter((j) => j.role || j.company || j.bullets);
}

function parseEducation(lines) {
  const clean = cleanLines(lines);
  if (!clean.length) return [];
  // Split into blocks on lines containing a year, or every 3 lines fallback
  const starts = [];
  clean.forEach((l, i) => {
    YEAR_RE.lastIndex = 0;
    if (YEAR_RE.test(l)) starts.push(i);
  });
  let blocks = [];
  if (starts.length <= 1) {
    // chunk by 3 lines
    for (let i = 0; i < clean.length; i += 3) blocks.push(clean.slice(i, i + 3));
  } else {
    starts.forEach((s, k) => {
      const end = starts[k + 1] ?? clean.length;
      let begin = s;
      for (let b = s - 1; b >= Math.max(0, s - 2); b--) {
        if (k > 0 && b < starts[k - 1]) break;
        begin = b;
      }
      blocks.push(clean.slice(begin, end));
    });
  }
  return blocks.slice(0, 5).map((block) => {
    const text = block.join(" | ");
    const years = text.match(/(19|20)\d{2}/g) || [];
    const degree = stripBullet(block[0] || "").slice(0, 140);
    const school = stripBullet(block[1] || block[0]?.split(/[,—–-]/).slice(-1)[0] || "").slice(0, 140);
    const details = block.slice(2).join(" ").slice(0, 300);
    return {
      id: uid(),
      degree,
      school: block.length > 1 ? school : "",
      start: years[0] || "",
      end: years[1] || years[0] || "",
      details,
    };
  }).filter((e) => e.degree || e.school);
}

function parseSkills(lines) {
  const text = cleanLines(lines).join("\n");
  if (!text) return [];
  const parts = text.split(/[,•·▪|/\n;·]+/).map((s) => s.replace(/^[•*–—\s-]+/, "").trim()).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    if (p.length < 1 || p.length > 40) continue;
    if (/^(and|with|using)$/i.test(p)) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= 30) break;
  }
  return out;
}

function parseProjects(lines) {
  const clean = cleanLines(lines);
  if (!clean.length) return [];
  // Group: short title line starts a new project
  const blocks = [];
  let cur = [];
  for (const l of clean) {
    const t = stripBullet(l);
    const isTitleLike = t.length <= 70 && !isBulletLine(l) && (cur.length >= 2 || cur.length === 0);
    if (isTitleLike && cur.length > 0) {
      // if current block already has title+content, start new
      if (cur.length >= 1 && cur.join(" ").length > 40) {
        blocks.push(cur);
        cur = [l];
        continue;
      }
    }
    cur.push(l);
    if (cur.length >= 5) {
      blocks.push(cur);
      cur = [];
    }
  }
  if (cur.length) blocks.push(cur);
  return blocks.slice(0, 10).map((block) => {
    const title = stripBullet(block[0] || "").slice(0, 120);
    const rest = block.slice(1).join(" ");
    const link = (rest.match(URL_RE) || block.join(" ").match(URL_RE))?.[0]?.replace(/[.,;]+$/, "") || "";
    const techM = rest.match(/(?:tech|stack|built with|technologies)\s*[:-]\s*([^.|\n]{2,80})/i);
    const parenM = title.match(/\(([^)]{2,60})\)/);
    const tech = (techM?.[1] || parenM?.[1] || "").trim().slice(0, 120);
    const name = title.replace(/\([^)]*\)/, "").trim();
    const description = block.slice(1).join(" ").replace(URL_RE, "").trim().slice(0, 500);
    return { id: uid(), name, link, tech, description };
  }).filter((p) => p.name || p.description);
}

function parseCertifications(lines) {
  const clean = cleanLines(lines);
  return clean.slice(0, 10).map((line) => {
    const t = stripBullet(line);
    const years = t.match(/(19|20)\d{2}/g) || [];
    let rest = t;
    let year = years[years.length - 1] || "";
    rest = rest.replace(/\(?(19|20)\d{2}\)?/g, "").replace(/[–,—-]+$/, "").trim();
    const parts = rest.split(/\s+[—–-]\s+|\s*\|\s*|,\s*(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
    return {
      id: uid(),
      name: (parts[0] || rest).slice(0, 140),
      issuer: (parts[1] || "").slice(0, 120),
      year,
    };
  }).filter((c) => c.name);
}

export function parseResumeText(rawText) {
  const text = (rawText || "").replace(/\r/g, "").trim();
  if (!text) throw new Error("NO_TEXT");
  const lines = text.split("\n");
  const sections = splitSections(lines);
  const headLines = cleanLines(sections.head).slice(0, 15);

  const contact = extractContact(text, headLines.length ? headLines : lines.slice(0, 15));

  const summaryLines = cleanLines(sections.summary);
  // If no explicit summary section, use head leftover lines after contact as fallback? Keep empty to avoid junk.
  const summary = summaryLines.join(" ").slice(0, 1000);

  const experience = parseExperience(sections.experience || []);
  const education = parseEducation(sections.education || []);
  const skills = parseSkills(sections.skills || []);
  const projects = parseProjects(sections.projects || []);
  const certifications = parseCertifications(sections.certifications || []);

  const customSections = [];
  for (const key of Object.keys(sections)) {
    if (key.startsWith("custom:")) {
      const title = key.slice(7);
      const content = cleanLines(sections[key]).join("\n").slice(0, 1000);
      if (content) customSections.push({ id: uid(), title, content });
    }
  }

  const base = structuredClone(defaultResume);
  return {
    personal: {
      ...base.personal,
      fullName: contact.fullName || "",
      title: contact.title || "",
      email: contact.email || "",
      phone: contact.phone || "",
      location: contact.location || "",
      linkedin: contact.linkedin || "",
      github: contact.github || "",
      website: contact.website || "",
      summary: summary || "",
    },
    experience,
    education,
    skills,
    projects,
    certifications,
    customSections,
  };
}

export function hasUsefulData(parsed) {
  if (!parsed) return false;
  const p = parsed.personal || {};
  if (p.fullName || p.email || p.phone || p.summary) return true;
  return Boolean(
    (parsed.experience || []).length ||
    (parsed.education || []).length ||
    (parsed.skills || []).length ||
    (parsed.projects || []).length ||
    (parsed.certifications || []).length ||
    (parsed.customSections || []).length
  );
}

export function summarizeParsed(parsed) {
  const bits = [];
  if (parsed.personal?.fullName) bits.push(`name (${parsed.personal.fullName})`);
  if (parsed.personal?.email) bits.push("email");
  if (parsed.personal?.phone) bits.push("phone");
  if ((parsed.experience || []).length) bits.push(`${parsed.experience.length} job(s)`);
  if ((parsed.skills || []).length) bits.push(`${parsed.skills.length} skill(s)`);
  if ((parsed.education || []).length) bits.push(`${parsed.education.length} education`);
  if ((parsed.projects || []).length) bits.push(`${parsed.projects.length} project(s)`);
  if ((parsed.certifications || []).length) bits.push(`${parsed.certifications.length} certification(s)`);
  return bits.length ? bits.join(", ") : "nothing recognizable";
}

export const __testables = {
  splitSections,
  extractContact,
  parseExperience,
  parseEducation,
  parseSkills,
  parseProjects,
  parseCertifications,
};
