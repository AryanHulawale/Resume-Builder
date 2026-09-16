import { getFlatSkills, getSkillLines, normalizeSkillsToText, parseBullets } from "../lib/resume";
import { BulletList, RichArea } from "./Editor";

function MiniField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-slate-900 uppercase">{label}</span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:font-medium placeholder:text-slate-400"
      />
    </label>
  );
}

function MiniArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-slate-900 uppercase">{label}</span>
      <textarea
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:font-medium placeholder:text-slate-400"
      />
    </label>
  );
}

const STEPS = [
  { id: "personal", label: "Personal" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "certs", label: "Certifications" },
  { id: "done", label: "Review" },
];

export default function ImportReviewModal({ data, setData, step, setStep, onClose, onSubmit, sourceLabel }) {
  if (!data) return null;
  const last = STEPS.length - 1;
  const patchPersonal = (k, v) => setData((d) => ({ ...d, personal: { ...d.personal, [k]: v } }));
  const patchList = (key, id, values) =>
    setData((d) => ({ ...d, [key]: (d[key] || []).map((it) => (it.id === id ? { ...it, ...values } : it)) }));

  const p = data.personal || {};
  const current = STEPS[step]?.id;

  const counts = {
    personal: 1,
    experience: (data.experience || []).length,
    education: (data.education || []).length,
    skills: getFlatSkills(data.skills).length,
    projects: (data.projects || []).length,
    certs: (data.certifications || []).length,
  };

  return (
    <div className="no-print fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Confirm imported details</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {sourceLabel || "Imported from PDF"} — cross-check each section, then Submit. Step {step + 1} of {STEPS.length}:{" "}
                <span className="font-bold text-slate-700">{STEPS[step]?.label}</span>
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50">
              ✕
            </button>
          </div>
          {/* Stepper */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  i === step ? "bg-blue-600 text-white" : i < step ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="slim-scroll flex-1 overflow-y-auto px-5 py-4">
          {current === "personal" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniField label="Full name" value={p.fullName} onChange={(v) => patchPersonal("fullName", v)} placeholder="Aarav Sharma" />
                <MiniField label="Job title" value={p.title} onChange={(v) => patchPersonal("title", v)} placeholder="Frontend Developer" />
                <MiniField label="Email" value={p.email} onChange={(v) => patchPersonal("email", v)} placeholder="you@email.com" />
                <MiniField label="Phone" value={p.phone} onChange={(v) => patchPersonal("phone", v)} placeholder="+91 ..." />
                <MiniField label="Location" value={p.location} onChange={(v) => patchPersonal("location", v)} placeholder="City, Country" />
                <MiniField label="LinkedIn" value={p.linkedin} onChange={(v) => patchPersonal("linkedin", v)} placeholder="linkedin.com/in/..." />
                <MiniField label="GitHub" value={p.github} onChange={(v) => patchPersonal("github", v)} placeholder="github.com/..." />
                <MiniField label="Website" value={p.website} onChange={(v) => patchPersonal("website", v)} placeholder="your-site.dev" />
              </div>
              <RichArea label="Professional summary" rows={4} value={p.summary} onChange={(v) => patchPersonal("summary", v)} placeholder="2–4 lines: years, stack, measurable wins..." />
            </div>
          )}

          {current === "experience" && (
            <div className="space-y-3">
              {(data.experience || []).length === 0 && <p className="text-sm text-slate-400">No experience found in PDF. You can add it later in the editor.</p>}
              {(data.experience || []).map((e, i) => (
                <div key={e.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="text-xs font-extrabold text-slate-500">JOB #{i + 1}</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <MiniField label="Role" value={e.role} onChange={(v) => patchList("experience", e.id, { role: v })} />
                    <MiniField label="Company" value={e.company} onChange={(v) => patchList("experience", e.id, { company: v })} />
                    <MiniField label="Start" value={e.start} onChange={(v) => patchList("experience", e.id, { start: v })} />
                    <MiniField label="End" value={e.end} onChange={(v) => patchList("experience", e.id, { end: v })} />
                  </div>
                  <BulletList value={e.bullets} onChange={(v) => patchList("experience", e.id, { bullets: v })} />
                  <p className="text-[11px] text-slate-400">{parseBullets(e.bullets).length} point(s) — one box = one • in preview.</p>
                </div>
              ))}
            </div>
          )}

          {current === "education" && (
            <div className="space-y-3">
              {(data.education || []).length === 0 && <p className="text-sm text-slate-400">No education found in PDF.</p>}
              {(data.education || []).map((e, i) => (
                <div key={e.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="text-xs font-extrabold text-slate-500">EDUCATION #{i + 1}</div>
                  <MiniField label="Degree" value={e.degree} onChange={(v) => patchList("education", e.id, { degree: v })} />
                  <MiniField label="School" value={e.school} onChange={(v) => patchList("education", e.id, { school: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <MiniField label="Start" value={e.start} onChange={(v) => patchList("education", e.id, { start: v })} />
                    <MiniField label="End" value={e.end} onChange={(v) => patchList("education", e.id, { end: v })} />
                  </div>
                  <RichArea label="Details (Enter = new line)" rows={3} value={e.details} onChange={(v) => patchList("education", e.id, { details: v })} placeholder={"GPA: 9.75\nFocused on ..."} />
                </div>
              ))}
            </div>
          )}

          {current === "skills" && (
            <div className="space-y-3">
              <MiniArea
                label="Skills — Enter = new section, comma = separator"
                rows={5}
                value={normalizeSkillsToText(data.skills)}
                onChange={(v) => setData((d) => ({ ...d, skills: v }))}
                placeholder={"Frontend Technologies: React, HTML5, CSS3\nBackend: Node.js, Express"}
              />
              <p className="text-[11px] text-slate-400">Each line = one category (Classic/Minimal). Commas separate skills inside a line. Modern shows flat comma-separated pills.</p>
              <div className="space-y-1.5">
                {getSkillLines(data.skills).map((line, i) => (
                  <div key={`${line}-${i}`} className="text-xs text-slate-600"><span className="font-bold">{line.split(":")[0]}{line.includes(":") ? ":" : ""}</span> {(line.includes(":") ? line.slice(line.indexOf(":") + 1) : line).trim()}</div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {getFlatSkills(data.skills).map((s, i) => (
                  <span key={`${s}-${i}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{s}</span>
                ))}
              </div>
            </div>
          )}

          {current === "projects" && (
            <div className="space-y-3">
              {(data.projects || []).length === 0 && <p className="text-sm text-slate-400">No projects found in PDF.</p>}
              {(data.projects || []).map((e, i) => (
                <div key={e.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="text-xs font-extrabold text-slate-500">PROJECT #{i + 1}</div>
                  <MiniField label="Project name" value={e.name} onChange={(v) => patchList("projects", e.id, { name: v })} placeholder="My Awesome Project" />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <MiniField label="Link" value={e.link} onChange={(v) => patchList("projects", e.id, { link: v })} />
                    <MiniField label="Tech stack" value={e.tech} onChange={(v) => patchList("projects", e.id, { tech: v })} />
                  </div>
                  <RichArea label="Description" rows={2} value={e.description} onChange={(v) => patchList("projects", e.id, { description: v })} />
                </div>
              ))}
            </div>
          )}

          {current === "certs" && (
            <div className="space-y-3">
              {(data.certifications || []).length === 0 && <p className="text-sm text-slate-400">No certifications found in PDF.</p>}
              {(data.certifications || []).map((e, i) => (
                <div key={e.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="text-xs font-extrabold text-slate-500">CERTIFICATION #{i + 1}</div>
                  <MiniField label="Name" value={e.name} onChange={(v) => patchList("certifications", e.id, { name: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <MiniField label="Issuer" value={e.issuer} onChange={(v) => patchList("certifications", e.id, { issuer: v })} />
                    <MiniField label="Year" value={e.year} onChange={(v) => patchList("certifications", e.id, { year: v })} />
                  </div>
                </div>
              ))}
              {(data.customSections || []).length > 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-3">
                  <div className="text-xs font-extrabold text-slate-500">EXTRA SECTIONS FOUND: {(data.customSections || []).length}</div>
                  {(data.customSections || []).map((c) => (
                    <div key={c.id} className="mt-1 text-xs text-slate-600"><span className="font-bold">{c.title}:</span> {(c.content || "").slice(0, 120)}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {current === "done" && (
            <div className="space-y-2 text-sm text-slate-700">
              <p className="font-bold">Ready to apply?</p>
              <ul className="list-disc pl-5 text-[13px] text-slate-600">
                <li>Name: <b>{p.fullName || "—"}</b> · Email: <b>{p.email || "—"}</b> · Phone: <b>{p.phone || "—"}</b></li>
                <li>Experience: <b>{counts.experience}</b> · Education: <b>{counts.education}</b> · Skills: <b>{counts.skills}</b></li>
                <li>Projects: <b>{counts.projects}</b> · Certifications: <b>{counts.certs}</b></li>
              </ul>
              <p className="text-xs text-amber-600">Submitting will overwrite current editor fields with these verified details.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              ← Back
            </button>
            {step < last ? (
              <button
                onClick={() => setStep((s) => Math.min(last, s + 1))}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onSubmit}
                className="rounded-lg bg-green-600 px-5 py-2 text-xs font-bold text-white hover:bg-green-700"
              >
                Submit ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
