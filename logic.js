/*
 * CPU-Karte: reine Logik ohne Oberfläche (läuft im Browser und unter Node).
 * Eignung eines Hauses je Fallprofil, Katheter-Zeitfenster, Feiertage BW,
 * Mehrzeit gegenüber UKHD, Adressbereinigung, Autobahn-Eingabe, Klinikliste.
 *
 * Grundsatz: Unbekannt ist nie "ja". Ein Feld, das nicht belegt ist, zählt für
 * die Eignung wie "nein" und wird als "unbekannt" gekennzeichnet.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CPU = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ------------------------------------------------------------------ Felder

  /** Ja/nein-Felder der Klinikliste (Schlüssel im JSON, Spaltenname in der Excel). */
  var FELDER = [
    { key: "notaufnahme", label: "Notaufnahme", spalte: "Notaufnahme" },
    { key: "cpu", label: "Chest Pain Unit", spalte: "CPU" },
    { key: "intensiv", label: "Intensivstation", spalte: "Intensiv" },
    { key: "beatmung", label: "Beatmung", spalte: "Beatmung" },
    { key: "herzchirurgie", label: "Herzchirurgie", spalte: "Herzchirurgie" },
    { key: "ecmo_impella", label: "ECMO/Impella", spalte: "ECMO/Impella" },
    { key: "ttm", label: "Temperaturmanagement", spalte: "TTM" },
    { key: "ep", label: "Elektrophysiologie", spalte: "EP" },
    { key: "lyse", label: "Lysetherapie", spalte: "Lyse" },
    { key: "ct", label: "CT", spalte: "CT" },
    { key: "schrittmacher_temp", label: "Temporärer Schrittmacher", spalte: "Schrittmacher temp." }
  ];

  var ANFORDERUNG_LABEL = {
    katheter_jetzt: "Herzkatheter jetzt",
    katheter_247: "Herzkatheter rund um die Uhr",
    katheter_oder_cpu: "Herzkatheter jetzt oder Chest Pain Unit",
    ueberwachung: "Überwachung (CPU oder Intensivstation)"
  };
  FELDER.forEach(function (f) { ANFORDERUNG_LABEL[f.key] = f.label; });

  // ------------------------------------------------------------------ Profile
  // Entwurf der Zuordnung Profil -> nötige Fähigkeiten. Klinisch abzunehmen.

  var PROFILE = [
    { id: "stemi", label: "STEMI / Hochrisiko-NSTEMI", anf: ["katheter_jetzt", "intensiv"] },
    { id: "acs", label: "ACS / NSTEMI stabil", anf: ["katheter_oder_cpu"] },
    { id: "rhythmus", label: "Rhythmusstörung / Synkope", anf: ["ueberwachung"] },
    { id: "schock", label: "Kardiogener Schock", anf: ["katheter_247", "intensiv", "ecmo_impella"] },
    { id: "rosc", label: "Post-Reanimation (ROSC)", anf: ["katheter_247", "intensiv", "ttm"] },
    { id: "lae", label: "Lungenembolie hochriskant", anf: ["intensiv", "lyse"] },
    { id: "aorta", label: "Aortensyndrom", anf: ["herzchirurgie", "ct"] },
    { id: "herzinsuff", label: "Akute Herzinsuffizienz / Lungenödem", anf: ["ueberwachung"] },
    { id: "brady", label: "Instabile Bradykardie / AV-Block III°", anf: ["schrittmacher_temp", "ueberwachung"] },
    { id: "resp", label: "Respiratorische Insuffizienz", anf: ["intensiv", "beatmung"] },
    { id: "pneumonie", label: "Pneumonie stabil", anf: ["notaufnahme"] },
    { id: "stabil", label: "Stabil / unklar", anf: ["notaufnahme"] }
  ];

  function profil(id) {
    for (var i = 0; i < PROFILE.length; i++) if (PROFILE[i].id === id) return PROFILE[i];
    return null;
  }

  // -------------------------------------------------------------- Feiertage BW

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }

  function ostersonntag(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31);
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }

  var feiertageCache = {};
  /** Gesetzliche Feiertage Baden-Württemberg als Menge von "JJJJ-MM-TT". */
  function feiertageBW(jahr) {
    if (feiertageCache[jahr]) return feiertageCache[jahr];
    var o = ostersonntag(jahr), set = {};
    function plus(n) { return ymd(new Date(jahr, o.getMonth(), o.getDate() + n)); }
    [jahr + "-01-01", jahr + "-01-06", plus(-2), plus(1), jahr + "-05-01", plus(39), plus(50), plus(60),
      jahr + "-10-03", jahr + "-11-01", jahr + "-12-25", jahr + "-12-26"].forEach(function (s) { set[s] = true; });
    feiertageCache[jahr] = set;
    return set;
  }

  function istFeiertag(datum) { return !!feiertageBW(datum.getFullYear())[ymd(datum)]; }

  // ------------------------------------------------------------ Katheterzeiten

  var TAGE = { so: 0, mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6, feiertag: 7, ft: 7 };
  var FEIERTAG = 7;

  function minuten(hhmm) {
    var m = /^(\d{1,2})(?::(\d{2}))?$/.exec(hhmm);
    if (!m) return NaN;
    var h = +m[1], mi = m[2] ? +m[2] : 0;
    if (h > 24 || mi > 59 || (h === 24 && mi > 0)) return NaN;
    return h * 60 + mi;
  }

  function tageListe(text) {
    var tage = {}, t = text.trim().toLowerCase().replace(/\./g, "");
    if (!t || t === "täglich" || t === "taeglich" || t === "tgl") {
      [0, 1, 2, 3, 4, 5, 6, 7].forEach(function (d) { tage[d] = true; });
      return Object.keys(tage).map(Number);
    }
    var teile = t.split(/[,\/&]|\bund\b/);
    for (var i = 0; i < teile.length; i++) {
      var p = teile[i].trim();
      if (!p) continue;
      var r = /^(mo|di|mi|do|fr|sa|so)\s*[-–]\s*(mo|di|mi|do|fr|sa|so)$/.exec(p);
      if (r) {
        var d = TAGE[r[1]], ende = TAGE[r[2]], n = 0;
        while (n < 8) {
          tage[d] = true;
          if (d === ende) break;
          d = (d + 1) % 7;
          n++;
        }
        continue;
      }
      if (TAGE.hasOwnProperty(p)) { tage[TAGE[p]] = true; continue; }
      return null;
    }
    return Object.keys(tage).map(Number);
  }

  /**
   * Liest eine Zeitangabe.
   *  ""                      -> null (unbekannt)
   *  "24/7"                  -> { typ: "24/7" }
   *  "nein"                  -> { typ: "keine" }
   *  "Mo-Fr 07:00-17:00; Sa 08:00-12:00; Feiertag 08:00-12:00"
   *                          -> { typ: "fenster", fenster: [...] }
   *  Unlesbares              -> { typ: "fehler", text }
   */
  function parseZeiten(text) {
    if (text === null || text === undefined) return null;
    var s = String(text).trim();
    if (!s) return null;
    if (/^(24\s*\/\s*7(\s*\/\s*365)?|24\s*h|rund um die uhr|durchgehend)$/i.test(s)) return { typ: "24/7", text: s };
    if (/^(nein|keine|kein katheter|-)$/i.test(s)) return { typ: "keine", text: s };
    var fenster = [], teile = s.split(/[;\n]/);
    for (var i = 0; i < teile.length; i++) {
      var p = teile[i].trim();
      if (!p) continue;
      var m = /^(.*?)\s*(\d{1,2}(?::\d{2})?)\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(?:uhr)?$/i.exec(p);
      if (!m) return { typ: "fehler", text: s };
      var tage = tageListe(m[1]), von = minuten(m[2]), bis = minuten(m[3]);
      if (!tage || isNaN(von) || isNaN(bis)) return { typ: "fehler", text: s };
      fenster.push({ tage: tage, von: von, bis: bis });
    }
    if (!fenster.length) return { typ: "fehler", text: s };
    return { typ: "fenster", fenster: fenster, text: s };
  }

  /** true/false, oder null wenn die Zeit unbekannt oder unlesbar ist. */
  function katheterJetzt(z, jetzt) {
    if (!z || z.typ === "fehler") return null;
    if (z.typ === "24/7") return true;
    if (z.typ === "keine") return false;
    var feiertag = istFeiertag(jetzt);
    var tag = jetzt.getDay(), min = jetzt.getHours() * 60 + jetzt.getMinutes();
    var heute = feiertag ? FEIERTAG : tag;
    // Ohne eigenes Feiertagsfenster gilt der Feiertag wie ein Sonntag.
    if (feiertag) {
      var hatFt = z.fenster.some(function (f) { return f.tage.indexOf(FEIERTAG) >= 0; });
      if (!hatFt) heute = 0;
    }
    var gestern = (tag + 6) % 7;
    for (var i = 0; i < z.fenster.length; i++) {
      var f = z.fenster[i];
      if (f.bis > f.von) {
        if (f.tage.indexOf(heute) >= 0 && min >= f.von && min < f.bis) return true;
      } else {
        // über Mitternacht: Abschnitt am Starttag und Abschnitt am Folgetag
        if (f.tage.indexOf(heute) >= 0 && min >= f.von) return true;
        if (f.tage.indexOf(gestern) >= 0 && min < f.bis) return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------ Eignung

  function ergebnis(status, label, text) { return { status: status, label: label, text: text }; }

  function flagAnforderung(klinik, key) {
    var v = klinik[key], label = ANFORDERUNG_LABEL[key];
    if (v === true) return ergebnis("ok", label, label + ": ja");
    if (v === false) return ergebnis("nein", label, label + ": nein");
    return ergebnis("unbekannt", label, label + ": unbekannt");
  }

  function pruefeAnforderung(klinik, key, jetzt) {
    var z = klinik._zeiten !== undefined ? klinik._zeiten : parseZeiten(klinik.katheter);
    var label = ANFORDERUNG_LABEL[key];
    var jz = katheterJetzt(z, jetzt);
    var zeitText = z && z.text ? " (" + z.text + ")" : "";
    if (key === "katheter_jetzt") {
      if (z && z.typ === "fehler") return ergebnis("unbekannt", label, "Katheterzeiten nicht lesbar: " + z.text);
      if (jz === null) return ergebnis("unbekannt", label, "Katheterzeiten unbekannt");
      return jz ? ergebnis("ok", label, "Katheter jetzt verfügbar" + zeitText)
        : ergebnis("nein", label, "Katheter jetzt nicht verfügbar" + zeitText);
    }
    if (key === "katheter_247") {
      if (!z) return ergebnis("unbekannt", label, "Katheterzeiten unbekannt");
      if (z.typ === "fehler") return ergebnis("unbekannt", label, "Katheterzeiten nicht lesbar: " + z.text);
      return z.typ === "24/7" ? ergebnis("ok", label, "Katheter rund um die Uhr")
        : ergebnis("nein", label, "Katheter nicht rund um die Uhr" + zeitText);
    }
    if (key === "katheter_oder_cpu") {
      var cpu = klinik.cpu;
      if (jz === true) return ergebnis("ok", label, "Katheter jetzt verfügbar" + zeitText);
      if (cpu === true) return ergebnis("ok", label, "Chest Pain Unit vorhanden");
      if (jz === null || cpu === null || cpu === undefined)
        return ergebnis("unbekannt", label, "Katheterzeiten oder Chest Pain Unit unbekannt");
      return ergebnis("nein", label, "Katheter jetzt nicht verfügbar" + zeitText + ", keine Chest Pain Unit");
    }
    if (key === "ueberwachung") {
      if (klinik.cpu === true || klinik.intensiv === true) return ergebnis("ok", label, label + ": ja");
      if (klinik.cpu == null || klinik.intensiv == null) return ergebnis("unbekannt", label, label + ": unbekannt");
      return ergebnis("nein", label, "Weder Chest Pain Unit noch Intensivstation");
    }
    return flagAnforderung(klinik, key);
  }

  /** Prüft ein Haus gegen ein Profil. geeignet nur, wenn alles belegt und erfüllt ist. */
  function pruefeKlinik(klinik, profilId, jetzt) {
    var p = profil(profilId);
    if (!p) throw new Error("Unbekanntes Profil: " + profilId);
    var gruende = p.anf.map(function (key) { return pruefeAnforderung(klinik, key, jetzt); });
    var geeignet = gruende.every(function (g) { return g.status === "ok"; });
    var hatUnbekannt = gruende.some(function (g) { return g.status === "unbekannt"; });
    return { geeignet: geeignet, gruende: gruende, hatUnbekannt: hatUnbekannt };
  }

  // ----------------------------------------------------- Entfernung und Fahrzeit

  function haversineKm(lat1, lon1, lat2, lon2) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  /** Schätzung bei Ausfall des Routingdienstes: Umwegfaktor 1,3, mittleres Tempo 55 km/h. */
  var SCHAETZ_UMWEG = 1.3, SCHAETZ_KMH = 55;
  function schaetzeMinuten(km) { return (km * SCHAETZ_UMWEG / SCHAETZ_KMH) * 60; }

  // --------------------------------------------------------------- Bewertung

  /**
   * @param p.kliniken   Liste inkl. UKHD
   * @param p.profilId
   * @param p.jetzt      Date
   * @param p.minuten    { klinikId: Fahrzeit in Minuten oder null }
   * @param p.hdId       Id des Vergleichsziels (UKHD)
   * @param p.schwelleX  erlaubte Mehrzeit in Minuten
   */
  function bewerte(p) {
    var hd = null, liste = [];
    p.kliniken.forEach(function (k) {
      var min = p.minuten[k.id];
      var hasMin = typeof min === "number" && isFinite(min);
      var e = {
        klinik: k,
        eignung: pruefeKlinik(k, p.profilId, p.jetzt),
        minuten: hasMin ? min : null,
        mehrzeit: null,
        distanzOk: null,
        referenz: k.id === p.hdId,
        kategorie: null
      };
      liste.push(e);
      if (e.referenz) hd = e;
    });
    var hdMin = hd ? hd.minuten : null;
    liste.forEach(function (e) {
      if (e.referenz) { e.kategorie = "referenz"; return; }
      if (e.minuten !== null && hdMin !== null) {
        e.mehrzeit = e.minuten - hdMin;
        e.distanzOk = e.minuten <= hdMin + p.schwelleX;
      }
      if (e.eignung.geeignet && e.distanzOk === true) e.kategorie = "alternative";
      else if (e.eignung.geeignet && e.distanzOk === false) e.kategorie = "zu_weit";
      else if (e.eignung.geeignet) e.kategorie = "ohne_fahrzeit";
      else e.kategorie = "nicht_geeignet";
    });
    var rang = { referenz: 0, alternative: 1, zu_weit: 2, ohne_fahrzeit: 3, nicht_geeignet: 4 };
    liste.sort(function (a, b) {
      if (a.kategorie !== b.kategorie) return rang[a.kategorie] - rang[b.kategorie];
      var am = a.minuten === null ? Infinity : a.minuten, bm = b.minuten === null ? Infinity : b.minuten;
      return am - bm;
    });
    var alternativen = liste.filter(function (e) { return e.kategorie === "alternative"; });
    return { hd: hd, liste: liste, alternativen: alternativen, keineAlternative: alternativen.length === 0 };
  }

  // ---------------------------------------------------- Adresse und Autobahn

  /**
   * Entfernt Hausnummern, bevor der Text an einen externen Geocoder geht.
   * Postleitzahlen (5 Ziffern) und Straßenkennungen (B 37, L 600, K 4234, A 5) bleiben.
   */
  function bereinigeAdresse(text) {
    var s = String(text || "").replace(/\s+/g, " ").trim();
    var vorher = s;
    s = s.replace(/\bnr\.?\s*(?=\d)/gi, "");
    s = s.replace(/(^|[\s,])(\d{1,4})\s?([a-zA-Z])?(\s?[-–\/]\s?\d{1,4}\s?[a-zA-Z]?)?(?=$|[\s,])/g,
      function (all, lead, num, letter, bereich, offset, ganz) {
        var davor = ganz.slice(0, offset + (lead ? lead.length : 0));
        if (/(^|[\s,])[ABLKabkl]\s?$/.test(davor)) return all;
        return lead;
      });
    s = s.replace(/\s+,/g, ",").replace(/,\s*,/g, ",").replace(/\s+/g, " ").replace(/^[,\s]+|[,\s]+$/g, "");
    return { query: s, hausnummerEntfernt: s !== vorher };
  }

  /** "A5 Walldorf", "BAB 6 km 120,5", "A 656" -> { autobahn: "A5", rest, km } oder null. */
  function parseAutobahn(text) {
    var m = /^\s*(?:(?:BAB|Autobahn)\s*A?\s?|A\s?)(\d{1,3})(?![\d])\s*(.*)$/i.exec(String(text || ""));
    if (!m) return null;
    var rest = m[2].trim(), km = null;
    var k = /\bkm\.?\s*([\d]+(?:[.,]\d+)?)/i.exec(rest);
    if (k) { km = parseFloat(k[1].replace(",", ".")); rest = rest.replace(k[0], "").trim(); }
    rest = rest.replace(/^(?:ausfahrt|anschlussstelle|as|ak|kreuz|dreieck|ad)\b\.?\s*/i, "").trim();
    return { autobahn: "A" + m[1], rest: rest, km: km };
  }

  function norm(s) {
    return String(s || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .replace(/ß/g, "ss").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  /** Anschlussstellen einer Autobahn, optional nach Namen gefiltert; in Fahrtrichtung der Hauptachse sortiert. */
  function sucheAnschlussstellen(tabelle, eingabe) {
    var ab = parseAutobahn(eingabe);
    if (!ab) return null;
    var treffer = tabelle.filter(function (a) { return a.autobahn === ab.autobahn; });
    if (ab.rest) {
      var tokens = norm(ab.rest).split(" ");
      treffer = treffer.filter(function (a) {
        var n = norm(a.name + " " + (a.ref || ""));
        return tokens.every(function (t) { return n.indexOf(t) >= 0; });
      });
    }
    var lats = treffer.map(function (a) { return a.lat; }), lons = treffer.map(function (a) { return a.lon; });
    var spanLat = Math.max.apply(null, lats) - Math.min.apply(null, lats);
    var spanLon = (Math.max.apply(null, lons) - Math.min.apply(null, lons)) * 0.66;
    treffer = treffer.slice().sort(function (a, b) {
      return spanLat >= spanLon ? b.lat - a.lat : a.lon - b.lon;
    });
    return { autobahn: ab.autobahn, km: ab.km, treffer: treffer };
  }

  // -------------------------------------------------------------- Klinikliste

  function jaNein(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v;
    var s = String(v).trim().toLowerCase();
    if (!s) return null;
    if (["ja", "j", "x", "1", "true", "yes", "y"].indexOf(s) >= 0) return true;
    if (["nein", "n", "0", "false", "no"].indexOf(s) >= 0) return false;
    return null; // alles Unklare bleibt unbekannt
  }

  function zahl(v) {
    if (typeof v === "number") return v;
    var n = parseFloat(String(v === null || v === undefined ? "" : v).replace(",", "."));
    return isFinite(n) ? n : NaN;
  }

  function text(v) { return v === null || v === undefined ? "" : String(v).trim(); }

  /** Eine Zeile (JSON oder Excel, schon auf Schlüssel gemappt) in ein Klinikobjekt. */
  function normalisiereKlinik(r) {
    var k = {
      id: text(r.id), name: text(r.name), ort: text(r.ort),
      lat: zahl(r.lat), lon: zahl(r.lon),
      uni: jaNein(r.uni) === true,
      katheter: text(r.katheter),
      stand: text(r.stand), quelle: text(r.quelle), geprueft: text(r.geprueft), hinweis: text(r.hinweis)
    };
    FELDER.forEach(function (f) { k[f.key] = jaNein(r[f.key]); });
    k._zeiten = parseZeiten(k.katheter);
    return k;
  }

  function pruefeListe(kliniken) {
    var fehler = [], ids = {};
    kliniken.forEach(function (k, i) {
      var zeile = "Zeile " + (i + 2) + (k.name ? " (" + k.name + ")" : "");
      if (!k.id) fehler.push(zeile + ": Id fehlt");
      else if (ids[k.id]) fehler.push(zeile + ": Id doppelt");
      ids[k.id] = true;
      if (!k.name) fehler.push(zeile + ": Name fehlt");
      if (isNaN(k.lat) || isNaN(k.lon) || k.lat < 46 || k.lat > 56 || k.lon < 5 || k.lon > 16)
        fehler.push(zeile + ": Koordinaten fehlen oder liegen außerhalb Deutschlands");
      if (k._zeiten && k._zeiten.typ === "fehler") fehler.push(zeile + ": Katheterzeiten nicht lesbar (\"" + k.katheter + "\")");
    });
    return fehler;
  }

  var SPALTEN = {
    id: "id", name: "name", ort: "ort", breite: "lat", breitengrad: "lat", lat: "lat",
    laenge: "lon", laengengrad: "lon", lon: "lon", uni: "uni", universitaet: "uni",
    katheter: "katheter", katheterzeiten: "katheter", stand: "stand", quelle: "quelle",
    geprueftvon: "geprueft", geprueft: "geprueft", hinweis: "hinweis", bemerkung: "hinweis"
  };
  FELDER.forEach(function (f) { SPALTEN[norm(f.spalte).replace(/ /g, "")] = f.key; });
  SPALTEN.ecmoimpella = "ecmo_impella";
  SPALTEN.ecmo = "ecmo_impella";
  SPALTEN.schrittmachertemp = "schrittmacher_temp";
  SPALTEN.temporaererschrittmacher = "schrittmacher_temp";

  /** Tabelle aus Kopfzeile + Zeilen (z. B. aus Excel) in Klinikobjekte. */
  function klinikenAusTabelle(header, zeilen) {
    var map = header.map(function (h) { return SPALTEN[norm(h).replace(/ /g, "")] || null; });
    var objekte = [];
    zeilen.forEach(function (z) {
      var r = {}, leer = true;
      map.forEach(function (key, i) {
        if (key && z[i] !== undefined && z[i] !== null && String(z[i]).trim() !== "") { r[key] = z[i]; leer = false; }
      });
      if (!leer) objekte.push(normalisiereKlinik(r));
    });
    return objekte;
  }

  /** Ältester Stand der Liste und Alter in Tagen (null, wenn kein Datum lesbar). */
  function standDerListe(kliniken, heute) {
    var aeltest = null, ohne = 0;
    kliniken.forEach(function (k) {
      var d = /^\d{4}-\d{2}-\d{2}$/.test(k.stand) ? new Date(k.stand + "T12:00:00") : null;
      if (!d || isNaN(d)) { ohne++; return; }
      if (!aeltest || d < aeltest) aeltest = d;
    });
    var tage = aeltest ? Math.floor((heute - aeltest) / 86400000) : null;
    return { aeltest: aeltest ? ymd(aeltest) : null, tage: tage, ohneStand: ohne };
  }

  // --------------------------------------------------------------- Lückenanalyse

  /**
   * Für die Prüfansicht: je Haus der Status aller Felder (ja, nein, unbekannt), dazu die Fallprofile, die nur
   * wegen einer Lücke ausfallen (kein Feld belegt "nein", mindestens eines unbekannt). Das zeigt, welche
   * Rückfrage beim Haus sich lohnt. Die Katheterzeiten zählen als unbekannt, wenn sie fehlen oder unlesbar sind.
   */
  function luecken(kliniken, jetzt) {
    var spalten = [{ key: "katheter", label: "Herzkatheter" }].concat(FELDER.map(function (f) { return { key: f.key, label: f.label }; }));
    var proFeld = {}, proProfil = {};
    spalten.forEach(function (s) { proFeld[s.key] = 0; });
    PROFILE.forEach(function (p) { proProfil[p.id] = 0; });
    var zellenGesamt = 0, zellenUnbekannt = 0, geprueft = 0, mitLuecken = 0;

    var haeuser = kliniken.map(function (k) {
      var z = k._zeiten !== undefined ? k._zeiten : parseZeiten(k.katheter);
      var zellen = spalten.map(function (s) {
        var status, text = "";
        if (s.key === "katheter") {
          if (!z || z.typ === "fehler") { status = "unbekannt"; text = z ? "nicht lesbar: " + z.text : ""; }
          else if (z.typ === "keine") { status = "nein"; text = "kein Katheter"; }
          else { status = "ja"; text = z.text; }
        } else {
          var v = k[s.key];
          status = v === true ? "ja" : v === false ? "nein" : "unbekannt";
        }
        zellenGesamt++;
        if (status === "unbekannt") { zellenUnbekannt++; proFeld[s.key]++; }
        return { key: s.key, label: s.label, status: status, text: text };
      });
      var fehlend = zellen.filter(function (c) { return c.status === "unbekannt"; });
      var blockiert = [];
      PROFILE.forEach(function (p) {
        var e = pruefeKlinik(k, p.id, jetzt);
        var hatNein = e.gruende.some(function (g) { return g.status === "nein"; });
        if (!e.geeignet && e.hatUnbekannt && !hatNein) { blockiert.push(p.id); proProfil[p.id]++; }
      });
      var dat = /^\d{4}-\d{2}-\d{2}$/.test(k.stand) ? new Date(k.stand + "T12:00:00") : null;
      var tage = dat && !isNaN(dat) ? Math.floor((jetzt - dat) / 86400000) : null;
      if (k.geprueft) geprueft++;
      if (fehlend.length) mitLuecken++;
      return { klinik: k, zellen: zellen, fehlend: fehlend, blockiert: blockiert, tage: tage, geprueft: !!k.geprueft };
    });

    return {
      haeuser: haeuser, spalten: spalten, proFeld: proFeld, proProfil: proProfil,
      zusammenfassung: {
        haeuser: kliniken.length, mitLuecken: mitLuecken, geprueft: geprueft,
        zellenGesamt: zellenGesamt, zellenUnbekannt: zellenUnbekannt,
        anteilBekannt: zellenGesamt ? 1 - zellenUnbekannt / zellenGesamt : 0
      }
    };
  }

  return {
    FELDER: FELDER, PROFILE: PROFILE, ANFORDERUNG_LABEL: ANFORDERUNG_LABEL,
    profil: profil, feiertageBW: feiertageBW, istFeiertag: istFeiertag,
    parseZeiten: parseZeiten, katheterJetzt: katheterJetzt,
    pruefeKlinik: pruefeKlinik, bewerte: bewerte,
    haversineKm: haversineKm, schaetzeMinuten: schaetzeMinuten,
    bereinigeAdresse: bereinigeAdresse, parseAutobahn: parseAutobahn, sucheAnschlussstellen: sucheAnschlussstellen,
    normalisiereKlinik: normalisiereKlinik, pruefeListe: pruefeListe,
    klinikenAusTabelle: klinikenAusTabelle, standDerListe: standDerListe, luecken: luecken,
    ymd: ymd
  };
});
