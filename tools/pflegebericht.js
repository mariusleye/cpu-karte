// Monatliche Pflegeprüfung der Klinikliste (läuft in der GitHub Action, lokal zum Ausprobieren).
// Prüft: formale Fehler, Stand älter als 90 Tage, Quellseiten noch erreichbar. Lücken und fehlende
// ärztliche Prüfung stehen nur zur Information im Bericht und lösen keine Meldung aus.
// Aufruf: node tools/pflegebericht.js [--ohne-netz] [--ausgabe bericht.md] [--liste data/kliniken.json]
// Schreibt bei gesetztem GITHUB_OUTPUT die Werte befund=true|false und titel=...
const fs = require("node:fs");
const path = require("node:path");
const C = require("../logic.js");

const args = process.argv.slice(2);
function opt(name, standard) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : standard;
}
const OHNE_NETZ = args.includes("--ohne-netz");
const ALT_TAGE = 90;
const LISTE = opt("--liste", path.join(__dirname, "..", "data", "kliniken.json"));
const AUSGABE = opt("--ausgabe", "pflegebericht.md");
const UA = "cpu-karte-listenpflege (monatliche Quellenprüfung, https://github.com/mariusleye/cpu-karte)";
const TIMEOUT_MS = 20000;
const PARALLEL = 4;

function datumDe(d) {
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear();
}

