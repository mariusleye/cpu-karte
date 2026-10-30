// Prüft data/kliniken.json mit derselben Logik wie die App und zählt unbekannte Felder.
// Aufruf: node tools/pruefe-liste.js [Pfad]
const fs = require("node:fs");
const path = require("node:path");
const C = require("../logic.js");

const datei = process.argv[2] || path.join(__dirname, "..", "data", "kliniken.json");
const d = JSON.parse(fs.readFileSync(datei, "utf8"));
const liste = d.kliniken.map(C.normalisiereKlinik);
const fehler = C.pruefeListe(liste);

if (!liste.some((k) => k.id === "ukhd")) fehler.push("Vergleichsziel mit Id \"ukhd\" fehlt");
const ohneQuelle = liste.filter((k) => !k.quelle).map((k) => k.name);
if (ohneQuelle.length) fehler.push("Ohne Quelle: " + ohneQuelle.join(", "));
const geprueft = liste.filter((k) => k.geprueft).length;

console.log(liste.length + " Häuser, davon ärztlich geprüft: " + geprueft);
const felder = C.FELDER.map((f) => f.key).concat(["katheter"]);
felder.forEach((key) => {
  const unbekannt = liste.filter((k) => (key === "katheter" ? !k.katheter : k[key] === null)).length;
  console.log("  " + key.padEnd(20) + " unbekannt: " + unbekannt + " von " + liste.length);
});
const s = C.standDerListe(liste, new Date());
console.log("Ältester Stand: " + s.aeltest + " (" + s.tage + " Tage), ohne Stand: " + s.ohneStand);
if (fehler.length) {
  console.error("\nFehler:\n- " + fehler.join("\n- "));
  process.exit(1);
}
console.log("\nListe ist formal in Ordnung.");
