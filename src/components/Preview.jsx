function Bullets({ text }) {
  const items = (text || "").split("\n").map((s) => s.trim()).filter(Boolean);
  if (!items.length) return null;
  return (
    <ul className="mt-1 space-y-1 text-[13px] leading-relaxed text-slate-700">
      {items.map((b, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactLine({ p }) {
  const parts = [p.email, p.phone, p.location].filter(Boolean);
  const links = [p.linkedin, p.github, p.website].filter(Boolean);
  return (
    <div className="text-[12.5px] text-slate-600">
      <div>{parts.join("  •  ")}</div>
      {links.length > 0 && <div className="mt-0.5 break-words">{links.join("  •  ")}</div>}
    </div>
  );
}

function Modern({ r }) {
  const p = r.personal;
  const accent = r.settings.accent;
  return (
    <div className="resume-paper">
      <div className="rounded-t-lg p-7 text-white" style={{ background: accent }}>
        <h1 className="text-3xl font-extrabold tracking-tight">{p.fullName || "Your Name"}</h1>
        <p className="mt-1 text-sm font-medium opacity-90">{p.title}</p>
        <div className="mt-3 text-[12.5px] opacity-90">
          {[p.email, p.phone, p.location].filter(Boolean).join("  •  ")}
        </div>
        <div className="mt-1 text-[12.5px] opacity-90 break-words">
          {[p.linkedin, p.github, p.website].filter(Boolean).join("  •  ")}
        </div>
      </div>
      <div className="space-y-5 p-7">
        {p.summary && (
          <section>
            <h2 className="mb-1 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>Summary</h2>
            <p className="text-[13px] leading-relaxed text-slate-700">{p.summary}</p>
          </section>
        )}
        {r.experience.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>Experience</h2>
            <div className="space-y-3">
              {r.experience.map((e) => (
                <div key={e.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[14px] font-bold text-slate-900">{e.role || "Role"} {e.company && <span className="font-medium text-slate-500">@ {e.company}</span>}</div>
                    <div className="shrink-0 text-[11.5px] text-slate-500">{e.start} – {e.current ? "Present" : e.end}</div>
                  </div>
                  {e.location && <div className="text-[11.5px] text-slate-500">{e.location}</div>}
                  <Bullets text={e.bullets} />
                </div>
              ))}
            </div>
          </section>
        )}
        {r.projects.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>Projects</h2>
            {r.projects.map((pr) => (
              <div key={pr.id} className="mb-2">
                <div className="text-[13.5px] font-bold text-slate-900">{pr.name} {pr.tech && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{pr.tech}</span>}</div>
                {pr.link && <div className="text-[11.5px] text-slate-500">{pr.link}</div>}
                {pr.description && <p className="text-[13px] text-slate-700">{pr.description}</p>}
              </div>
            ))}
          </section>
        )}
        <div className="grid grid-cols-2 gap-5">
          {r.education.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>Education</h2>
              {r.education.map((e) => (
                <div key={e.id} className="mb-2">
                  <div className="text-[13px] font-bold text-slate-900">{e.degree}</div>
                  <div className="text-[12.5px] text-slate-600">{e.school}</div>
                  <div className="text-[11.5px] text-slate-500">{e.start} – {e.end}</div>
                  {e.details && <p className="text-[12.5px] text-slate-600">{e.details}</p>}
                </div>
              ))}
            </section>
          )}
          <section>
            {r.skills.length > 0 && (
              <>
                <h2 className="mb-2 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {r.skills.map((s) => (
                    <span key={s} className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-white" style={{ background: accent }}>{s}</span>
                  ))}
                </div>
              </>
            )}
            {r.certifications.length > 0 && (
              <>
                <h2 className="mt-3 mb-1 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>Certifications</h2>
                {r.certifications.map((c) => (
                  <div key={c.id} className="text-[12.5px] text-slate-700">• {c.name} {c.issuer && <span className="text-slate-500">— {c.issuer}</span>} {c.year && <span className="text-slate-500">({c.year})</span>}</div>
                ))}
              </>
            )}
          </section>
        </div>
        {r.customSections.map((s) => (
          <section key={s.id}>
            <h2 className="mb-1 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>{s.title}</h2>
            <p className="text-[13px] whitespace-pre-wrap text-slate-700">{s.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function Classic({ r }) {
  const p = r.personal;
  return (
    <div className="resume-paper p-8">
      <div className="border-b-2 border-slate-900 pb-3 text-center">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-slate-900">{p.fullName || "Your Name"}</h1>
        {p.title && <p className="text-[13px] font-semibold text-slate-600">{p.title}</p>}
        <div className="mt-2"><ContactLine p={p} /></div>
      </div>
      <div className="mt-4 space-y-4">
        {p.summary && (
          <section>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">Professional Summary</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{p.summary}</p>
          </section>
        )}
        {r.experience.length > 0 && (
          <section>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">Work Experience</h2>
            {r.experience.map((e) => (
              <div key={e.id} className="mt-2">
                <div className="flex justify-between text-[13.5px] font-bold text-slate-900"><span>{e.role}{e.company && `, ${e.company}`}</span><span className="font-medium text-slate-500">{e.start} – {e.current ? "Present" : e.end}</span></div>
                {e.location && <div className="text-[12px] text-slate-500 italic">{e.location}</div>}
                <Bullets text={e.bullets} />
              </div>
            ))}
          </section>
        )}
        {r.education.length > 0 && (
          <section>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">Education</h2>
            {r.education.map((e) => (
              <div key={e.id} className="mt-1 text-[13px]"><span className="font-bold text-slate-900">{e.degree}</span><span className="text-slate-600"> — {e.school} ({e.start}–{e.end})</span>{e.details && <div className="text-slate-600">{e.details}</div>}</div>
            ))}
          </section>
        )}
        {r.skills.length > 0 && (
          <section>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">Skills</h2>
            <p className="mt-1 text-[13px] text-slate-700">{r.skills.join(" • ")}</p>
          </section>
        )}
        {r.projects.length > 0 && (
          <section>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">Projects</h2>
            {r.projects.map((pr) => (
              <div key={pr.id} className="mt-1 text-[13px]"><span className="font-bold">{pr.name}</span>{pr.tech && <span className="text-slate-500"> ({pr.tech})</span>}{pr.link && <div className="text-slate-500">{pr.link}</div>}{pr.description && <div className="text-slate-700">{pr.description}</div>}</div>
            ))}
          </section>
        )}
        {r.certifications.length > 0 && (
          <section>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">Certifications</h2>
            {r.certifications.map((c) => (
              <div key={c.id} className="text-[13px] text-slate-700">• {c.name} — {c.issuer} ({c.year})</div>
            ))}
          </section>
        )}
        {r.customSections.map((s) => (
          <section key={s.id}>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">{s.title}</h2>
            <p className="mt-1 text-[13px] whitespace-pre-wrap text-slate-700">{s.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function Minimal({ r }) {
  const p = r.personal;
  const accent = r.settings.accent;
  return (
    <div className="resume-paper p-8">
      <h1 className="text-3xl font-light tracking-tight text-slate-900">{p.fullName || "Your Name"}</h1>
      {p.title && <p className="mt-0.5 text-sm font-medium" style={{ color: accent }}>{p.title}</p>}
      <div className="mt-2"><ContactLine p={p} /></div>
      {p.summary && <p className="mt-4 border-l-2 pl-3 text-[13px] leading-relaxed text-slate-600 italic" style={{ borderColor: accent }}>{p.summary}</p>}
      <div className="mt-5 space-y-4">
        {r.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Experience</h2>
            {r.experience.map((e) => (
              <div key={e.id} className="mt-2">
                <div className="text-[14px] font-semibold text-slate-900">{e.role} <span className="font-normal text-slate-500">· {e.company}</span></div>
                <div className="text-[11.5px] text-slate-400">{e.start} – {e.current ? "Present" : e.end}{e.location && ` · ${e.location}`}</div>
                <Bullets text={e.bullets} />
              </div>
            ))}
          </section>
        )}
        <div className="grid grid-cols-1 gap-4">
          {r.skills.length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Skills</h2>
              <p className="mt-1 text-[13px] text-slate-700">{r.skills.join(",  ")}</p>
            </section>
          )}
          {r.education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Education</h2>
              {r.education.map((e) => (
                <div key={e.id} className="mt-1 text-[13px] text-slate-700"><span className="font-semibold text-slate-900">{e.school}</span> — {e.degree} ({e.start}–{e.end})</div>
              ))}
            </section>
          )}
          {r.projects.length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Projects</h2>
              {r.projects.map((pr) => (
                <div key={pr.id} className="mt-1 text-[13px] text-slate-700"><span className="font-semibold text-slate-900">{pr.name}</span>{pr.tech && ` · ${pr.tech}`}{pr.description && <div>{pr.description}</div>}</div>
              ))}
            </section>
          )}
          {r.certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Certifications</h2>
              {r.certifications.map((c) => (
                <div key={c.id} className="text-[13px] text-slate-700">{c.name} — {c.issuer} ({c.year})</div>
              ))}
            </section>
          )}
          {r.customSections.map((s) => (
            <section key={s.id}>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">{s.title}</h2>
              <p className="mt-1 text-[13px] whitespace-pre-wrap text-slate-700">{s.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Preview({ resume }) {
  const fontScale = resume.settings.fontSize === "small" ? "0.94" : resume.settings.fontSize === "large" ? "1.06" : "1";
  return (
    <div id="resume-preview-paper" className="overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200" style={{ fontSize: `calc(16px * ${fontScale})` }}>
      {resume.settings.template === "classic" ? (
        <Classic r={resume} />
      ) : resume.settings.template === "minimal" ? (
        <Minimal r={resume} />
      ) : (
        <Modern r={resume} />
      )}
    </div>
  );
}
