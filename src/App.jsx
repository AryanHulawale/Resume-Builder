import { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import Editor from "./components/Editor";
import Preview from "./components/Preview";
import ImportReviewModal from "./components/ImportReviewModal";
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
  const [importingPdf, setImportingPdf] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteBusy, setPasteBusy] = useState(false);
  const [atsOpen, setAtsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewStep, setReviewStep] = useState(0);
  const [reviewSource, setReviewSource] = useState("");
  const fileRef = useRef(null);
  const pdfRef = useRef(null);

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

  const applyParsedResume = (parsed) => {
    setResume((r) => ({ ...structuredClone(defaultResume), ...parsed, settings: r.settings }));
  };

  const pdfErrorMessage = (err) => {
    const raw = String(err?.message || err || "unknown error");
    if (raw === "NO_TEXT" || raw.startsWith("NO_TEXT")) {
      return "No selectable text found in this PDF. It may be a scanned/image PDF — try the \"Paste text\" option instead (open the PDF, Select All, Copy, then paste here).";
    }
    if (raw === "TOO_LARGE") return "PDF is too large (max 10MB).";
    if (raw === "NOT_PDF") return "Please select a valid PDF file.";
    if (raw === "PASSWORD_PROTECTED") return "This PDF is password-protected. Remove the password and try again, or use \"Paste text\".";
    if (raw.startsWith("INVALID_PDF")) return "This PDF looks corrupted and could not be read. Try re-saving it as PDF, or use \"Paste text\".";
    const detail = raw.replace(/^(READ_FAILED|PARSE_FAILED):\s*/, "");
    return `Could not extract data from this PDF (${detail}). Try re-saving it as a text-based PDF, or use the "Paste text" option.`;
  };

  const handleImportPdf = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setImportingPdf(true);
    try {
      const { hasUsefulData, parseResumePdf, summarizeParsed } = await import("./lib/parseResumePdf");
      const parsed = await parseResumePdf(f);
      if (!hasUsefulData(parsed)) {
        alert("The PDF was read, but nothing recognizable (name, email, jobs, skills) was found. Your current data was kept. You can use \"Paste text\" to fill fields manually.");
        return;
      }
      // Open confirm wizard so user cross-checks every section before apply.
      setReviewData(parsed);
      setReviewStep(0);
      setReviewSource(`Imported from PDF: ${summarizeParsed(parsed)}`);
      setReviewOpen(true);
    } catch (err) {
      console.error(err);
      alert(pdfErrorMessage(err));
    } finally {
      setImportingPdf(false);
    }
  };

  const handleReviewSubmit = () => {
    if (!reviewData) return;
    applyParsedResume(reviewData);
    setReviewOpen(false);
    setReviewData(null);
    setReviewStep(0);
  };

  const handlePasteImport = async () => {
    if (!pasteText.trim()) {
      alert("Paste your resume text first (open the PDF, Select All, Copy, then paste here).");
      return;
    }
    setPasteBusy(true);
    try {
      // Pure text parser only — no PDF library involved.
      const { hasUsefulData, parseResumeText, summarizeParsed } = await import("./lib/parseResumeText");
      const parsed = parseResumeText(pasteText);
      if (!hasUsefulData(parsed)) {
        alert("Nothing recognizable (name, email, jobs, skills) was found in the pasted text. Your current data was kept.");
        return;
      }
      setPasteText("");
      setPasteOpen(false);
      setReviewData(parsed);
      setReviewStep(0);
      setReviewSource(`Imported from pasted text: ${summarizeParsed(parsed)}`);
      setReviewOpen(true);
    } catch (err) {
      console.error(err);
      alert("Could not parse the pasted text. Try pasting plain text with clear section headers (Experience, Education, Skills, ...).");
    } finally {
      setPasteBusy(false);
    }
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
              <div className="text-sm font-extrabold leading-none">Rumevo</div>
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
              onClick={() => pdfRef.current?.click()}
              disabled={importingPdf}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              title="Extract data from an existing resume PDF and autofill the editor"
            >
              {importingPdf ? "Reading PDF…" : "Import PDF"}
            </button>
            <button
              onClick={() => setPasteOpen(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              title="Paste resume text (from any PDF) and autofill the editor — works even for scanned PDFs"
            >
              Paste text
            </button>
            <button
              onClick={() => { if (confirm("Reset to sample resume?")) setResume(structuredClone(defaultResume)); }}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              Reset
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
            <input ref={pdfRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleImportPdf} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="print-full mx-auto grid max-w-[1500px] grid-cols-1 items-start gap-5 px-4 py-5 lg:grid-cols-[560px_1fr]">
        {/* Left: editor + ATS — capped to viewport with its own scroll so the
            page ends when the resume (right) ends */}
        <div className="no-print space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pb-2 lg:pr-1 slim-scroll">
          {/* ATS card — collapsed by default, dropdown reveals checks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              onClick={() => setAtsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left"
              aria-expanded={atsOpen}
            >
              <h3 className="text-sm font-extrabold">ATS Score — {ats.score}/100</h3>
              <span className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">{ats.passed}/{ats.total} checks</span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600 transition-transform ${atsOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </span>
            </button>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all ${scoreColor}`} style={{ width: `${ats.score}%` }} />
            </div>
            {atsOpen && (
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
            )}
            {!atsOpen && (
              <p className="mt-1.5 text-[11px] text-slate-400">Click ▾ to view detailed checks & suggestions</p>
            )}
          </div>

          <div>
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

      {/* Paste-text fallback modal (works even for scanned PDFs) */}
      {pasteOpen && (
        <div className="no-print fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-extrabold">Paste resume text</h3>
            <p className="mt-1 text-xs text-slate-500">
              Open your PDF, press Ctrl+A / Cmd+A, Copy, then paste below. Section headers like
              Experience, Education, Skills, Projects help the parser. Current data is only replaced after you confirm.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={12}
              placeholder={"Aarav Sharma\nFrontend Developer\naarav.sharma@email.com | +91 98765 43210\n...\nEXPERIENCE\n..."}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setPasteOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteImport}
                disabled={pasteBusy}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {pasteBusy ? "Parsing…" : "Parse & Review →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import review / confirm wizard */}
      {reviewOpen && reviewData && (
        <ImportReviewModal
          data={reviewData}
          setData={setReviewData}
          step={reviewStep}
          setStep={setReviewStep}
          sourceLabel={reviewSource}
          onClose={() => { setReviewOpen(false); setReviewData(null); setReviewStep(0); }}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
