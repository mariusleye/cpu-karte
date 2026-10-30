// Tests der reinen Logik. Aufruf: node tests/logic.test.js
const assert = require("node:assert/strict");
const C = require("../logic.js");

let n = 0;
function t(name, fn) { fn(); n++; console.log("ok  " + name); }
const d = (s) => new Date(s); // lokale Zeit, ohne Z

// ---- Feiertage BW
t("Feiertage BW 2026", () => {
  const f = C.feiertageBW(2026);
  for (const x of ["2026-01-01", "2026-01-06", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-14",
    "2026-05-25", "2026-06-04", "2026-10-03", "2026-11-01", "2026-12-25", "2026-12-26"]) assert.ok(f[x], x);
  assert.equal(Object.keys(f).length, 12);
});

// ---- Zeitangaben
t("24/7 und leer", () => {
  assert.equal(C.parseZeiten("24/7").typ, "24/7");
  assert.equal(C.parseZeiten(""), null);
  assert.equal(C.parseZeiten(null), null);
  assert.equal(C.parseZeiten("nein").typ, "keine");
});

t("Fenster Mo-Fr 07:00-17:00", () => {
  const z = C.parseZeiten("Mo-Fr 07:00-17:00");
  assert.equal(C.katheterJetzt(z, d("2026-10-28T10:00")), true);   // Mittwoch
  assert.equal(C.katheterJetzt(z, d("2026-10-28T22:10")), false);
  assert.equal(C.katheterJetzt(z, d("2026-10-31T10:00")), false);  // Samstag
  assert.equal(C.katheterJetzt(z, d("2026-11-01T10:00")), false);  // Sonntag/Feiertag
  assert.equal(C.katheterJetzt(z, d("2026-10-28T17:00")), false);  // Ende exklusiv
  assert.equal(C.katheterJetzt(z, d("2026-10-28T07:00")), true);
});

t("Feiertag wie Sonntag, mit eigenem Fenster", () => {
  const z = C.parseZeiten("Mo-Fr 07:00-17:00");
  assert.equal(C.katheterJetzt(z, d("2026-10-03T10:00")), false);  // Samstag + Feiertag
  const z2 = C.parseZeiten("Mo-Fr 07:00-17:00; Feiertag 08:00-12:00");
  assert.equal(C.katheterJetzt(z2, d("2026-12-25T09:00")), true);  // Freitag, Feiertag
  assert.equal(C.katheterJetzt(z2, d("2026-12-25T13:00")), false);
});

t("Fenster über Mitternacht", () => {
  const z = C.parseZeiten("Mo-So 20:00-06:00");
  assert.equal(C.katheterJetzt(z, d("2026-10-28T23:00")), true);
  assert.equal(C.katheterJetzt(z, d("2026-10-29T03:00")), true);
  assert.equal(C.katheterJetzt(z, d("2026-10-29T12:00")), false);
});

t("Unlesbare Zeit ist unbekannt, nie ja", () => {
  const z = C.parseZeiten("werktags tagsueber");
  assert.equal(z.typ, "fehler");
  assert.equal(C.katheterJetzt(z, d("2026-10-28T10:00")), null);
});

// ---- Eignung
const voll = C.normalisiereKlinik({ id: "a", name: "A", lat: 49.4, lon: 8.7, katheter: "24/7", cpu: "ja", intensiv: "ja",
  beatmung: "ja", herzchirurgie: "nein", ecmo_impella: "nein", ttm: "ja", ep: "nein", lyse: "ja", ct: "ja",
  schrittmacher_temp: "ja", notaufnahme: "ja" });
const tag = C.normalisiereKlinik({ id: "b", name: "B", lat: 49.3, lon: 8.6, katheter: "Mo-Fr 07:00-17:00", cpu: "nein",
  intensiv: "ja", beatmung: "ja", notaufnahme: "ja" });
const leer = C.normalisiereKlinik({ id: "c", name: "C", lat: 49.5, lon: 8.5 });
const nachts = d("2026-10-28T22:10"), mittags = d("2026-10-28T11:00");

t("STEMI nachts: 24/7-Haus ja, Tageshaus nein mit Grund", () => {
  assert.equal(C.pruefeKlinik(voll, "stemi", nachts).geeignet, true);
  const r = C.pruefeKlinik(tag, "stemi", nachts);
  assert.equal(r.geeignet, false);
  assert.match(r.gruende[0].text, /nicht verfügbar/);
  assert.equal(C.pruefeKlinik(tag, "stemi", mittags).geeignet, true);
});

t("Unbekannt zählt als nein und wird gekennzeichnet", () => {
  const r = C.pruefeKlinik(leer, "stemi", mittags);
  assert.equal(r.geeignet, false);
  assert.equal(r.hatUnbekannt, true);
  assert.equal(C.pruefeKlinik(leer, "stabil", mittags).geeignet, false); // Notaufnahme nicht belegt
});

