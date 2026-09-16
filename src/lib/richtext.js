// Markdown-lite formatting for resume text areas:
//   **bold**, *italic*, __underline__, CAPS stored as plain UPPER text.
// Stored as plain strings (JSON-safe, no migration needed). Preview renders
// them via parseRich(); ATS checks strip them via stripFormatting().

export function toggleMark(value, start, end, mark) {
  const v = String(value ?? "");
  const s = Math.max(0, start ?? v.length);
  const e = Math.max(s, end ?? v.length);
  const mLen = mark.length;
  if (s === e) {
    // Collapsed cursor: insert an empty pair and put the cursor in the middle.
    const pair = mark + mark;
    return {
      value: v.slice(0, s) + pair + v.slice(e),
      sel: [s + mLen, s + mLen],
    };
  }
  const before = v.slice(Math.max(0, s - mLen), s);
  const after = v.slice(e, e + mLen);
  if (before === mark && after === mark) {
    // Already formatted: toggle off (unwrap).
    return {
      value: v.slice(0, s - mLen) + v.slice(s, e) + v.slice(e + mLen),
      sel: [s - mLen, e - mLen],
    };
  }
  return {
    value: v.slice(0, s) + mark + v.slice(s, e) + mark + v.slice(e),
    sel: [s + mLen, e + mLen],
  };
}

export function upperSelection(value, start, end) {
  const v = String(value ?? "");
  const s = Math.max(0, start ?? v.length);
  const e = Math.max(s, end ?? v.length);
  if (s === e) return { value: v, sel: [s, e] };
  return {
    value: v.slice(0, s) + v.slice(s, e).toUpperCase() + v.slice(e),
    sel: [s, e],
  };
}

export function clearMarks(value, start, end) {
  const v = String(value ?? "");
  const s = Math.max(0, start ?? v.length);
  const e = Math.max(s, end ?? v.length);
  if (s === e) return { value: v, sel: [s, e] };
  return {
    value: v.slice(0, s) + stripFormatting(v.slice(s, e)) + v.slice(e),
    sel: [s, s + stripFormatting(v.slice(s, e)).length],
  };
}

// Split text into { t, b, i, u } segments. Bold first, then underline, then
// italic. Markers never span line breaks (prevents runaway formatting).
export function parseRich(text) {
  const src = String(text ?? "");
  if (!src) return [];
  const out = [];
  const boldParts = src.split(/(\*\*[^*\n]+?\*\*)/g);
  for (const bp of boldParts) {
    const bm = bp.match(/^\*\*([^*]+?)\*\*$/);
    if (bm) {
      out.push({ t: bm[1], b: true });
      continue;
    }
    const uParts = bp.split(/(__[^_\n]+?__)/g);
    for (const up of uParts) {
      const um = up.match(/^__([^_]+?)__$/);
      if (um) {
        out.push({ t: um[1], u: true });
        continue;
      }
      const iParts = up.split(/(\*[^*\n]+?\*)/g);
      for (const ip of iParts) {
        if (!ip) continue;
        const im = ip.match(/^\*([^*]+?)\*$/);
        if (im) out.push({ t: im[1], i: true });
        else out.push({ t: ip });
      }
    }
  }
  return out.filter((s) => s.t !== "");
}

// Plain-text version for ATS counts / verb detection / search.
export function stripFormatting(s) {
  return String(s ?? "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\*/g, "");
}
