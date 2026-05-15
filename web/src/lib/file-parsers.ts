/**
 * File parsers for non-plaintext attachments.
 * Each parser extracts text content from binary formats.
 */

// --------------- PDF (pdfjs-dist) ---------------
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then(async (pdfjs) => {
      // Use the fake worker so pdfjs works without a worker thread
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjs.GlobalWorkerOptions.workerSrc || "";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = await getPdfJs();
  // pdfjs-dist expects the data as a typed array with {data} property
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => (item as { str?: string }).str || "")
      .filter(Boolean)
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

// --------------- Word .docx (mammoth) ---------------
export async function extractDocxText(data: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: data });
  return result.value;
}

// --------------- Excel .xlsx / .xls (SheetJS) ---------------
export async function extractExcelText(data: ArrayBuffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(new Uint8Array(data), { type: "array" });
  const sheets: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      sheets.push(`## ${sheetName}\n\n${csv}`);
    }
  }

  return sheets.join("\n\n");
}
