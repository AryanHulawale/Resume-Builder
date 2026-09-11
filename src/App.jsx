import { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import Editor from "./components/Editor";
import Preview from "./components/Preview";
import { computeATS, defaultResume, loadResume, saveResume } from "./lib/resume";

const TEMPLATES = [
  { id: "modern", name: "Modern" },
  { id: "classic", name: "Classic" },
  { id: "minimal", name: "Minimal" },
];

const ACCENTS = ["#2563eb", "#0d9488", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0f172a"];

export default function App() {
  const [resume, setResume] = useState(() => loadResume());
  const [savedAt, setSavedAt] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    saveResume(resume);
    setSavedAt(new Date().toLocaleTimeString());
  }, [resume]);

  const ats = useMemo(() => computeATS(resume), [resume]);

  const setSetting = (k, v) =>
    setResume((r) => ({ ...r, settings: { ...r.settings, [k]: v } }));

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resume.personal.fullName || "resume").replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setResume({ ...structuredClone(defaultResume), ...parsed });
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const scoreColor = ats.score >= 80 ? "bg-green-500" : ats.score >= 55 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="min-h-screen text-slate-900">
      <Analytics />
      {/* Header */}
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">R</div>
            <div>
              <div className="text-sm font-extrabold leading-none">Resume Builder</div>
              <div className="text-[11px] text-slate-500">Autosaved {savedAt ? `· ${savedAt}` : ""} · localStorage</div>
            </div>
          </div>

          <div className="ml-2 flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSetting("template", t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${resume.settings.template === t.id ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => setSetting("accent", c)}
                className={`h-6 w-6 rounded-full ring-2 ring-offset-1 ${resume.settings.accent === c ? "ring-slate-900" : "ring-transparent"}`}
                style={{ background: c }}
                title={c}
              />
            ))}
            <select
              value={resume.settings.fontSize}
              onChange={(e) => setSetting("fontSize", e.target.value)}
              className="ml-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={() => window.print()} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">⬇ Print / PDF</button>
            <button onClick={handleExport} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Export JSON</button>
            <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Import</button>
            <button
              onClick={() => { if (confirm("Reset to sample resume?")) setResume(structuredClone(defaultResume)); }}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              Reset
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="print-full mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[480px_1fr]">
        {/* Left: editor + ATS */}
        <div className="no-print space-y-4">
          {/* ATS card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">ATS Score — {ats.score}/100</h3>
              <span className="text-[11px] font-semibold text-slate-500">{ats.passed}/{ats.total} checks</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all ${scoreColor}`} style={{ width: `${ats.score}%` }} />
            </div>
            <ul className="mt-3 space-y-1.5">
              {ats.checks.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${c.pass ? "bg-green-500" : "bg-slate-300"}`}>
                    {c.pass ? "✓" : "!"}
                  </span>
                  <span className={c.pass ? "text-slate-700" : "text-slate-500"}>
                    <span className="font-semibold">{c.label}</span>
                    {!c.pass && <span className="block text-slate-400">{c.tip}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="slim-scroll lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-1">
            <Editor resume={resume} setResume={setResume} />
          </div>
        </div>

        {/* Right: preview */}
        <div className="print-full">
          <div className="no-print mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>Live preview · {resume.settings.template} template</span>
            <span>Tip: Print → Save as PDF · margins: Default</span>
          </div>
          <div className="print-full mx-auto max-w-[820px]">
            <Preview resume={resume} />
          </div>
        </div>
      </main>
    </div>
  );
}
