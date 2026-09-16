import { getFlatSkills, getSkillLines, parseBullets } from "../lib/resume";
import { parseRich } from "../lib/richtext";

// ---------- clickable links ----------
// Display text stays exactly as typed; href is normalized so
// "linkedin.com/in/x" becomes "https://linkedin.com/in/x".
function hrefForUrl(u) {
  const t = String(u || "").trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return t;
  return `https://${t}`;
}

function splitTrailingPunct(u) {
  const m = String(u).match(/^(.*?)[.,;:!?)\]}'"]+$/);
  if (m && m[1].length > 8) return { url: m[1], tail: String(u).slice(m[1].length) };
  return { url: String(u), tail: "" };
}

// Plain text with http(s)/www URLs rendered as clickable links.
function AutoLinks({ text, linkClassName }) {
  const parts = String(text ?? "").split(/((?:https?:\/\/|www\.)[^\s]+)/g);
  if (parts.length <= 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0 || !part) return <span key={i}>{part}</span>;
        const { url, tail } = splitTrailingPunct(part);
        return (
          <span key={i}>
            <a
              href={hrefForUrl(url)}
              target="_blank"
              rel="noreferrer"
              className={linkClassName || "underline decoration-slate-300 underline-offset-2 hover:text-blue-700"}
            >
              {url}
            </a>
            {tail}
          </span>
        );
      })}
    </>
  );
}

// Renders **bold**, *italic*, __underline__ stored by the editor toolbars.
// Plain text (no markers) renders exactly as before.
function RichText({ text }) {
  const segs = parseRich(text);
  return (
    <>
      {segs.map((s, i) =>
        s.b ? (
          <strong key={i} className="font-bold">{s.t}</strong>
        ) : s.i ? (
          <em key={i}>{s.t}</em>
        ) : s.u ? (
          <u key={i}>{s.t}</u>
        ) : (
          <span key={i}><AutoLinks text={s.t} /></span>
        )
      )}
    </>
  );
}

function Bullets({ text }) {
  const items = parseBullets(text);
  if (!items.length) return null;
  return (
    <ul className="mt-1 space-y-1 text-[13px] leading-relaxed text-slate-700">
      {items.map((b, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
          <span><RichText text={b} /></span>
        </li>
      ))}
    </ul>
  );
}

function dotJoin(nodes) {
  const out = [];
  nodes.forEach((n, i) => {
    if (i > 0) out.push(<span key={`dot-${i}`}>{"  •  "}</span>);
    out.push(n);
  });
  return out;
}

function ContactLine({ p, light }) {
  const aCls = light
    ? "underline decoration-white/50 underline-offset-2 hover:opacity-80"
    : "underline decoration-slate-300 underline-offset-2 hover:text-blue-700";
  const row1 = [];
  if (p.email) {
    row1.push(
      <a key="email" href={`mailto:${String(p.email).trim()}`} className={aCls}>
        {p.email}
      </a>
    );
  }
  if (p.phone) {
    row1.push(
      <a key="phone" href={`tel:${String(p.phone).replace(/[^\d+]/g, "")}`} className={aCls}>
        {p.phone}
      </a>
    );
  }
  if (p.location) row1.push(<span key="loc">{p.location}</span>);
  const row2 = [];
  if (p.linkedin) {
    row2.push(
      <a key="li" href={hrefForUrl(p.linkedin)} target="_blank" rel="noreferrer" className={aCls}>
        {p.linkedin}
      </a>
    );
  }
  if (p.github) {
    row2.push(
      <a key="gh" href={hrefForUrl(p.github)} target="_blank" rel="noreferrer" className={aCls}>
        {p.github}
      </a>
    );
  }
  if (p.website) {
    row2.push(
      <a key="web" href={hrefForUrl(p.website)} target="_blank" rel="noreferrer" className={aCls}>
        {p.website}
      </a>
    );
  }
  if (!row1.length && !row2.length) return null;
  return (
    <div className={light ? "text-[12.5px] text-white" : "text-[12.5px] text-slate-600"}>
      {row1.length > 0 && <div>{dotJoin(row1)}</div>}
      {row2.length > 0 && <div className="mt-0.5 break-words">{dotJoin(row2)}</div>}
    </div>
  );
}

function ProjLink({ url }) {
  const clean = String(url || "").trim();
  if (!clean) return null;
  return (
    <a
      href={hrefForUrl(clean)}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-slate-300 underline-offset-2 hover:text-blue-700 break-all"
    >
      {clean}
    </a>
  );
}

// Section-wise skill line: "Label: a, b, c" -> bold label + items.
// `separator` is " • " for Classic, ", " for Minimal.
function SkillLine({ line, separator = " • " }) {
  const idx = line.indexOf(":");
  if (idx === -1) {
    const items = line.split(",").map((s) => s.trim()).filter(Boolean);
    return <div>{items.join(separator) || line}</div>;
  }
  const label = line.slice(0, idx + 1).trim();
  const rest = line.slice(idx + 1).trim();
  const items = rest.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div>
      <span className="font-semibold text-slate-900">{label} </span>
      {items.join(separator)}
    </div>
  );
}