async function pruefeUrl(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": UA, accept: "text/html,application/pdf,*/*" } });
    if (res.body) res.body.cancel().catch(() => {});
    if (res.status === 404 || res.status === 410) return { art: "tot", text: "HTTP " + res.status };
    if (res.ok) return { art: "ok", text: "HTTP " + res.status };
    return { art: "unklar", text: "HTTP " + res.status };
  } catch (e) {
    const code = (e.cause && (e.cause.code || e.cause.message)) || e.name || String(e);
    // Nur eine nicht mehr auflösbare Adresse gilt als tot; Zeitüberschreitung und Zertifikatsfehler sind unklar.
    if (/ENOTFOUND/.test(code)) return { art: "tot", text: "Adresse nicht auflösbar" };
    return { art: "unklar", text: e.name === "AbortError" ? "keine Antwort in " + TIMEOUT_MS / 1000 + " s" : String(code) };
  } finally {
    clearTimeout(t);
  }
}

async function pool(items, n, fn) {
  const ergebnis = new Array(items.length);
  let naechster = 0;
  async function arbeiter() {
    while (true) {
      const i = naechster++;
      if (i >= items.length) return;
      ergebnis[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, arbeiter));
  return ergebnis;
}

(async () => {
  const jetzt = new Date();
  const roh = JSON.parse(fs.readFileSync(LISTE, "utf8"));
  const liste = roh.kliniken.map(C.normalisiereKlinik);
  const formal = C.pruefeListe(liste);
  if (!liste.some((k) => k.id === "ukhd")) formal.push("Vergleichsziel mit Id \"ukhd\" fehlt");
  liste.filter((k) => !k.quelle).forEach((k) => formal.push("Ohne Quelle: " + k.name));

  const l = C.luecken(liste, jetzt);
  const alt = l.haeuser.filter((x) => x.tage === null || x.tage > ALT_TAGE)
    .sort((a, b) => (b.tage === null ? 9999 : b.tage) - (a.tage === null ? 9999 : a.tage));

  // Quell-Adressen einsammeln (je Adresse die betroffenen Häuser)
  const urls = new Map();
  liste.forEach((k) => {
    (k.quelle.match(/https?:\/\/[^\s;,)]+/g) || []).forEach((u) => {
      const sauber = u.replace(/[.]+$/, "");
      if (!urls.has(sauber)) urls.set(sauber, []);
      if (!urls.get(sauber).includes(k.name)) urls.get(sauber).push(k.name);
    });
  });

  let quellen = [];
  if (!OHNE_NETZ) {
    const keys = Array.from(urls.keys());
    const res = await pool(keys, PARALLEL, pruefeUrl);
    quellen = keys.map((u, i) => ({ url: u, haeuser: urls.get(u), ...res[i] }));
  }
  const tot = quellen.filter((q) => q.art === "tot");
  const unklar = quellen.filter((q) => q.art === "unklar");
  const ok = quellen.filter((q) => q.art === "ok");

  const befunde = formal.length + alt.length + tot.length;
  const z = l.zusammenfassung;
  const md = [];
  md.push("## Klinikliste: Monatsprüfung vom " + datumDe(jetzt));
  md.push("");
  md.push(befunde
    ? "**" + befunde + " Punkte brauchen Aufmerksamkeit.** Die Liste steuert eine Entscheidungshilfe für die Notaufnahme; veraltete Angaben sollen nicht unbemerkt bleiben."
    : "Alles in Ordnung: keine formalen Fehler, kein Stand älter als " + ALT_TAGE + " Tage" + (OHNE_NETZ ? " (Quellen in diesem Lauf nicht geprüft)." : ", alle prüfbaren Quellen erreichbar."));
  md.push("");
  if (formal.length) {
    md.push("### Formale Fehler (" + formal.length + ")", "");
    formal.forEach((f) => md.push("- " + f));
    md.push("");
  }
  if (alt.length) {
    md.push("### Stand älter als " + ALT_TAGE + " Tage oder ohne Datum (" + alt.length + ")", "");
    alt.forEach((x) => md.push("- " + x.klinik.name + ", " + x.klinik.ort + ": " + (x.tage === null ? "kein lesbares Stand-Datum" : "Stand " + x.klinik.stand + " (vor " + x.tage + " Tagen)")));
    md.push("");
  }
  if (tot.length) {
    md.push("### Quellseiten nicht mehr erreichbar (" + tot.length + ")", "");
    tot.forEach((q) => md.push("- " + q.url + ": " + q.text + ". Betrifft: " + q.haeuser.join("; ")));
    md.push("");
  }
  md.push("### Zur Information", "");
  md.push("- Angaben belegt: " + (z.zellenGesamt - z.zellenUnbekannt) + " von " + z.zellenGesamt + " Feldern (" + Math.round(z.anteilBekannt * 100) + " %). Häuser mit mindestens einer Lücke: " + z.mitLuecken + " von " + z.haeuser + ".");
  md.push("- Ärztlich geprüft (Spalte „Geprüft von“): " + z.geprueft + " von " + z.haeuser + ".");
  if (OHNE_NETZ) md.push("- Quellen: nicht geprüft (Lauf ohne Netz).");
  else md.push("- Quellen: " + quellen.length + " Adressen geprüft, " + ok.length + " erreichbar, " + tot.length + " nicht mehr vorhanden, " + unklar.length + " nicht eindeutig prüfbar (Zugriffssperre oder Zeitüberschreitung, kein Befund).");
  md.push("");
  if (unklar.length) {
    md.push("<details><summary>Nicht eindeutig prüfbare Quellen (" + unklar.length + ")</summary>", "");
    unklar.forEach((q) => md.push("- " + q.url + ": " + q.text));
    md.push("", "</details>", "");
  }
  md.push("Die Pflegeschritte stehen in der README (Abschnitt „Klinikliste pflegen“), die Lücken je Haus in der App unter „Listenprüfung“. Dieser Bericht ersetzt keine fachliche Prüfung.");
  md.push("");
  md.push("_Automatisch erzeugt von der Action „Klinikliste prüfen“. Der Bericht wird jeden Monat neu erstellt; ist alles in Ordnung, wird diese Meldung geschlossen._");

  const text = md.join("\n") + "\n";
  fs.writeFileSync(AUSGABE, text);
  console.log(text);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, "befund=" + (befunde ? "true" : "false") + "\n");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, "titel=Klinikliste prüfen: " + befunde + (befunde === 1 ? " Punkt" : " Punkte") + " (" + datumDe(jetzt) + ")\n");
  }
})().catch((e) => { console.error(e); process.exit(1); });
