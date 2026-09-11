import { moveItem, uid } from "../lib/resume";

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
        <Area label="Professional summary" rows={4} value={p.summary} onChange={(e) => patchPersonal("summary", e.target.value)} placeholder="2–4 lines: years, stack, measurable wins..." />
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
            <Area label="Bullets (one per line)" rows={4} value={e.bullets} onChange={(ev) => updateList("experience", e.id, { bullets: ev.target.value })} placeholder={"Built X, improving Y by 30%\nLed ..."} />
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
            <Area label="Details" rows={2} value={e.details} onChange={(ev) => updateList("education", e.id, { details: ev.target.value })} />
          </div>
        ))}
      </Section>

      <Section title="Skills (comma separated)">
        <Area
          label="Skills"
          value={(resume.skills || []).join(", ")}
          onChange={(e) => patch({ skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          placeholder="React, JavaScript, Tailwind..."
        />
        <div className="flex flex-wrap gap-1.5">
          {(resume.skills || []).map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{s}</span>
          ))}
        </div>
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
            <Area label="Description" rows={2} value={e.description} onChange={(ev) => updateList("projects", e.id, { description: ev.target.value })} />
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
              <button className={btnDanger} onClick={() => removeFrom("certifications", e.id)}>Remove</button>
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
            <Area label="Content" rows={3} value={e.content} onChange={(ev) => updateList("customSections", e.id, { content: ev.target.value })} />
          </div>
        ))}
        {resume.customSections.length === 0 && <p className="text-xs text-slate-400">Add Languages, Hobbies, Awards, etc.</p>}
      </Section>
    </div>
  );
}