function Modern({ r }) {
  const p = r.personal;
  const accent = r.settings.accent;
  const flatSkills = getFlatSkills(r.skills);
  return (
    <div className="resume-paper">
      <div className="rounded-t-lg p-7 text-white" style={{ background: accent }}>
        <h1 className="text-3xl font-extrabold tracking-tight">{p.fullName || "Your Name"}</h1>
        <p className="mt-1 text-sm font-medium opacity-90">{p.title}</p>
        <div className="mt-3 opacity-90">
          <ContactLine p={p} light />
        </div>
      </div>
      <div className="space-y-5 p-7">
        {p.summary && (
          <section>
            <h2 className="mb-1 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>Summary</h2>
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-slate-700"><RichText text={p.summary} /></p>
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
                {pr.link && <div className="text-[11.5px] text-slate-500"><ProjLink url={pr.link} /></div>}
                {pr.description && <p className="text-[13px] whitespace-pre-line text-slate-700"><RichText text={pr.description} /></p>}
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
                  {e.details && <p className="text-[12.5px] whitespace-pre-line text-slate-600"><RichText text={e.details} /></p>}
                </div>
              ))}
            </section>
          )}
          <section>
            {flatSkills.length > 0 && (
              <>
                <h2 className="mb-2 text-xs font-extrabold tracking-widest uppercase" style={{ color: accent }}>Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {flatSkills.map((s) => (
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
            <p className="text-[13px] whitespace-pre-wrap text-slate-700"><RichText text={s.content} /></p>
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
            <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-line text-slate-700"><RichText text={p.summary} /></p>
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
              <div key={e.id} className="mt-1 text-[13px]"><span className="font-bold text-slate-900">{e.degree}</span><span className="text-slate-600"> — {e.school} ({e.start}–{e.end})</span>{e.details && <div className="whitespace-pre-line text-slate-600"><RichText text={e.details} /></div>}</div>
            ))}
          </section>
        )}
        {getSkillLines(r.skills).length > 0 && (
          <section>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">Skills</h2>
            <div className="mt-1 space-y-0.5 text-[13px] text-slate-700">
              {getSkillLines(r.skills).map((line, i) => (
                <SkillLine key={i} line={line} separator=" • " />
              ))}
            </div>
          </section>
        )}
        {r.projects.length > 0 && (
          <section>
            <h2 className="border-b border-slate-300 pb-1 text-[13px] font-bold tracking-widest text-slate-900 uppercase">Projects</h2>
            {r.projects.map((pr) => (
              <div key={pr.id} className="mt-1 text-[13px]"><span className="font-bold">{pr.name}</span>{pr.tech && <span className="text-slate-500"> ({pr.tech})</span>}{pr.link && <div className="text-slate-500"><ProjLink url={pr.link} /></div>}{pr.description && <div className="whitespace-pre-line text-slate-700"><RichText text={pr.description} /></div>}</div>
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
            <p className="mt-1 text-[13px] whitespace-pre-wrap text-slate-700"><RichText text={s.content} /></p>
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
      {p.summary && <p className="mt-4 border-l-2 pl-3 text-[13px] leading-relaxed whitespace-pre-line text-slate-600 italic" style={{ borderColor: accent }}><RichText text={p.summary} /></p>}
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
          {getSkillLines(r.skills).length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Skills</h2>
              <div className="mt-1 space-y-0.5 text-[13px] text-slate-700">
                {getSkillLines(r.skills).map((line, i) => (
                  <SkillLine key={i} line={line} separator=", " />
                ))}
              </div>
            </section>
          )}
          {r.education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Education</h2>
              {r.education.map((e) => (
                <div key={e.id} className="mt-1 text-[13px] text-slate-700"><span className="font-semibold text-slate-900">{e.school}</span> — {e.degree} ({e.start}–{e.end}){e.details && <div className="whitespace-pre-line text-slate-600"><RichText text={e.details} /></div>}</div>
              ))}
            </section>
          )}
          {r.projects.length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Projects</h2>
              {r.projects.map((pr) => (
                <div key={pr.id} className="mt-1 text-[13px] text-slate-700"><span className="font-semibold text-slate-900">{pr.name}</span>{pr.tech && ` · ${pr.tech}`}{pr.link && <div className="break-words"><ProjLink url={pr.link} /></div>}{pr.description && <div className="whitespace-pre-line"><RichText text={pr.description} /></div>}</div>
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
              <p className="mt-1 text-[13px] whitespace-pre-wrap text-slate-700"><RichText text={s.content} /></p>
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
