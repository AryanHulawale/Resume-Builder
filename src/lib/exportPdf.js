import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

// Direct client-side PDF export — bypasses the browser print dialog,
// so no URL / date / title header-footer is ever added.
export async function buildResumePdf() {
  const el = document.getElementById("resume-preview-paper");
  if (!el) throw new Error("Preview element not found");

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = 210;
  const pageH = 297;
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
  heightLeft -= pageH;

  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }

  return pdf;
}

export async function exportResumePdf(filename = "resume.pdf") {
  const pdf = await buildResumePdf();
  pdf.save(filename);
}

export async function getResumePdfPreviewUrl() {
  const pdf = await buildResumePdf();
  const blob = pdf.output("blob");
  return URL.createObjectURL(blob);
}
