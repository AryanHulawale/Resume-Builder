import { useRef } from "react";
import { SECTION_LABELS, getSectionOrder, moveItem, normalizeSkillsToText, smartJoinBullets, uid } from "../lib/resume";
import { clearMarks, toggleMark, upperSelection } from "../lib/richtext";

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function Area({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
      <textarea
        rows={3}
        {...props}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

const richBtn =
  "rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40";

function RichButtons({ onBold, onItalic, onUnderline, onCaps, onClear }) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" title="Bold (Ctrl+B)" onClick={onBold} className={`${richBtn} font-bold`}>B</button>
      <button type="button" title="Italic (Ctrl+I)" onClick={onItalic} className={`${richBtn} italic`}>I</button>
      <button type="button" title="Underline (Ctrl+U)" onClick={onUnderline} className={`${richBtn} underline`}>U</button>
      <button type="button" title="UPPERCASE selected text" onClick={onCaps} className={richBtn}>AA</button>
      <button type="button" title="Clear formatting from selection" onClick={onClear} className={richBtn}>✕</button>
    </div>
  );
}

function applyWithRef(ref, value, onChange, fn) {
  const el = ref.current;
  const v = String(value ?? "");
  const s = el ? (el.selectionStart ?? v.length) : v.length;
  const e = el ? (el.selectionEnd ?? v.length) : v.length;
  const r = fn(v, s, e);
  onChange(r.value);
  requestAnimationFrame(() => {
    if (!el) return;
    el.focus();
    try {
      el.setSelectionRange(r.sel[0], r.sel[1]);
    } catch { /* ignore */ }
  });
}

function useRichShortcuts(handlers) {
  return (ev) => {
    if (!(ev.ctrlKey || ev.metaKey)) return;
    const k = String(ev.key || "").toLowerCase();
    if (k === "b") {
      ev.preventDefault();
      handlers.bold();
    } else if (k === "i") {
      ev.preventDefault();
      handlers.italic();
    } else if (k === "u") {
      ev.preventDefault();
      handlers.underline();
    }
  };
}

