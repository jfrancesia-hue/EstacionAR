// Conversor simple Markdown -> HTML con estilo EstacionAR, para generar PDF con Edge/Chrome headless.
// Uso: node scripts/md-to-pdf.mjs <input.md> <output.html>
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath = "PRODUCTO.md", outPath = "PRODUCTO.html"] = process.argv;
const md = readFileSync(inPath, "utf8");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

const lines = md.split(/\r?\n/);
let html = "";
let list = null; // 'ul' | 'ol'
let para = [];
let quote = [];

function flushPara() {
  if (para.length) { html += `<p>${inline(para.join(" "))}</p>\n`; para = []; }
}
function flushList() {
  if (list) { html += `</${list}>\n`; list = null; }
}
function flushQuote() {
  if (quote.length) { html += `<blockquote>${inline(quote.join(" "))}</blockquote>\n`; quote = []; }
}
function flushAll() { flushPara(); flushList(); flushQuote(); }

let firstH1 = true;
for (const raw of lines) {
  const line = raw.trimEnd();
  if (!line.trim()) { flushAll(); continue; }

  let m;
  if ((m = line.match(/^#\s+(.*)/))) {
    flushAll();
    const cls = firstH1 ? "h1 first" : "h1";
    firstH1 = false;
    html += `<h1 class="${cls}">${inline(m[1])}</h1>\n`;
  } else if ((m = line.match(/^##\s+(.*)/))) {
    flushAll(); html += `<h2>${inline(m[1])}</h2>\n`;
  } else if ((m = line.match(/^###\s+(.*)/))) {
    flushAll(); html += `<h3>${inline(m[1])}</h3>\n`;
  } else if (/^---+$/.test(line)) {
    flushAll(); html += `<hr/>\n`;
  } else if ((m = line.match(/^>\s?(.*)/))) {
    flushPara(); flushList(); quote.push(m[1]);
  } else if ((m = line.match(/^[*-]\s+(.*)/))) {
    flushPara(); flushQuote();
    if (list !== "ul") { flushList(); html += `<ul>\n`; list = "ul"; }
    html += `<li>${inline(m[1])}</li>\n`;
  } else if ((m = line.match(/^\d+\.\s+(.*)/))) {
    flushPara(); flushQuote();
    if (list !== "ol") { flushList(); html += `<ol>\n`; list = "ol"; }
    html += `<li>${inline(m[1])}</li>\n`;
  } else {
    flushList(); flushQuote(); para.push(line);
  }
}
flushAll();

const doc = `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; color: #16243a; line-height: 1.5; font-size: 11.5pt; }
  .cover { text-align: center; padding: 60mm 0 0; page-break-after: always; }
  .logo { display: inline-flex; align-items: center; gap: 12px; }
  .logo .mark { width: 56px; height: 56px; border-radius: 14px; background: #0FB6CE; display: inline-block; }
  .logo .name { font-size: 34px; font-weight: 800; letter-spacing: -0.5px; }
  .logo .name b { color: #0FB6CE; }
  .cover h1 { border: 0; font-size: 22px; margin-top: 28px; color: #0A1A2F; }
  .cover p { color: #5b6b80; margin-top: 8px; }
  .cover .tag { display: inline-block; margin-top: 22px; padding: 6px 14px; border-radius: 999px; background: #0FB6CE22; color: #0a7c8c; font-weight: 700; font-size: 12px; }
  h1.h1 { font-size: 19px; color: #0A1A2F; border-bottom: 3px solid #0FB6CE; padding-bottom: 6px; margin: 26px 0 12px; }
  h1.h1:not(.first) { page-break-before: always; }
  h2 { font-size: 15px; color: #102A47; margin: 18px 0 8px; }
  h3 { font-size: 13px; color: #0a7c8c; margin: 14px 0 6px; }
  p { margin: 8px 0; }
  ul, ol { margin: 8px 0 8px 4px; padding-left: 22px; }
  li { margin: 3px 0; }
  code { background: #eef2f7; border-radius: 4px; padding: 1px 5px; font-family: "Cascadia Code", Consolas, monospace; font-size: 0.9em; color: #0a5a68; }
  strong { color: #0A1A2F; }
  hr { border: 0; border-top: 1px solid #dde4ec; margin: 16px 0; }
  blockquote { margin: 12px 0; padding: 10px 14px; background: #f5a62315; border-left: 4px solid #F5A623; border-radius: 6px; color: #5b4a1f; }
  blockquote strong { color: #7a5a10; }
  a { color: #0a7c8c; text-decoration: none; }
</style></head>
<body>
  <div class="cover">
    <div class="logo"><span class="mark"></span><span class="name">Estacion<b>AR</b></span></div>
    <h1>Especificación de producto</h1>
    <p>Plataforma de estacionamiento medido · Municipalidad de la Ciudad de Salta</p>
    <span class="tag">Documento maestro · Nativos Consultora</span>
  </div>
  ${html}
</body></html>`;

writeFileSync(outPath, doc, "utf8");
console.log("HTML generado:", outPath);
