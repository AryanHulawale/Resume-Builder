import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { parseResumeText } from "./parseResumeText";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 10;

function joinPageItems(items) {
  // Reconstruct lines: pdf.js items carry hasEOL when a line break follows.
  let line = "";
  const lines = [];
  for (const item of items || []) {
    const s = item?.str ?? "";
    if (!s) {
      if (item?.hasEOL) {
        lines.push(line);
        line = "";
      }
      continue;
    }
    line += (line && !line.endsWith(" ") && !s.startsWith(" ") ? " " : "") + s;
    if (item.hasEOL) {
      lines.push(line);
      line = "";
    }
  }
  if (line.trim()) lines.push(line);
  return lines.join("\n");
}

export async function extractTextFromPdf(file) {
  if (!file) throw new Error("NO_FILE");
  if (file.size > MAX_BYTES) throw new Error("TOO_LARGE");
  if (file.type && file.type !== "application/pdf" && !file.name?.toLowerCase().endsWith(".pdf")) {
    throw new Error("NOT_PDF");
  }

  const buf = await file.arrayBuffer();
  let loadingTask;
  try {
    // NOTE: pdfjs-dist v6 removed PDFDocumentProxy.destroy(). Cleanup must go
    // through the loading task (loadingTask.destroy()), otherwise a sync
    // TypeError is thrown after successful extraction and the text is lost.
    loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
  } catch (e) {
    throw new Error("READ_FAILED: " + (e?.message || String(e)));
  }

  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch (e) {
    const msg = String(e?.message || e || "");
    const name = String(e?.name || "");
    try {
      await loadingTask.destroy();
    } catch {
      /* ignore cleanup errors */
    }
    if (/password/i.test(name + " " + msg)) throw new Error("PASSWORD_PROTECTED");
    if (/invalid|corrupt|trailer|xref/i.test(msg)) throw new Error("INVALID_PDF: " + msg);
    throw new Error("PARSE_FAILED: " + msg);
  }

  try {
    const pageCount = Math.min(pdf.numPages || 0, MAX_PAGES);
    if (!pageCount) throw new Error("NO_TEXT");
    const pages = [];
    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        try {
          const content = await page.getTextContent();
          pages.push(joinPageItems(content.items));
        } finally {
          if (typeof page?.cleanup === "function") {
            try {
              await page.cleanup();
            } catch {
              /* ignore per-page cleanup errors */
            }
          }
        }
      } catch {
        // Skip unreadable pages instead of failing the whole document.
      }
    }
    return pages.join("\n\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  } finally {
    try {
      await loadingTask.destroy();
    } catch {
      /* cleanup must never break extraction */
    }
  }
}

export async function parseResumePdf(file) {
  const text = await extractTextFromPdf(file);
  if (!text || text.replace(/\s/g, "").length < 50) {
    throw new Error("NO_TEXT");
  }
  return parseResumeText(text);
}

// Re-exported so existing imports keep working; prefer importing the
// pure parser from "./parseResumeText" when pdf.js is not needed.
export { hasUsefulData, parseResumeText, summarizeParsed } from "./parseResumeText";
