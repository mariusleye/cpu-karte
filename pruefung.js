/*
 * CPU-Karte: Prüfansicht der Klinikliste. Zeigt je Haus, welche Angaben belegt sind und welche fehlen,
 * und welche Fallprofile nur wegen einer Lücke ausfallen. So sieht man bei der fachlichen Abnahme sofort,
 * wo eine Rückfrage beim Haus am meisten bringt. Die Ansicht speichert nichts und ändert nichts an der
 * Liste; Korrekturen gehören in die Pflege-Excel (siehe README). Rechenlogik: CPU.luecken in logic.js.
 */
(function () {
  "use strict";

  var C = window.CPU;
  var SVG = "http://www.w3.org/2000/svg";
  var ALT_TAGE = 90;

  var KURZ = {
    katheter: "Katheter", notaufnahme: "Notauf-nahme", cpu: "CPU", intensiv: "Inten-siv", beatmung: "Beatmung",
    herzchirurgie: "Herz-chirurgie", ecmo_impella: "ECMO / Impella", ttm: "TTM", ep: "EP", lyse: "Lyse", ct: "CT",
    schrittmacher_temp: "Schritt-macher"
  };

  var zustand = { suche: "", nurLuecken: true, nurUngeprueft: false, feld: null, profil: null, sort: "luecken", offen: {} };
  var ctx = null;

  function h() { return window.CPUDom.h.apply(null, arguments); }
  function leere(el) { window.CPUDom.leere(el); }

  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function datumDe(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "." + m[2] + "." + m[1] : iso || "ohne Stand";
  }

  function plural(n, eins, mehr) { return n + " " + (n === 1 ? eins : mehr); }

  // Quellenangaben enthalten Web-Adressen, durch Leerzeichen oder Semikolon getrennt. Nur http(s) wird zum Link.
  function linkifiziere(text) {
    var teile = String(text || "").split(/(https?:\/\/[^\s;,)]+)/g), out = [];
    teile.forEach(function (t, i) {
      if (i % 2 === 0) { if (t) out.push(t); return; }
      var url = t.replace(/[.]+$/, ""), rest = t.slice(url.length);
      var kurz = url.replace(/^https?:\/\/(www\.)?/, "");
      if (kurz.length > 46) kurz = kurz.slice(0, 44) + "…";
      out.push(h("a", { href: url, target: "_blank", rel: "noopener noreferrer", title: url }, kurz));
      if (rest) out.push(rest);
    });
    return out;
  }

  function kopieren(text, rueckmeldung) {
    function fertig(ok) { rueckmeldung(ok ? "In die Zwischenablage kopiert." : "Kopieren nicht möglich."); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { fertig(true); }, function () { fertig(false); });
      return;
    }
    var ta = h("textarea", { "aria-hidden": "true", style: "position:fixed;left:-9999px" });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    fertig(ok);
  }

  // ------------------------------------------------------------- Bausteine

  function donut(anteil) {
    var r = 36, u = 2 * Math.PI * r, prozent = Math.round(anteil * 100);
    var s = svgEl("svg", { viewBox: "0 0 92 92", class: "donut", role: "img", "aria-label": prozent + " Prozent der Angaben belegt" });
    s.appendChild(svgEl("circle", { cx: 46, cy: 46, r: r, class: "spur" }));
    s.appendChild(svgEl("circle", {
      cx: 46, cy: 46, r: r, class: "wert", "stroke-dasharray": (u * anteil).toFixed(1) + " " + u.toFixed(1), transform: "rotate(-90 46 46)"
    }));
    var t = svgEl("text", { x: 46, y: 52, "text-anchor": "middle", class: "donut-text" });
    t.textContent = prozent + " %";
    s.appendChild(t);
    return s;
  }

  function kachel(klasse, kopf, wert, unter, extra) {
    return h("div", { class: "kachel " + klasse }, extra || null,
      h("div", null, h("div", { class: "kachel-kopf" }, kopf), h("div", { class: "kachel-wert" }, wert), h("div", { class: "kachel-unter" }, unter)));
  }

  function zelle(z) {
    var zeichen = z.status === "ja" ? "✓" : z.status === "nein" ? "✗" : "?";
    var text = z.status === "ja" ? (z.key === "katheter" ? (z.text === "24/7" ? "24/7" : "Zeit") : zeichen) : zeichen;
    var beschr = z.label + ": " + (z.status === "ja" ? "ja" : z.status === "nein" ? "nein" : "unbekannt") + (z.key === "katheter" && z.text ? " (" + z.text + ")" : "");
    var td = h("td", { class: "z " + z.status });
    td.appendChild(h("span", { class: "glyph " + z.status, title: beschr, "aria-label": beschr }, text));
    return td;
  }

  // -------------------------------------------------------------- Filter

  function filtere(L) {
    var q = zustand.suche.trim().toLowerCase();
    var liste = L.haeuser.filter(function (x) {
      var k = x.klinik;
      if (q && (k.name + " " + k.ort).toLowerCase().indexOf(q) < 0) return false;
      if (zustand.nurLuecken && !x.fehlend.length) return false;
      if (zustand.nurUngeprueft && x.geprueft) return false;
      if (zustand.feld && !x.fehlend.some(function (c) { return c.key === zustand.feld; })) return false;
      if (zustand.profil && x.blockiert.indexOf(zustand.profil) < 0) return false;
      return true;
    });
    var hd = ctx.hd;
    function dist(x) { return hd ? C.haversineKm(hd.lat, hd.lon, x.klinik.lat, x.klinik.lon) : 0; }
    var sorter = {
      luecken: function (a, b) { return b.fehlend.length - a.fehlend.length || dist(a) - dist(b); },
      naehe: function (a, b) { return dist(a) - dist(b); },
      name: function (a, b) { return a.klinik.name.localeCompare(b.klinik.name, "de"); },
      stand: function (a, b) { return (b.tage === null ? 9999 : b.tage) - (a.tage === null ? 9999 : a.tage); }
    };
    return liste.sort(sorter[zustand.sort] || sorter.luecken);
  }

  function rueckfrageText(liste) {
    var label = {};
    C.PROFILE.forEach(function (p) { label[p.id] = p.label; });
    var zeilen = ["Rückfragen zur Klinikliste (CPU-Karte), erstellt am " + datumDe(heuteIso()), "Offene Angaben je Haus, die Fallprofile nur wegen der Lücke ausfallen lassen:", ""];
    liste.forEach(function (x) {
      if (!x.fehlend.length) return;
      zeilen.push("• " + x.klinik.name + ", " + x.klinik.ort);
      zeilen.push("  offen: " + x.fehlend.map(function (c) { return c.label + (c.key === "katheter" ? " (Zeiten)" : ""); }).join(", "));
      if (x.blockiert.length) zeilen.push("  betrifft: " + x.blockiert.map(function (id) { return label[id]; }).join(", "));
    });
    return zeilen.join("\n");
  }

  function heuteIso() {
    var d = ctx.jetzt;
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  // ----------------------------------------------------------- Tabelle

  function detailZeile(x, L, spalten) {
    var k = x.klinik, label = {};
    C.PROFILE.forEach(function (p) { label[p.id] = p.label; });
    return h("tr", { class: "detail" }, h("td", { colspan: spalten },
      h("div", { class: "detail-raster" },
        h("div", null, h("div", { class: "detail-kopf" }, "Quelle"), h("div", { class: "detail-text" }, k.quelle ? linkifiziere(k.quelle) : "Keine Quelle hinterlegt.")),
        h("div", null, h("div", { class: "detail-kopf" }, "Hinweis"), h("div", { class: "detail-text" }, k.hinweis || "Kein Hinweis.")),
        h("div", null,
          h("div", { class: "detail-kopf" }, "Offen"),
          h("div", { class: "detail-text" }, x.fehlend.length ? x.fehlend.map(function (c) { return c.label; }).join(", ") : "Nichts offen."),
          x.blockiert.length ? h("div", { class: "detail-kopf spaeter" }, "Fällt nur wegen der Lücke aus bei") : null,
          x.blockiert.length ? h("div", { class: "detail-text" }, x.blockiert.map(function (id) { return label[id]; }).join(", ")) : null),
        h("div", null,
          h("div", { class: "detail-kopf" }, "Stand und Prüfung"),
          h("div", { class: "detail-text" }, "Stand " + datumDe(k.stand) + (x.tage !== null ? " (vor " + plural(x.tage, "Tag", "Tagen") + ")" : "") + ". " +
            (k.geprueft ? "Geprüft von " + k.geprueft + "." : "Noch nicht ärztlich geprüft.")),
          x.fehlend.length ? h("button", { type: "button", class: "hell klein-knopf", onclick: function (ev) {
            kopieren(rueckfrageText([x]), function (t) { ev.target.textContent = t; });
          } }, "Rückfrage-Text kopieren") : null)
      )));
  }

  function tabelle(L) {
    var liste = filtere(L), anzahlSp = L.spalten.length + 5;
    var kopf = h("tr", null,
      h("th", { scope: "col", class: "haus" }, "Haus"),
      L.spalten.map(function (s) {
        var aktiv = zustand.feld === s.key, n = L.proFeld[s.key];
        return h("th", { scope: "col", class: "feld" + (aktiv ? " aktiv" : "") },
          h("button", { type: "button", class: "kopf-knopf", "aria-pressed": aktiv ? "true" : "false",
            title: s.label + ": bei " + plural(n, "Haus", "Häusern") + " unbekannt. Klicken, um nur diese Häuser zu zeigen.",
            onclick: function () { zustand.feld = aktiv ? null : s.key; neuZeichnen(L); } },
            h("span", { class: "kurz" }, KURZ[s.key].replace("-", "­")),
            h("span", { class: "n" + (n ? "" : " null") }, String(n))));
      }),
      h("th", { scope: "col", class: "lueckencol" }, "Lücken"),
      h("th", { scope: "col" }, "Stand"),
      h("th", { scope: "col" }, "Geprüft"));

    var body = h("tbody", null);
    liste.forEach(function (x) {
      var k = x.klinik, offen = !!zustand.offen[k.id];
      var tr = h("tr", { class: "haus-zeile" + (offen ? " offen" : "") + (x.fehlend.length ? "" : " voll") },
        h("th", { scope: "row", class: "haus" },
          h("button", { type: "button", class: "haus-knopf", "aria-expanded": offen ? "true" : "false", onclick: function () {
            if (zustand.offen[k.id]) delete zustand.offen[k.id]; else zustand.offen[k.id] = true;
            neuZeichnen(L);
          } },
            h("span", { class: "pfeil", "aria-hidden": "true" }, "▸"),
            h("span", null, h("span", { class: "hname" }, k.name), h("span", { class: "hort" }, k.ort + (k.uni ? " · Uniklinikum" : ""))))),
        x.zellen.map(zelle),
        h("td", { class: "lueckencol" },
          h("span", { class: "meter", title: x.fehlend.length + " von " + x.zellen.length + " Angaben fehlen" },
            h("i", { style: "width:" + Math.round(x.fehlend.length / x.zellen.length * 100) + "%" })),
          h("span", { class: "meterzahl" }, x.fehlend.length ? String(x.fehlend.length) : "–")),
        h("td", { class: "stand-zelle" + (x.tage === null || x.tage > ALT_TAGE ? " alt" : "") },
          x.tage === null ? "ohne" : x.tage === 0 ? "heute" : x.tage + " T", h("span", { class: "sr" }, " (" + datumDe(k.stand) + ")")),
        h("td", { class: "geprueft-zelle" + (x.geprueft ? " ok" : "") }, x.geprueft ? "✓" : "–", x.geprueft ? h("span", { class: "sr" }, " " + k.geprueft) : null));
      body.appendChild(tr);
      if (offen) body.appendChild(detailZeile(x, L, anzahlSp));
    });
    if (!liste.length) body.appendChild(h("tr", null, h("td", { colspan: anzahlSp, class: "leer-tabelle" }, "Kein Haus passt zu diesen Filtern.")));

    return { liste: liste, node: h("table", { class: "matrix" }, h("caption", { class: "sr" }, "Angaben je Haus: ja, nein oder unbekannt"), h("thead", null, kopf), body) };
  }

  function chip(text, aktiv, onclick) {
    return h("button", { type: "button", class: "chip" + (aktiv ? " an" : ""), "aria-pressed": aktiv ? "true" : "false", onclick: onclick }, text);
  }

  var tabellenBox = null, filterBox = null, meldungBox = null, LAKTUELL = null;

  function neuZeichnen(L) {
    LAKTUELL = L;
    zeichneFilter(L);
    zeichneTabelle(L);
  }

  function zeichneFilter(L) {
    var fokus = document.activeElement && document.activeElement.id === "pruefSuche";
    var pos = fokus ? document.activeElement.selectionStart : 0;
    leere(filterBox);
    var suche = h("input", { id: "pruefSuche", type: "search", placeholder: "Haus oder Ort suchen", "aria-label": "Haus oder Ort suchen", value: zustand.suche, autocomplete: "off" });
    suche.addEventListener("input", function () { zustand.suche = suche.value; zeichneTabelle(LAKTUELL); });
    var sort = h("select", { "aria-label": "Sortierung", onchange: function (ev) { zustand.sort = ev.target.value; zeichneTabelle(LAKTUELL); } },
      [["luecken", "Meiste Lücken zuerst"], ["naehe", "Nähe zu Heidelberg"], ["name", "Name A bis Z"], ["stand", "Ältester Stand zuerst"]].map(function (o) {
        return h("option", { value: o[0], selected: zustand.sort === o[0] }, o[1]);
      }));
    filterBox.appendChild(h("div", { class: "filterzeile" },
      suche, sort,
      chip("Nur mit Lücken", zustand.nurLuecken, function () { zustand.nurLuecken = !zustand.nurLuecken; neuZeichnen(L); }),
      chip("Noch nicht geprüft", zustand.nurUngeprueft, function () { zustand.nurUngeprueft = !zustand.nurUngeprueft; neuZeichnen(L); }),
      zustand.feld || zustand.profil ? h("button", { type: "button", class: "chip loeschen", onclick: function () { zustand.feld = null; zustand.profil = null; neuZeichnen(L); } },
        "Auswahl aufheben ✕") : null));
    if (fokus) { var s = document.getElementById("pruefSuche"); s.focus(); try { s.setSelectionRange(pos, pos); } catch (e) { /* egal */ } }
  }

  function zeichneTabelle(L) {
    var t = tabelle(L);
    leere(tabellenBox);
    var rahmen = h("div", { class: "tabellenrahmen" }, t.node);
    tabellenBox.appendChild(rahmen);
    var mitLuecken = t.liste.filter(function (x) { return x.fehlend.length; }).length;
    leere(meldungBox);
    meldungBox.appendChild(h("span", { class: "anzahl" }, plural(t.liste.length, "Haus", "Häuser") + " von " + L.zusammenfassung.haeuser));
    var auswahl = [];
    if (zustand.feld) auswahl.push("Feld " + L.spalten.filter(function (s) { return s.key === zustand.feld; })[0].label);
    if (zustand.profil) auswahl.push("Profil " + C.profil(zustand.profil).label);
    if (auswahl.length) meldungBox.appendChild(h("span", { class: "auswahl" }, auswahl.join(", ")));
    if (mitLuecken) {
      meldungBox.appendChild(h("button", { type: "button", class: "hell klein-knopf", onclick: function (ev) {
        kopieren(rueckfrageText(t.liste), function (txt) { ev.target.textContent = txt; });
      } }, "Rückfrageliste kopieren (" + mitLuecken + ")"));
    }
  }

  // ------------------------------------------------------------- Aufbau

  function profilBalken(L) {
    var gesamt = L.zusammenfassung.haeuser || 1;
    var eintraege = C.PROFILE.map(function (p) { return { id: p.id, label: p.label, n: L.proProfil[p.id] }; })
      .sort(function (a, b) { return b.n - a.n; });
    var maxN = Math.max.apply(null, eintraege.map(function (e) { return e.n; }).concat([1]));
    var liste = h("div", { class: "pbalken" });
    eintraege.forEach(function (e) {
      var aktiv = zustand.profil === e.id;
      liste.appendChild(h("button", {
        type: "button", class: "pzeile" + (aktiv ? " aktiv" : "") + (e.n ? "" : " null"), "aria-pressed": aktiv ? "true" : "false", disabled: e.n === 0,
        title: e.n + " von " + gesamt + " Häusern fallen für dieses Profil nur wegen unbekannter Angaben aus.",
        onclick: function () { zustand.profil = aktiv ? null : e.id; neuZeichnen(LAKTUELL); }
      },
        h("span", { class: "pname" }, e.label),
        h("span", { class: "pspur" }, h("i", { style: "width:" + Math.round(e.n / maxN * 100) + "%" })),
        h("span", { class: "pzahl" }, String(e.n))));
    });
    return liste;
  }

  function render(box, liste, opts) {
    ctx = { jetzt: (opts && opts.jetzt) || new Date(), hd: (opts && opts.hd) || null };
    var L = C.luecken(liste, ctx.jetzt);
    var z = L.zusammenfassung;
    var aeltest = L.haeuser.reduce(function (m, x) { return x.tage === null ? m : Math.max(m, x.tage); }, -1);
    var ohneStand = L.haeuser.filter(function (x) { return x.tage === null; }).length;
    leere(box);

    box.appendChild(h("div", { class: "pruef-kopf" },
      h("div", null,
        h("h2", null, "Listenprüfung"),
        h("p", { class: "klein" }, "Gelb heißt: Angabe fehlt, die App behandelt sie wie „nein“. Hier wird nichts gespeichert oder verändert; Korrekturen gehören in die Pflege-Excel (README, Abschnitt Klinikliste pflegen).")),
      h("div", { class: "pruef-stand" }, "Liste: " + plural(z.haeuser, "Haus", "Häuser"))));

    box.appendChild(h("div", { class: "kacheln" },
      kachel("k-belegt", "Angaben belegt", z.zellenUnbekannt + " offen", "von " + z.zellenGesamt + " Feldern", donut(z.anteilBekannt)),
      kachel(z.mitLuecken ? "k-warn" : "k-ok", "Häuser mit Lücken", z.mitLuecken + " von " + z.haeuser, z.mitLuecken ? "mindestens eine Angabe fehlt" : "alles belegt"),
      kachel(z.geprueft === z.haeuser ? "k-ok" : "k-warn", "Ärztlich geprüft", z.geprueft + " von " + z.haeuser, z.geprueft ? "Spalte „Geprüft von“ gefüllt" : "Spalte „Geprüft von“ ist überall leer"),
      kachel(aeltest > ALT_TAGE || ohneStand ? "k-bad" : "k-ok", "Ältester Stand", aeltest < 0 ? "unbekannt" : aeltest === 0 ? "heute" : "vor " + plural(aeltest, "Tag", "Tagen"),
        ohneStand ? plural(ohneStand, "Eintrag", "Einträge") + " ohne Datum" : "Warnung nach " + ALT_TAGE + " Tagen")));

    box.appendChild(h("section", { class: "block pruef-block" },
      h("h3", null, "Wo sich eine Rückfrage lohnt"),
      h("p", { class: "klein" }, "Zahl der Häuser, die für ein Profil nur wegen unbekannter Angaben ausfallen (kein Feld ist ein klares „nein“). Klick filtert die Tabelle."),
      profilBalken(L)));

    filterBox = h("div", { class: "pruef-filter" });
    meldungBox = h("div", { class: "pruef-meldung", "aria-live": "polite" });
    tabellenBox = h("div", { class: "pruef-tabelle" });
    box.appendChild(h("section", { class: "block pruef-block" },
      h("h3", null, "Alle Häuser"),
      filterBox, meldungBox, tabellenBox,
      h("p", { class: "klein legende-zeile" },
        h("span", { class: "glyph mini ja" }, "✓"), " ja  ",
        h("span", { class: "glyph mini nein" }, "✗"), " nein  ",
        h("span", { class: "glyph mini unbekannt" }, "?"), " unbekannt, zählt wie nein. Zahl in der Spaltenüberschrift: Häuser, bei denen das Feld fehlt. Klick auf eine Überschrift oder ein Haus öffnet Filter und Quellen.")));
    LAKTUELL = L;
    neuZeichnen(L);
  }

  window.Pruefung = {
    render: render,
    anzahlMitLuecken: function (liste, jetzt) { return C.luecken(liste, jetzt || new Date()).zusammenfassung.mitLuecken; }
  };
})();