t("ACS stabil: Katheter jetzt oder CPU", () => {
  assert.equal(C.pruefeKlinik(tag, "acs", nachts).geeignet, false);
  assert.equal(C.pruefeKlinik(tag, "acs", mittags).geeignet, true);
  const cpuOnly = C.normalisiereKlinik({ id: "d", name: "D", lat: 49, lon: 8, katheter: "nein", cpu: "ja" });
  assert.equal(C.pruefeKlinik(cpuOnly, "acs", nachts).geeignet, true);
});

t("Aortensyndrom braucht Herzchirurgie und CT", () => {
  assert.equal(C.pruefeKlinik(voll, "aorta", mittags).geeignet, false);
  const hc = C.normalisiereKlinik({ id: "e", name: "E", lat: 49, lon: 8, herzchirurgie: "ja", ct: "ja" });
  assert.equal(C.pruefeKlinik(hc, "aorta", mittags).geeignet, true);
});

t("Jedes Profil hat nur bekannte Anforderungen", () => {
  for (const p of C.PROFILE) for (const a of p.anf) assert.ok(C.ANFORDERUNG_LABEL[a], p.id + ":" + a);
  assert.equal(C.PROFILE.length, 12);
});

// ---- Bewertung mit Mehrzeit
const hd = C.normalisiereKlinik({ id: "ukhd", name: "UKHD", lat: 49.4, lon: 8.67, uni: "ja", katheter: "24/7", cpu: "ja",
  intensiv: "ja", beatmung: "ja", herzchirurgie: "ja", ecmo_impella: "ja", ttm: "ja", ct: "ja", notaufnahme: "ja",
  lyse: "ja", schrittmacher_temp: "ja", ep: "ja" });
const nah = Object.assign({}, voll, { id: "nah" });
const fern = Object.assign({}, voll, { id: "fern" });
t("Mehrzeit-Schwelle: näher ist immer dabei, +10 Min Grenze, darüber zu weit", () => {
  const r = C.bewerte({ kliniken: [hd, nah, fern, tag, leer], profilId: "stemi", jetzt: nachts,
    minuten: { ukhd: 25, nah: 15, fern: 35, b: 20, c: 22 }, hdId: "ukhd", schwelleX: 10 });
  assert.equal(r.hd.kategorie, "referenz");
  const k = Object.fromEntries(r.liste.map((e) => [e.klinik.id, e]));
  assert.equal(k.nah.kategorie, "alternative");
  assert.equal(k.nah.mehrzeit, -10);
  assert.equal(k.fern.kategorie, "alternative");          // genau +10
  assert.equal(k.b.kategorie, "nicht_geeignet");          // nachts kein Katheter
  assert.equal(r.alternativen.length, 2);
  assert.equal(r.liste[0].klinik.id, "ukhd");
  const r2 = C.bewerte({ kliniken: [hd, fern], profilId: "stemi", jetzt: nachts,
    minuten: { ukhd: 25, fern: 36 }, hdId: "ukhd", schwelleX: 10 });
  assert.equal(r2.keineAlternative, true);
  assert.equal(r2.liste[1].kategorie, "zu_weit");
});

t("Fehlende Fahrzeit blockiert die Alternative", () => {
  const r = C.bewerte({ kliniken: [hd, nah], profilId: "stemi", jetzt: nachts,
    minuten: { ukhd: 25, nah: null }, hdId: "ukhd", schwelleX: 10 });
  assert.equal(r.liste[1].kategorie, "ohne_fahrzeit");
  assert.equal(r.keineAlternative, true);
});

t("Ohne Fahrzeit nach UKHD gibt es keine Alternative", () => {
  const r = C.bewerte({ kliniken: [hd, nah], profilId: "stemi", jetzt: nachts,
    minuten: { nah: 10 }, hdId: "ukhd", schwelleX: 10 });
  assert.equal(r.keineAlternative, true);
});

// ---- Adresse
t("Hausnummer wird nie übertragen", () => {
  const f = (s) => C.bereinigeAdresse(s).query;
  assert.equal(f("Hauptstraße 12, 69190 Walldorf"), "Hauptstraße, 69190 Walldorf");
  assert.equal(f("Hauptstr. 12a Walldorf"), "Hauptstr. Walldorf");
  assert.equal(f("Bahnhofstr 3-5, Mosbach"), "Bahnhofstr, Mosbach");
  assert.equal(f("Bahnhofstr 3 - 5 Mosbach"), "Bahnhofstr Mosbach");
  assert.equal(f("Am Markt Nr. 7 Eberbach"), "Am Markt Eberbach");
  assert.equal(f("Walldorf"), "Walldorf");
  assert.equal(f("B 37 Neckargemünd"), "B 37 Neckargemünd");
  assert.equal(f("L 600 Schwetzingen"), "L 600 Schwetzingen");
  assert.equal(f("69190 Walldorf"), "69190 Walldorf");
  assert.equal(C.bereinigeAdresse("Hauptstraße 12, Walldorf").hausnummerEntfernt, true);
  assert.equal(C.bereinigeAdresse("Walldorf").hausnummerEntfernt, false);
  assert.ok(!/\d/.test(f("Rohrbacher Str. 110 Heidelberg")));
});