// Word-style text area: toolbar on top (B I U CAPS Clear) + Ctrl+B/I/U shortcuts.
// Stores **bold**, *italic*, __underline__ as plain text — preview renders them.
export function RichArea({ label, value, onChange, rows = 3, placeholder }) {
  const ref = useRef(null);
  const apply = (fn) => applyWithRef(ref, value, onChange, fn);
  const bold = () => apply((v, s, e) => toggleMark(v, s, e, "**"));
  const italic = () => apply((v, s, e) => toggleMark(v, s, e, "*"));
  const underline = () => apply((v, s, e) => toggleMark(v, s, e, "__"));
  const caps = () => apply(upperSelection);
  const clear = () => apply(clearMarks);
  const onKeyDown = useRichShortcuts({ bold, italic, underline });
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
        <RichButtons onBold={bold} onItalic={italic} onUnderline={underline} onCaps={caps} onClear={clear} />
      </div>
      <textarea
        ref={ref}
        rows={rows}
        value={value ?? ""}
        onChange={(ev) => onChange(ev.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <p className="mt-1 text-[11px] text-slate-400">Select text, then B / Ctrl+B for bold · Ctrl+I italic · Ctrl+U underline</p>
    </div>
  );
}

// One textbox per bullet point. Long text wraps automatically inside its box,
// so Enter is ONLY for starting a new point — it can never split a sentence
// mid-line by accident (the bug in the screenshot).
export function BulletList({ value, onChange }) {
  const items = String(value ?? "").split("\n");
  if (items.length === 0) items.push("");
  const refs = useRef([]);
  const focusIdx = useRef(0);

  const commit = (next, focusIdx = -1) => {
    onChange(next.join("\n"));
    if (focusIdx >= 0) {
      requestAnimationFrame(() => {
        const el = refs.current[focusIdx];
        if (el) {
          el.focus();
          try {
            const len = el.value.length;
            el.setSelectionRange(len, len);
          } catch { /* ignore */ }
        }
      });
    }
  };

  const updateAt = (i, newVal) => {
    if (newVal.includes("\n")) {
      // Pasted multi-line text -> one bullet per line.
      const parts = newVal.split("\n");
      const next = [...items];
      next.splice(i, 1, ...parts);
      commit(next, i + parts.length - 1);
    } else {
      const next = [...items];
      next[i] = newVal;
      commit(next);
    }
  };

  const splitAtCursor = (i, e) => {
    e.preventDefault();
    const el = e.currentTarget;
    const pos = el.selectionStart ?? String(items[i] ?? "").length;
    const cur = String(items[i] ?? "");
    const before = cur.slice(0, pos).trimEnd();
    const after = cur.slice(pos).trimStart();
    const next = [...items];
    next.splice(i, 1, before, after);
    commit(next, i + 1);
  };

  const removeAt = (i) => {
    if (items.length <= 1) {
      commit([""]);
      return;
    }
    commit(items.filter((_, idx) => idx !== i), Math.max(0, i - 1));
  };

  // Toolbar above the list acts on the last-focused box.
  const boxApply = (fn) => {
    const i = Math.min(focusIdx.current ?? 0, items.length - 1);
    const el = refs.current[i];
    const cur = String(items[i] ?? "");
    const s = el ? (el.selectionStart ?? cur.length) : cur.length;
    const e = el ? (el.selectionEnd ?? cur.length) : cur.length;
    const r = fn(cur, s, e);
    if (r.value.includes("\n")) return; // marks never add newlines; safety net
    const next = [...items];
    next[i] = r.value;
    commit(next);
    requestAnimationFrame(() => {
      const n = refs.current[i];
      if (!n) return;
      n.focus();
      try {
        n.setSelectionRange(r.sel[0], r.sel[1]);
      } catch { /* ignore */ }
    });
  };

  const boxKeyDown = (i) => (ev) => {
    if ((ev.ctrlKey || ev.metaKey)) {
      const k = String(ev.key || "").toLowerCase();
      const marks = { b: "**", i: "*", u: "__" };
      if (marks[k]) {
        ev.preventDefault();
        const el = ev.currentTarget;
        const cur = String(items[i] ?? "");
        const r = toggleMark(cur, el.selectionStart ?? cur.length, el.selectionEnd ?? cur.length, marks[k]);
        const next = [...items];
        next[i] = r.value;
        commit(next);
        requestAnimationFrame(() => {
          try {
            el.focus();
            el.setSelectionRange(r.sel[0], r.sel[1]);
          } catch { /* ignore */ }
        });
        return;
      }
    }
    if (ev.key === "Enter") splitAtCursor(i, ev);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Highlights — one point per box (Enter = new point)
        </span>
        <RichButtons
          onBold={() => boxApply((v, s, e) => toggleMark(v, s, e, "**"))}
          onItalic={() => boxApply((v, s, e) => toggleMark(v, s, e, "*"))}
          onUnderline={() => boxApply((v, s, e) => toggleMark(v, s, e, "__"))}
          onCaps={() => boxApply(upperSelection)}
          onClear={() => boxApply(clearMarks)}
        />
      </div>
      <div className="space-y-2">
        {items.map((b, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <textarea
              ref={(el) => { refs.current[i] = el; }}
              rows={Math.min(4, Math.max(2, Math.ceil((String(b).length || 1) / 90)))}
              value={b}
              onChange={(ev) => updateAt(i, ev.target.value)}
              onFocus={() => { focusIdx.current = i; }}
              onKeyDown={boxKeyDown(i)}
              placeholder={i === 0 ? "Delivered 13 GIS-based tool components for BMC 3D Mumbai Project…" : "Next achievement…"}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              title="Remove this point"
              className="mt-1.5 shrink-0 rounded-md border border-slate-200 px-1.5 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] leading-relaxed text-slate-400">
          Let long sentences wrap on their own — press <b>Enter</b> only for a new point.
        </p>
        <div className="flex shrink-0 gap-1.5">
          {items.length > 1 && (
            <button
              type="button"
              title="Merge lines that are just word-wraps of the same point (e.g. pasted text split mid-sentence)"
              onClick={() => {
                const joined = smartJoinBullets(items);
                if (joined.length < items.filter((s) => String(s).trim()).length) {
                  commit(joined, 0);
                }
              }}
              className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
            >
              ✨ Join wrapped lines
            </button>
          )}
          <button type="button" onClick={() => commit([...items, ""], items.length)} className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            + Add point
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MoveButtons({ onUp, onDown }) {
  return (
    <div className="flex gap-1">
      <button type="button" onClick={onUp} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" title="Move up">↑</button>
      <button type="button" onClick={onDown} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" title="Move down">↓</button>
    </div>
  );
}

const btnPrimary = "rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700";
const btnGhost = "rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50";
const btnDanger = "rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50";

export default function Editor({ resume, setResume }) {
  const patch = (obj) => setResume((r) => ({ ...r, ...obj }));
  const patchPersonal = (k, v) => setResume((r) => ({ ...r, personal: { ...r.personal, [k]: v } }));

  const updateList = (key, id, values) =>
    setResume((r) => ({
      ...r,
      [key]: r[key].map((it) => (it.id === id ? { ...it, ...values } : it)),
    }));

  const removeFrom = (key, id) =>
    setResume((r) => ({ ...r, [key]: r[key].filter((it) => it.id !== id) }));

  const moveIn = (key, idx, dir) =>
    setResume((r) => ({ ...r, [key]: moveItem(r[key], idx, dir) }));

  const p = resume.personal;
  const sectionOrder = getSectionOrder(resume);
  const moveSection = (idx, dir) =>
    setResume((r) => ({
      ...r,
      settings: { ...r.settings, sectionOrder: moveItem(getSectionOrder(r), idx, dir) },
    }));

  return (
    <div className="space-y-4">
      <Section title="Personal info + social links">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name" value={p.fullName} onChange={(e) => patchPersonal("fullName", e.target.value)} placeholder="Aarav Sharma" />
          <Field label="Job title" value={p.title} onChange={(e) => patchPersonal("title", e.target.value)} placeholder="Frontend Developer" />
          <Field label="Email" value={p.email} onChange={(e) => patchPersonal("email", e.target.value)} placeholder="you@email.com" />
          <Field label="Phone" value={p.phone} onChange={(e) => patchPersonal("phone", e.target.value)} placeholder="+91 ..." />
          <Field label="Location" value={p.location} onChange={(e) => patchPersonal("location", e.target.value)} placeholder="City, Country" />
          <Field label="LinkedIn" value={p.linkedin} onChange={(e) => patchPersonal("linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
          <Field label="GitHub" value={p.github} onChange={(e) => patchPersonal("github", e.target.value)} placeholder="github.com/..." />
          <Field label="Website / Portfolio" value={p.website} onChange={(e) => patchPersonal("website", e.target.value)} placeholder="your-site.dev" />
        </div>
        <RichArea label="Professional summary" rows={4} value={p.summary} onChange={(v) => patchPersonal("summary", v)} placeholder="2–4 lines: years, stack, measurable wins... Select text + Ctrl+B for bold." />
      </Section>

      <Section title="Resume sections order (↑ ↓ moves whole section)">
        <p className="text-[11px] leading-relaxed text-slate-400">
          Move the entire Skills block above / below Experience, Education, Projects, etc. Applies to all templates.
        </p>
        <div className="space-y-1.5">
          {sectionOrder.map((key, i) => (
            <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-1.5">
              <span className="text-xs font-bold text-slate-700">#{i + 1} · {SECTION_LABELS[key] || key}</span>
              <MoveButtons onUp={() => moveSection(i, -1)} onDown={() => moveSection(i, 1)} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={`Experience (${resume.experience.length})`}
        action={
          <button
            className={btnPrimary}
            onClick={() =>
              patch({
                experience: [
                  ...resume.experience,
                  { id: uid(), role: "", company: "", location: "", start: "", end: "", current: false, bullets: "" },
                ],
              })
            }
          >
            + Add
          </button>
        }
      >
        {resume.experience.map((e, i) => (
          <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
              <div className="flex items-center gap-2">
                <MoveButtons onUp={() => moveIn("experience", i, -1)} onDown={() => moveIn("experience", i, 1)} />
                <button className={btnDanger} onClick={() => removeFrom("experience", e.id)}>Remove</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="Role" value={e.role} onChange={(ev) => updateList("experience", e.id, { role: ev.target.value })} />
              <Field label="Company" value={e.company} onChange={(ev) => updateList("experience", e.id, { company: ev.target.value })} />
              <Field label="Start" value={e.start} onChange={(ev) => updateList("experience", e.id, { start: ev.target.value })} placeholder="Jun 2023" />
              <Field label="End" value={e.current ? "Present" : e.end} disabled={e.current} onChange={(ev) => updateList("experience", e.id, { end: ev.target.value })} />
            </div>
            <Field label="Location" value={e.location} onChange={(ev) => updateList("experience", e.id, { location: ev.target.value })} />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={e.current} onChange={(ev) => updateList("experience", e.id, { current: ev.target.checked })} />
              Currently working here
            </label>
            <BulletList value={e.bullets} onChange={(v) => updateList("experience", e.id, { bullets: v })} />
          </div>
        ))}
        {resume.experience.length === 0 && <p className="text-xs text-slate-400">No experience yet. Click + Add.</p>}
      </Section>

      <Section
        title={`Education (${resume.education.length})`}
        action={
          <button className={btnPrimary} onClick={() => patch({ education: [...resume.education, { id: uid(), degree: "", school: "", start: "", end: "", details: "" }] })}>+ Add</button>
        }
      >
        {resume.education.map((e, i) => (
          <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
              <div className="flex items-center gap-2">
                <MoveButtons onUp={() => moveIn("education", i, -1)} onDown={() => moveIn("education", i, 1)} />
                <button className={btnDanger} onClick={() => removeFrom("education", e.id)}>Remove</button>
              </div>
            </div>
            <Field label="Degree" value={e.degree} onChange={(ev) => updateList("education", e.id, { degree: ev.target.value })} />
            <Field label="School / University" value={e.school} onChange={(ev) => updateList("education", e.id, { school: ev.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start" value={e.start} onChange={(ev) => updateList("education", e.id, { start: ev.target.value })} />
              <Field label="End" value={e.end} onChange={(ev) => updateList("education", e.id, { end: ev.target.value })} />
            </div>
            <RichArea label="Details (Enter = new line)" rows={3} value={e.details} onChange={(v) => updateList("education", e.id, { details: v })} placeholder={"GPA: 9.75 (96.14%) | Rank #2\nFocused on Full Stack Development (MERN)"} />
          </div>
        ))}
      </Section>

      <Section title={resume.settings?.template === "modern" ? "Skills" : "Skills (one category per line)"}>
        <Area
          label={resume.settings?.template === "modern" ? "Skills — comma = separator" : "Skills — Enter = new section, comma = separator"}
          rows={4}
          value={Array.isArray(resume.skills) ? normalizeSkillsToText(resume.skills) : (resume.skills || "")}
          onChange={(e) => patch({ skills: e.target.value })}
          placeholder={resume.settings?.template === "modern" ? "React, JavaScript, TypeScript, Node.js, Git, REST APIs" : "Frontend Technologies: React, HTML5, CSS3, Tailwind CSS\nBackend Frameworks: Node.js, Express, Mongoose\nDatabase: MongoDB, PostgreSQL"}
        />
      </Section>

      <Section
        title={`Projects (${resume.projects.length})`}
        action={
          <button className={btnPrimary} onClick={() => patch({ projects: [...resume.projects, { id: uid(), name: "", link: "", tech: "", description: "" }] })}>+ Add</button>
        }
      >
        {resume.projects.map((e, i) => (
          <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
              <div className="flex items-center gap-2">
                <MoveButtons onUp={() => moveIn("projects", i, -1)} onDown={() => moveIn("projects", i, 1)} />
                <button className={btnDanger} onClick={() => removeFrom("projects", e.id)}>Remove</button>
              </div>
            </div>
            <Field label="Project name" value={e.name} onChange={(ev) => updateList("projects", e.id, { name: ev.target.value })} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="Link" value={e.link} onChange={(ev) => updateList("projects", e.id, { link: ev.target.value })} />
              <Field label="Tech stack" value={e.tech} onChange={(ev) => updateList("projects", e.id, { tech: ev.target.value })} />
            </div>
            <RichArea label="Description (Enter = new line)" rows={3} value={e.description} onChange={(v) => updateList("projects", e.id, { description: v })} placeholder={"Built X, improving Y by 30%\nReal-time messaging with ..."} />
          </div>
        ))}
      </Section>

      <Section
        title={`Certifications (${resume.certifications.length})`}
        action={
          <button className={btnPrimary} onClick={() => patch({ certifications: [...resume.certifications, { id: uid(), name: "", issuer: "", year: "" }] })}>+ Add</button>
        }
      >
        {resume.certifications.map((e, i) => (
          <div key={e.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
              <div className="flex items-center gap-2">
                <MoveButtons onUp={() => moveIn("certifications", i, -1)} onDown={() => moveIn("certifications", i, 1)} />
                <button className={btnDanger} onClick={() => removeFrom("certifications", e.id)}>Remove</button>
              </div>
            </div>
            <Field label="Name" value={e.name} onChange={(ev) => updateList("certifications", e.id, { name: ev.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Issuer" value={e.issuer} onChange={(ev) => updateList("certifications", e.id, { issuer: ev.target.value })} />
              <Field label="Year" value={e.year} onChange={(ev) => updateList("certifications", e.id, { year: ev.target.value })} />
            </div>
          </div>
        ))}
      </Section>

      <Section
        title={`Custom sections (${resume.customSections.length})`}
        action={
          <button className={btnGhost} onClick={() => patch({ customSections: [...resume.customSections, { id: uid(), title: "New section", content: "" }] })}>+ Add section</button>
        }
      >
        {resume.customSections.map((e, i) => (
          <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
              <div className="flex items-center gap-2">
                <MoveButtons onUp={() => moveIn("customSections", i, -1)} onDown={() => moveIn("customSections", i, 1)} />
                <button className={btnDanger} onClick={() => removeFrom("customSections", e.id)}>Remove</button>
              </div>
            </div>
            <Field label="Section title" value={e.title} onChange={(ev) => updateList("customSections", e.id, { title: ev.target.value })} />
            <RichArea label="Content" rows={3} value={e.content} onChange={(v) => updateList("customSections", e.id, { content: v })} />
          </div>
        ))}
        {resume.customSections.length === 0 && <p className="text-xs text-slate-400">Add Languages, Hobbies, Awards, etc.</p>}
      </Section>
    </div>
  );
}