// ---- Autobahn
t("Autobahn-Eingabe", () => {
  assert.deepEqual(C.parseAutobahn("A5 Walldorf"), { autobahn: "A5", rest: "Walldorf", km: null });
  assert.deepEqual(C.parseAutobahn("A 6 AS Sinsheim"), { autobahn: "A6", rest: "Sinsheim", km: null });
  assert.deepEqual(C.parseAutobahn("BAB 6 km 120,5"), { autobahn: "A6", rest: "", km: 120.5 });
  assert.equal(C.parseAutobahn("Ansbach"), null);
  assert.equal(C.parseAutobahn("Autobahnmeisterei"), null);
  assert.equal(C.parseAutobahn("A5").autobahn, "A5");
  assert.equal(C.parseAutobahn("A5").rest, "");
});

t("Anschlussstellen suchen und sortieren", () => {
  const tab = [
    { autobahn: "A5", name: "Heidelberg/Schwetzingen", ref: "37", lat: 49.35, lon: 8.62 },
    { autobahn: "A5", name: "Walldorf/Wiesloch", ref: "39", lat: 49.30, lon: 8.64 },
    { autobahn: "A5", name: "Weinheim", ref: "30", lat: 49.55, lon: 8.64 },
    { autobahn: "A6", name: "Sinsheim", ref: "33", lat: 49.25, lon: 8.85 }
  ];
  const r = C.sucheAnschlussstellen(tab, "A5");
  assert.deepEqual(r.treffer.map((a) => a.name), ["Weinheim", "Heidelberg/Schwetzingen", "Walldorf/Wiesloch"]);
  assert.equal(C.sucheAnschlussstellen(tab, "A5 walldorf").treffer.length, 1);
  assert.equal(C.sucheAnschlussstellen(tab, "A6 Walldorf").treffer.length, 0);
  assert.equal(C.sucheAnschlussstellen(tab, "Walldorf"), null);
});

// ---- Klinikliste
t("Excel-Zeilen in Klinikobjekte, Kommazahlen, Unbekanntes", () => {
  const header = ["Id", "Name", "Ort", "Breite", "Länge", "Uni", "Notaufnahme", "Katheter", "CPU", "Intensiv",
    "ECMO/Impella", "Schrittmacher temp.", "Stand"];
  const zeilen = [["x1", "Haus X", "Ort", "49,41", "8,67", "nein", "ja", "24/7", "ja", "ja", "vielleicht", "", "2026-01-15"], []];
  const k = C.klinikenAusTabelle(header, zeilen);
  assert.equal(k.length, 1);
  assert.equal(k[0].lat, 49.41);
  assert.equal(k[0].ecmo_impella, null);          // "vielleicht" ist unbekannt
  assert.equal(k[0].schrittmacher_temp, null);
  assert.equal(k[0].uni, false);
  assert.deepEqual(C.pruefeListe(k), []);
});

t("Listenprüfung meldet Fehler", () => {
  const k = [C.normalisiereKlinik({ id: "", name: "", lat: "", lon: "" }),
    C.normalisiereKlinik({ id: "z", name: "Z", lat: 49, lon: 8, katheter: "werktags" })];
  const f = C.pruefeListe(k);
  assert.ok(f.some((x) => /Id fehlt/.test(x)));
  assert.ok(f.some((x) => /Koordinaten/.test(x)));
  assert.ok(f.some((x) => /nicht lesbar/.test(x)));
});

t("Stand der Liste", () => {
  const k = [C.normalisiereKlinik({ id: "a", name: "A", lat: 49, lon: 8, stand: "2026-07-01" }),
    C.normalisiereKlinik({ id: "b", name: "B", lat: 49, lon: 8, stand: "2026-10-01" })];
  const s = C.standDerListe(k, new Date("2026-10-30T12:00:00"));
  assert.equal(s.aeltest, "2026-07-01");
  assert.equal(s.tage, 121);
});

t("Schätzung aus Luftlinie", () => {
  const km = C.haversineKm(49.4, 8.67, 49.3, 8.64);
  assert.ok(km > 10 && km < 12);
  const m = C.schaetzeMinuten(km);
  assert.ok(m > 15 && m < 40);
});

console.log("\n" + n + " Tests bestanden");
