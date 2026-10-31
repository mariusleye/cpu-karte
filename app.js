/* CPU-Karte: Oberfläche. Rechenlogik steht in logic.js und ist ohne Browser getestet. */
(function () {
  "use strict";

  var C = window.CPU;
  var APP_VERSION = "0.3.0";
  var HD_ID = "ukhd";
  var HD_RADIUS_KM = 130;
  var OSRM = "https://router.project-osrm.org";
  var NOMINATIM = "https://nominatim.openstreetmap.org/search";
  var LS_KEY = "cpu.klinikliste.v1";
  var TIMEOUT_MS = 8000;

  var state = {
    kliniken: [],
    listeQuelle: "standard",
    listeName: "",
    anschlussstellen: [],
    standort: null,
    profilId: null,
    schwelleX: 10,
    jetztOverride: null,
    minuten: {},
    minutenQuelle: null,
    laedt: false,
    ausgewaehlt: null,
    anfrage: 0,
    routen: false,
    routenToken: 0,
    ansicht: "karte"
  };
  var routenCache = {};

  var map, markerLayer, standortMarker, routeLayer;

  // ------------------------------------------------------------------ Helfer

  function $(id) { return document.getElementById(id); }

  function h(tag, attrs) {
    var el = document.createElement(tag), kinder = Array.prototype.slice.call(arguments, 2);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") el.className = attrs[k];
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] !== null && attrs[k] !== undefined) el.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (function anhaengen(liste) {
      for (var i = 0; i < liste.length; i++) {
        var k = liste[i];
        if (k === null || k === undefined || k === false) continue;
        if (Array.isArray(k)) anhaengen(k);
        else el.appendChild(typeof k === "string" || typeof k === "number" ? document.createTextNode(String(k)) : k);
      }
    })(kinder);
    return el;
  }

  function leere(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  window.CPUDom = { h: h, leere: leere };

  function datumDe(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "." + m[2] + "." + m[1] : iso;
  }

  function minutenText(min) { return Math.round(min) + " Min"; }
  function vorzeichen(n) {
    var r = Math.round(n);
    return (r > 0 ? "+" : r < 0 ? "−" : "±") + Math.abs(r) + " Min";
  }

  function fetchMitTimeout(url, ms) {
    var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, ms);
    return fetch(url, { signal: ctrl.signal, credentials: "omit", referrerPolicy: "origin" })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); },
        function (e) { clearTimeout(t); throw e; });
  }

  // --------------------------------------------------------------- Meldungen

  var meldungen = {};
  function meldung(key, text, typ) {
    if (!text) delete meldungen[key]; else meldungen[key] = { text: text, typ: typ || "gelb" };
    var box = $("meldungen");
    leere(box);
    Object.keys(meldungen).forEach(function (k) {
      box.appendChild(h("div", { class: "meldung " + meldungen[k].typ, role: "alert", "data-key": k }, meldungen[k].text));
    });
  }

  // --------------------------------------------------------------- Klinikliste

  function normalisiereAlle(roh) { return roh.map(C.normalisiereKlinik); }

  function ladeStandardliste() {
    return fetchMitTimeout("data/kliniken.json", TIMEOUT_MS).then(function (d) {
      var liste = normalisiereAlle(d.kliniken || []);
      var fehler = C.pruefeListe(liste);
      if (fehler.length) throw new Error("Standardliste fehlerhaft: " + fehler.slice(0, 3).join("; "));
      return liste;
    });
  }

  function speichereLokal(liste, name) {
    try {
      var roh = liste.map(function (k) { var c = Object.assign({}, k); delete c._zeiten; return c; });
      localStorage.setItem(LS_KEY, JSON.stringify({ name: name, kliniken: roh }));
    } catch (e) { /* Speicher gesperrt: Liste gilt nur für diese Sitzung */ }
  }

  function leseLokal() {
    try {
      var s = localStorage.getItem(LS_KEY);
      if (!s) return null;
      var d = JSON.parse(s);
      var liste = normalisiereAlle(d.kliniken || []);
      return C.pruefeListe(liste).length ? null : { name: d.name || "eigene Liste", liste: liste };
    } catch (e) { return null; }
  }

  function setzeListe(liste, quelle, name) {
    state.kliniken = liste;
    state.listeQuelle = quelle;
    state.listeName = name || "";
    var s = C.standDerListe(liste, new Date());
    var el = $("standAnzeige");
    el.className = "stand" + (s.tage !== null && s.tage > 90 || s.ohneStand ? " alt" : "");
    var t = "Klinikliste: Stand " + (s.aeltest ? datumDe(s.aeltest) : "unbekannt");
    if (quelle === "lokal") t += " (eigene Datei)";
    if (s.tage !== null && s.tage > 90) t += ", älter als 90 Tage";
    if (s.ohneStand) t += ", " + s.ohneStand + " Einträge ohne Stand";
    el.textContent = t;
    $("listeHinweis").textContent = quelle === "lokal"
      ? "Geladen aus " + name + ", nur in diesem Browser gespeichert."
      : "Standardliste aus der App (" + liste.length + " Häuser).";
    $("standardListe").hidden = quelle !== "lokal";
    aktualisiereLueckenZaehler();
    if (state.ansicht === "pruefung") zeichnePruefung();
  }

  function aktualisiereLueckenZaehler() {
    var n = Pruefung.anzahlMitLuecken(state.kliniken, jetzt());
    var z = $("lueckenZaehler");
    z.hidden = !n;
    z.textContent = String(n);
    z.title = n + (n === 1 ? " Haus hat" : " Häuser haben") + " unbekannte Angaben";
  }

  // ---------------------------------------------------------------- Ansichten

  function zeichnePruefung() {
    Pruefung.render($("ansichtPruefung"), state.kliniken, { jetzt: jetzt(), hd: hdKlinik() });
  }

  function zeigeAnsicht(name, hashSetzen) {
    state.ansicht = name === "pruefung" ? "pruefung" : "karte";
    var pruef = state.ansicht === "pruefung";
    $("ansichtKarte").hidden = pruef;
    $("ansichtPruefung").hidden = !pruef;
    $("navKarte").setAttribute("aria-current", pruef ? "false" : "page");
    $("navPruefung").setAttribute("aria-current", pruef ? "page" : "false");
    if (hashSetzen && history.replaceState) {
      history.replaceState(null, "", pruef ? "#pruefung" : location.pathname + location.search);
    }
    if (pruef) zeichnePruefung();
    else if (map) setTimeout(function () { map.invalidateSize(); }, 0);
  }

  function dateiGewaehlt(file) {
    XlsxLesen.lies(file).then(function (t) {
      var liste = C.klinikenAusTabelle(t.header, t.zeilen);
      var fehler = C.pruefeListe(liste);
      if (!liste.some(function (k) { return k.id === HD_ID; })) fehler.push("Das Vergleichsziel mit der Id \"ukhd\" fehlt.");
      if (fehler.length) {
        meldung("liste", "Klinikliste nicht geladen: " + fehler.slice(0, 4).join("; ") + (fehler.length > 4 ? " ..." : ""), "rot");
        return;
      }
      meldung("liste", null);
      setzeListe(liste, "lokal", file.name);
      speichereLokal(liste, file.name);
      neueFahrzeitenOderRender();
    }).catch(function (e) { meldung("liste", "Datei nicht lesbar: " + e.message, "rot"); });
  }

  function standardWiederherstellen() {
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* egal */ }
    ladeStandardliste().then(function (l) {
      meldung("liste", null);
      setzeListe(l, "standard");
      neueFahrzeitenOderRender();
    }).catch(function (e) { meldung("liste", "Standardliste nicht ladbar: " + e.message, "rot"); });
  }

  // ------------------------------------------------------------------- Karte

  function initKarte() {
    map = L.map("karte", { zoomControl: true }).setView([49.4, 8.67], 9);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: "© OpenStreetMap-Mitwirkende"
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    map.on("click", function (e) {
      setStandort(e.latlng.lat, e.latlng.lng, "Punkt auf der Karte");
    });
  }

  function icon(klasse, text, extra) {
    return L.divIcon({
      className: "cpu-marker",
      html: "<i class=\"punkt " + klasse + "\">" + (text || "") + "</i>",
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
  }

  // ---------------------------------------------------------------- Standort

  function zeigeTreffer(items) {
    var box = $("trefferListe");
    leere(box);
    items.forEach(function (it) {
      box.appendChild(h("button", { type: "button", role: "option", onclick: function () {
        leere(box);
        setStandort(it.lat, it.lon, it.label);
      } }, it.label));
    });
    if (items.length) box.firstChild.focus();
  }

  function setStandort(lat, lon, label) {
    leere($("trefferListe"));
    state.standort = { lat: lat, lon: lon, label: label };
    state.ausgewaehlt = null;
    state.routenToken++;
    routeLayer.clearLayers();
    if (standortMarker) map.removeLayer(standortMarker);
    standortMarker = L.marker([lat, lon], { icon: icon("standort", "S"), keyboard: false, title: "Standort" }).addTo(map);
    var a = $("standortAnzeige");
    leere(a);
    a.appendChild(h("span", null, "Standort: ", h("strong", null, label)));
    var abstand = C.haversineKm(lat, lon, hdKlinik() ? hdKlinik().lat : 49.417, hdKlinik() ? hdKlinik().lon : 8.671);
    meldung("gebiet", abstand > HD_RADIUS_KM
      ? "Der Standort liegt " + Math.round(abstand) + " km von Heidelberg entfernt, außerhalb des hinterlegten Einzugsgebiets. Die Klinikliste deckt ihn womöglich nicht ab."
      : null);
    fitte();
    holeFahrzeiten();
  }

  function hdKlinik() {
    for (var i = 0; i < state.kliniken.length; i++) if (state.kliniken[i].id === HD_ID) return state.kliniken[i];
    return null;
  }

  function fitte() {
    var pts = [[state.standort.lat, state.standort.lon]];
    var hd = hdKlinik();
    if (hd) pts.push([hd.lat, hd.lon]);
    map.fitBounds(L.latLngBounds(pts).pad(0.6), { maxZoom: 11 });
  }

  function sucheStandort(eingabe) {
    var text = eingabe.trim();
    if (!text) return;
    leere($("trefferListe"));
    var ab = C.sucheAnschlussstellen(state.anschlussstellen, text);
    if (ab) {
      if (!ab.treffer.length) { meldung("standort", "Keine Anschlussstelle \"" + text + "\" in den hinterlegten Autobahnen gefunden.", "gelb"); return; }
      meldung("standort", ab.km !== null
        ? "Kilometerangaben werden nicht ausgewertet, weil die Kartendaten keine Kilometrierung enthalten. Bitte die nächste Anschlussstelle wählen oder einen Punkt auf der Karte anklicken."
        : null, "gelb");
      zeigeTreffer(ab.treffer.map(function (a) {
        var art = a.typ === "AK" ? "Kreuz" : a.typ === "AD" ? "Dreieck" : "AS";
        return { lat: a.lat, lon: a.lon, label: a.autobahn + (a.ref ? " · Nr. " + a.ref : "") + " · " + a.name + (a.typ === "AS" ? "" : " (" + art + ")") };
      }));
      return;
    }
    var b = C.bereinigeAdresse(text);
    if (!b.query) return;
    meldung("standort", b.hausnummerEntfernt
      ? "Hausnummer wurde entfernt. Gesucht wird nur \"" + b.query + "\". Den genauen Punkt bei Bedarf auf der Karte anklicken."
      : null, "gelb");
    var btn = $("suchenKnopf");
    btn.disabled = true;
    var url = NOMINATIM + "?format=jsonv2&limit=5&countrycodes=de&accept-language=de&viewbox=7.2,50.4,10.0,48.6&q=" + encodeURIComponent(b.query);
    fetchMitTimeout(url, TIMEOUT_MS).then(function (res) {
      btn.disabled = false;
      if (!res.length) { meldung("standort", "Kein Treffer für \"" + b.query + "\". Anders schreiben oder auf der Karte anklicken.", "gelb"); return; }
      var items = [];
      res.forEach(function (r) {
        var it = { lat: +r.lat, lon: +r.lon, label: r.display_name.split(",").slice(0, 4).join(",").trim() };
        // gleicher Name und weniger als 1,5 km Abstand: derselbe Ort, nicht doppelt anbieten
        var doppelt = items.some(function (o) { return o.label === it.label && C.haversineKm(o.lat, o.lon, it.lat, it.lon) < 1.5; });
        if (!doppelt) items.push(it);
      });
      if (items.length === 1) setStandort(items[0].lat, items[0].lon, items[0].label);
      else zeigeTreffer(items);
    }).catch(function () {
      btn.disabled = false;
      meldung("standort", "Die Adresssuche ist nicht erreichbar. Bitte einen Punkt auf der Karte anklicken.", "gelb");
    });
  }

  // ---------------------------------------------------------------- Fahrzeiten

  function neueFahrzeitenOderRender() { if (state.standort) holeFahrzeiten(); else render(); }

  function schaetzung() {
    var m = {};
    state.kliniken.forEach(function (k) {
      m[k.id] = C.schaetzeMinuten(C.haversineKm(state.standort.lat, state.standort.lon, k.lat, k.lon));
    });
    return m;
  }

  function holeFahrzeiten() {
    var nr = ++state.anfrage, s = state.standort, ks = state.kliniken;
    state.laedt = true;
    render();
    var koords = [s.lon + "," + s.lat].concat(ks.map(function (k) { return k.lon + "," + k.lat; })).join(";");
    var url = OSRM + "/table/v1/driving/" + koords + "?sources=0&annotations=duration";
    fetchMitTimeout(url, TIMEOUT_MS).then(function (d) {
      if (nr !== state.anfrage) return;
      if (d.code !== "Ok" || !d.durations || !d.durations[0]) throw new Error(d.code || "Antwort ohne Fahrzeiten");
      var m = {};
      ks.forEach(function (k, i) {
        var sec = d.durations[0][i + 1];
        m[k.id] = typeof sec === "number" ? sec / 60 : null;
      });
      state.minuten = m;
      state.minutenQuelle = "osrm";
      state.laedt = false;
      state.fitNachRender = true;
      meldung("routing", null);
      render();
    }).catch(function () {
      if (nr !== state.anfrage) return;
      state.minuten = schaetzung();
      state.minutenQuelle = "schaetzung";
      state.laedt = false;
      state.fitNachRender = true;
      meldung("routing", "Routingdienst nicht erreichbar. Alle Fahrzeiten sind Schätzungen aus der Luftlinie (Faktor 1,3, 55 km/h) und mit ~ gekennzeichnet.", "gelb");
      render();
    });
  }

  // Routen: nur wenn der Schalter an ist (Standard aus). Gezeichnet werden UKHD und alle angezeigten
  // Alternativen, das gewählte Haus zusätzlich. Die Geometrien bleiben je Standort im Speicher, damit
  // ein Profilwechsel keine neuen Anfragen auslöst.
  function holeRoute(k) {
    var s = state.standort, key = s.lat + "," + s.lon + ">" + k.id;
    if (routenCache[key]) return Promise.resolve(routenCache[key]);
    if (state.minutenQuelle !== "osrm") return Promise.resolve({ luftlinie: true });
    var url = OSRM + "/route/v1/driving/" + s.lon + "," + s.lat + ";" + k.lon + "," + k.lat + "?overview=full&geometries=geojson";
    return fetchMitTimeout(url, TIMEOUT_MS).then(function (d) {
      if (d.code !== "Ok" || !d.routes || !d.routes.length) throw new Error("keine Route");
      var r = { geometry: d.routes[0].geometry };
      routenCache[key] = r;
      return r;
    }).catch(function () { return { luftlinie: true }; });
  }

  function zeichneRouten(ziele) {
    var token = ++state.routenToken;
    routeLayer.clearLayers();
    if (!state.routen || !state.standort || !ziele) return;
    var von = [state.standort.lat, state.standort.lon];
    ziele.forEach(function (z) {
      var dunkel = window.CPUTheme && window.CPUTheme.aktuell() === "dunkel";
      var k = z.klinik, farbe = z.referenz ? (dunkel ? "#7CC4F5" : "#033861") : (dunkel ? "#4ADE80" : "#1a7f4b"), gewaehlt = state.ausgewaehlt === k.id;
      holeRoute(k).then(function (r) {
        if (token !== state.routenToken) return;
        var stil = { color: farbe, weight: gewaehlt ? 8 : 5, opacity: gewaehlt ? .95 : .7 };
        if (r.geometry) L.geoJSON(r.geometry, { style: stil }).addTo(routeLayer);
        else L.polyline([von, [k.lat, k.lon]], Object.assign({ dashArray: "6 8" }, stil)).addTo(routeLayer);
      });
    });
  }

  function aktuelleRoutenziele() {
    if (!state.standort || !state.profilId || state.laedt || !hdKlinik()) return null;
    var r = C.bewerte({ kliniken: state.kliniken, profilId: state.profilId, jetzt: jetzt(), minuten: state.minuten, hdId: HD_ID, schwelleX: state.schwelleX });
    var ziele = r.liste.filter(function (e) { return e.kategorie === "referenz" || e.kategorie === "alternative"; });
    if (state.ausgewaehlt && !ziele.some(function (e) { return e.klinik.id === state.ausgewaehlt; })) {
      r.liste.forEach(function (e) { if (e.klinik.id === state.ausgewaehlt) ziele.push(e); });
    }
    return ziele;
  }

  function aktualisiereRoutenKnopf() {
    $("routenKnopf").setAttribute("aria-pressed", state.routen ? "true" : "false");
    $("legendeRouten").hidden = !state.routen;
  }

  function schalteRouten() {
    state.routen = !state.routen;
    aktualisiereRoutenKnopf();
    zeichneRouten(aktuelleRoutenziele());
  }

  // --------------------------------------------------------------- Darstellung

  var KAT_KLASSE = { referenz: "referenz", alternative: "alternative", zu_weit: "weit", ohne_fahrzeit: "weit", nicht_geeignet: "aus" };

  function jetzt() { return state.jetztOverride || new Date(); }

  // Fahrzeitbalken: Länge = Fahrzeit im Verhältnis zur längsten angezeigten, Strich = Fahrzeit nach UKHD.
  function fahrzeitBalken(e, skala, hdMin) {
    if (e.minuten === null || !skala) return null;
    var fuell = h("i", { class: "fuell" });
    fuell.style.width = Math.max(4, Math.min(100, e.minuten / skala * 100)) + "%";
    var balken = h("div", { class: "balken", "aria-hidden": "true" }, fuell);
    if (!e.referenz && hdMin !== null) {
      var strich = h("u", { class: "hdstrich", title: "Fahrzeit nach UKHD" });
      strich.style.left = Math.min(100, hdMin / skala * 100) + "%";
      balken.appendChild(strich);
    }
    return balken;
  }

  function ergebnisKarte(e, rang, skala, hdMin, nr) {
    var k = e.klinik, kat = e.kategorie;
    var istSchaetzung = state.minutenQuelle === "schaetzung";
    var zahlen = [];
    if (e.minuten !== null) {
      zahlen.push(h("b", null, (istSchaetzung ? "~" : "") + minutenText(e.minuten)));
      zahlen.push(" " + (istSchaetzung ? "Schätzung" : "Richtwert Pkw"));
      if (!e.referenz && e.mehrzeit !== null) {
        zahlen.push(" · ");
        zahlen.push(h("span", { class: "mehr " + (e.mehrzeit <= 0 ? "minus" : "plus") }, vorzeichen(e.mehrzeit) + " gegenüber UKHD"));
      }
    } else zahlen.push("keine Fahrzeit berechenbar");

    var marken = e.eignung.gruende.map(function (g) {
      var zeichen = g.status === "ok" ? "✓ " : g.status === "nein" ? "✗ " : "? ";
      return h("span", { class: "marke " + g.status, title: g.text }, zeichen + g.label + (g.status === "unbekannt" ? " unbekannt" : ""));
    });

    var gruende = e.eignung.gruende.map(function (g) { return h("li", null, g.text); });
    if (e.distanzOk === false) gruende.push(h("li", null, "Mehrzeit " + vorzeichen(e.mehrzeit) + ", mehr als " + state.schwelleX + " Min gegenüber UKHD"));
    if (e.minuten === null && !e.referenz) gruende.push(h("li", null, "Keine Fahrzeit berechenbar"));
    var meta = [];
    if (k.stand) meta.push("Stand " + datumDe(k.stand));
    if (k.quelle) meta.push("Quelle: " + k.quelle);
    if (k.geprueft) meta.push("Geprüft von " + k.geprueft); else meta.push("Nicht ärztlich geprüft");
    if (k.hinweis) meta.push("Hinweis: " + k.hinweis);

    var card = h("div", {
      class: "karte " + kat + (state.ausgewaehlt === k.id ? " gewaehlt" : ""), tabindex: "0", "data-id": k.id,
      onclick: function (ev) { if (ev.target.closest && ev.target.closest("details")) return; waehle(k.id); },
      onkeydown: function (ev) { if ((ev.key === "Enter" || ev.key === " ") && ev.target === card) { ev.preventDefault(); waehle(k.id); } }
    },
      h("div", { class: "name" }, (kat === "alternative" ? rang + ". " : "") + k.name),
      h("div", { class: "ort" }, k.ort + (e.referenz ? " · Vergleichsziel" : "") + (k.uni && !e.referenz ? " · Universitätsklinikum" : "")),
      h("div", { class: "zahlen" }, zahlen),
      fahrzeitBalken(e, skala, hdMin),
      e.referenz ? h("div", { class: "alles" }, "Kann alle Profile jederzeit aufnehmen") : h("div", { class: "marken" }, marken),
      h("details", null,
        h("summary", null, kat === "nicht_geeignet" ? "Warum nicht geeignet" : "Details"),
        h("ul", null, gruende),
        h("p", { class: "klein" }, meta.join(" · ")))
    );
    card.style.setProperty("--i", String(nr || 0));
    return card;
  }

  // Schritte, solange noch kein Ergebnis möglich ist: zeigt, was als Nächstes fehlt.
  function leerHinweis() {
    function schritt(nr, text, fertig) {
      return h("li", { class: "schritt" + (fertig ? " fertig" : "") },
        h("span", { class: "nr", "aria-hidden": "true" }, fertig ? "✓" : String(nr)), h("span", null, text));
    }
    return h("div", { class: "leer" },
      h("ol", { class: "schritte" },
        schritt(1, "Standort des Rettungsdienstes eingeben oder auf der Karte anklicken", !!state.standort),
        schritt(2, "Fallprofil wählen", !!state.profilId)),
      h("p", { class: "klein" }, "Danach erscheinen UKHD als Vergleich und alle nach Liste geeigneten Häuser in ähnlicher Entfernung."));
  }

  function platzhalter() {
    var box = h("div", { class: "skelette", "aria-hidden": "true" });
    for (var i = 0; i < 3; i++) box.appendChild(h("div", { class: "skelett" }, h("i"), h("i"), h("i")));
    return box;
  }

  function render() {
    var box = $("ergebnis");
    leere(box);
    markerLayer.clearLayers();

    if (!state.standort) {
      box.appendChild(leerHinweis());
      zeichneNeutral();
      return;
    }
    if (state.laedt) {
      box.appendChild(h("p", { class: "laedt" }, "Fahrzeiten werden berechnet …"));
      box.appendChild(platzhalter());
      zeichneRouten(null);
      zeichneNeutral();
      return;
    }
    if (!state.profilId) {
      box.appendChild(leerHinweis());
      zeichneRouten(null);
      zeichneNeutral();
      return;
    }
    var hd = hdKlinik();
    if (!hd) { box.appendChild(h("p", null, "In der Klinikliste fehlt das Vergleichsziel (Id ukhd).")); return; }

    var r = C.bewerte({ kliniken: state.kliniken, profilId: state.profilId, jetzt: jetzt(), minuten: state.minuten, hdId: HD_ID, schwelleX: state.schwelleX });
    var n = r.alternativen.length;
    var nahUnbekannt = r.liste.filter(function (e) { return e.kategorie === "nicht_geeignet" && e.eignung.hatUnbekannt && e.distanzOk === true; }).length;

    box.appendChild(h("div", { class: "kopfzeile " + (r.keineAlternative ? "keine" : "gut") },
      h("span", { class: "grosszahl", "aria-hidden": "true" }, r.keineAlternative ? "H" : String(n)),
      h("div", null,
        h("div", { class: "kopf-titel" }, r.keineAlternative
          ? "In der Liste keine geeignete Alternative, UKHD."
          : n + (n === 1 ? " Haus" : " Häuser") + " nach Liste geeignet"),
        h("div", { class: "kopf-unter" }, r.keineAlternative
          ? "Kein Haus erfüllt das Profil und liegt höchstens +" + state.schwelleX + " Min über UKHD."
          : "höchstens +" + state.schwelleX + " Min Mehrzeit gegenüber UKHD"))));
    box.appendChild(h("div", { class: "telefon" }, "Freie Kapazität und Aufnahmebereitschaft immer telefonisch beim Haus erfragen."));
    if (nahUnbekannt) box.appendChild(h("p", { class: "klein" },
      nahUnbekannt + (nahUnbekannt === 1 ? " nahes Haus" : " nahe Häuser") + " mit unbekannten Angaben (gelb markiert) " + (nahUnbekannt === 1 ? "wird" : "werden") + " nicht berücksichtigt."));

    var gezeigt = r.liste.filter(function (e) { return e.kategorie === "referenz" || e.kategorie === "alternative"; });
    var skala = gezeigt.reduce(function (m, e) { return e.minuten !== null && e.minuten > m ? e.minuten : m; }, 0) * 1.08;
    var hdMin = r.hd && r.hd.minuten !== null ? r.hd.minuten : null;
    var rang = 0, weitere = [], nr = 0;
    r.liste.forEach(function (e) {
      if (e.kategorie === "referenz" || e.kategorie === "alternative") {
        box.appendChild(ergebnisKarte(e, e.kategorie === "alternative" ? ++rang : 0, skala, hdMin, nr++));
      } else weitere.push(e);
    });
    if (weitere.length) {
      var det = h("details", { class: "weitere" }, h("summary", null, "Weitere Häuser (" + weitere.length + ") mit Grund"));
      var skalaWeit = weitere.reduce(function (m, e) { return e.minuten !== null && e.minuten > m ? e.minuten : m; }, skala) * 1.02;
      weitere.forEach(function (e) { det.appendChild(ergebnisKarte(e, 0, skalaWeit, hdMin, 0)); });
      box.appendChild(det);
    }

    // Marker
    rang = 0;
    r.liste.forEach(function (e) {
      var k = e.klinik, klasse = KAT_KLASSE[e.kategorie];
      var text = e.kategorie === "referenz" ? "H" : e.kategorie === "alternative" ? String(++rang) : "";
      var m = L.marker([k.lat, k.lon], { icon: icon(klasse, text), title: k.name, keyboard: false, zIndexOffset: e.kategorie === "referenz" ? 1000 : e.kategorie === "alternative" ? 500 : 0 });
      m.bindTooltip(k.name + (e.minuten !== null ? " · " + (state.minutenQuelle === "schaetzung" ? "~" : "") + minutenText(e.minuten) : ""));
      m.on("click", function () { waehle(k.id); });
      m.addTo(markerLayer);
    });

    if (state.fitNachRender) {
      state.fitNachRender = false;
      var pts = [[state.standort.lat, state.standort.lon], [hd.lat, hd.lon]];
      r.alternativen.forEach(function (e) { pts.push([e.klinik.lat, e.klinik.lon]); });
      map.fitBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 12 });
    }
    zeichneRouten(r.liste.filter(function (e) {
      return e.kategorie === "referenz" || e.kategorie === "alternative" || e.klinik.id === state.ausgewaehlt;
    }));
  }

  function zeichneNeutral() {
    state.kliniken.forEach(function (k) {
      var m = L.marker([k.lat, k.lon], { icon: icon(k.id === HD_ID ? "referenz" : "aus", k.id === HD_ID ? "H" : ""), title: k.name, keyboard: false });
      m.bindTooltip(k.name);
      m.addTo(markerLayer);
    });
  }

  function waehle(id) {
    state.ausgewaehlt = id;
    var k = state.kliniken.filter(function (x) { return x.id === id; })[0];
    Array.prototype.forEach.call(document.querySelectorAll(".karte"), function (el) {
      el.classList.toggle("gewaehlt", el.getAttribute("data-id") === id);
    });
    var el = document.querySelector('.karte[data-id="' + id + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    if (!k || !state.standort) return;
    if (state.routen) zeichneRouten(aktuelleRoutenziele());
    map.fitBounds(L.latLngBounds([[state.standort.lat, state.standort.lon], [k.lat, k.lon]]).pad(0.3), { maxZoom: 13 });
  }

  // ----------------------------------------------------------------- Profile

  function baueProfile() {
    var box = $("profile");
    C.PROFILE.forEach(function (p) {
      box.appendChild(h("button", {
        type: "button", role: "radio", "aria-checked": "false", "data-id": p.id,
        onclick: function () { waehleProfil(p.id); }
      }, p.label));
    });
  }

  function waehleProfil(id) {
    state.profilId = id;
    state.fitNachRender = true;
    Array.prototype.forEach.call($("profile").children, function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-id") === id ? "true" : "false");
    });
    render();
    var kopf = document.querySelector("#ergebnis .kopfzeile");
    if (kopf && kopf.scrollIntoView) kopf.scrollIntoView({ block: "nearest" });
  }

  // ------------------------------------------------------------------- Uhrzeit

  function lokalIso(d) {
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function aktualisiereUhrHinweis() {
    $("uhrzeitHinweis").textContent = state.jetztOverride
      ? "Manuell gesetzt. Die Katheter-Zeitfenster werden für diese Zeit geprüft."
      : "Aktuelle Systemzeit" + (C.istFeiertag(new Date()) ? " (Feiertag in Baden-Württemberg)" : "") + ".";
  }

  // ------------------------------------------------------------------ Info

  var INFO_HTML =
    "<h3>Wofür das Tool da ist</h3><p>Es zeigt, welche Häuser der hinterlegten Liste für das gewählte Fallprofil geeignet sind und höchstens die eingestellte Mehrzeit über der Fahrzeit nach Heidelberg liegen. Es ist eine Entscheidungshilfe. Die Zielklinik bestimmen Notarzt und Leitstelle.</p>" +
    "<h3>Was das Tool nicht weiß</h3><ul><li>Keine Live-Kapazitäten und keine Bettenlage. Freie Kapazität und Aufnahmebereitschaft müssen immer telefonisch beim Haus erfragt werden.</li><li>Fahrzeiten sind Pkw-Richtwerte ohne Sonderrechte und ohne aktuelle Verkehrslage.</li><li>Eine Angabe, die in der Liste fehlt, gilt als \"unbekannt\" und zählt nicht als geeignet.</li></ul>" +
    "<h3>Listenprüfung</h3><p>Der Reiter „Listenprüfung“ zeigt, welche Angaben je Haus belegt sind und welche fehlen, und welche Fallprofile nur wegen einer Lücke ausfallen. Er dient der fachlichen Abnahme und der Planung von Rückfragen. Er verändert die Liste nicht.</p>" +
    "<h3>Datenschutz</h3><ul>" +
    "<li><b>Adresssuche (Nominatim/OpenStreetMap):</b> nur Straße und Ort, nie Hausnummer. Zusätzlich sieht der Dienst technisch die IP-Adresse des Rechners.</li>" +
    "<li><b>Fahrzeiten (OSRM/OpenStreetMap):</b> Koordinaten des Standorts und der Kliniken, keine Namen, keine Patientendaten.</li>" +
    "<li><b>Kartenkacheln (OpenStreetMap):</b> der sichtbare Kartenausschnitt.</li>" +
    "<li><b>Diese Seite (GitHub Pages):</b> beim Laden sieht GitHub die IP-Adresse des Rechners.</li>" +
    "<li><b>Gespeichert wird nichts über Einsätze.</b> Standort, Profil und Eingaben bleiben im Arbeitsspeicher und verschwinden beim Neuladen. Im Browser bleiben nur die Wahl hell oder dunkel und eine selbst geladene Klinikliste.</li>" +
    "<li>Keine Cookies, keine Statistik, keine Schlüssel in der Seite.</li></ul>" +
    "<h3>Quellen und Lizenzen</h3><p>Kartendaten © OpenStreetMap-Mitwirkende (ODbL). Karten-Bibliothek Leaflet (BSD-2). Anschlussstellen aus OpenStreetMap. Version " + APP_VERSION + ".</p>";

  // ------------------------------------------------------------------- Start

  function start() {
    $("infoText").innerHTML = INFO_HTML;
    $("infoKnopf").addEventListener("click", function () { $("infoDialog").showModal(); });
    baueProfile();
    initKarte();

    $("standortForm").addEventListener("submit", function (ev) { ev.preventDefault(); sucheStandort($("standort").value); });
    $("schwelle").addEventListener("change", function () {
      var v = parseInt($("schwelle").value, 10);
      state.schwelleX = isFinite(v) ? Math.max(0, Math.min(60, v)) : 10;
      $("schwelle").value = state.schwelleX;
      render();
    });
    $("uhrzeit").addEventListener("change", function () {
      var v = $("uhrzeit").value;
      state.jetztOverride = v ? new Date(v) : null;
      aktualisiereUhrHinweis();
      render();
    });
    $("uhrzeitJetzt").addEventListener("click", function () {
      state.jetztOverride = null;
      $("uhrzeit").value = lokalIso(new Date());
      aktualisiereUhrHinweis();
      render();
    });
    $("listeDatei").addEventListener("change", function (ev) { if (ev.target.files[0]) dateiGewaehlt(ev.target.files[0]); });
    $("standardListe").addEventListener("click", standardWiederherstellen);
    $("routenKnopf").addEventListener("click", schalteRouten);
    aktualisiereRoutenKnopf();

    $("navKarte").addEventListener("click", function () { zeigeAnsicht("karte", true); });
    $("navPruefung").addEventListener("click", function () { zeigeAnsicht("pruefung", true); });
    window.addEventListener("hashchange", function () { zeigeAnsicht(location.hash === "#pruefung" ? "pruefung" : "karte", false); });
    $("themeKnopf").addEventListener("click", function () { window.CPUTheme.umschalten(); });
    window.addEventListener("cpu-theme", function () {
      if (state.ansicht === "karte" && state.routen) zeichneRouten(aktuelleRoutenziele());
    });

    $("uhrzeit").value = lokalIso(new Date());
    aktualisiereUhrHinweis();
    setInterval(function () {
      if (!state.jetztOverride) { $("uhrzeit").value = lokalIso(new Date()); render(); }
    }, 60000);

    var lokal = leseLokal();
    var listeLaden = lokal ? Promise.resolve() : ladeStandardliste();
    Promise.all([
      listeLaden.then(function (l) {
        if (lokal) setzeListe(lokal.liste, "lokal", lokal.name);
        else setzeListe(l, "standard");
      }),
      fetchMitTimeout("data/anschlussstellen.json", TIMEOUT_MS).then(function (d) { state.anschlussstellen = d.anschlussstellen || []; })
        .catch(function () { meldung("as", "Anschlussstellen-Tabelle nicht ladbar: Autobahn-Eingabe ist nicht verfügbar.", "gelb"); })
    ]).then(function () {
      render();
      if (location.hash === "#pruefung") zeigeAnsicht("pruefung", false); else $("standort").focus();
    })
      .catch(function (e) { meldung("liste", "Klinikliste nicht ladbar: " + e.message, "rot"); });

    registriereServiceWorker();
  }

  function registriereServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      reg.addEventListener("updatefound", function () {
        var w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", function () {
          if (w.state === "installed" && navigator.serviceWorker.controller) {
            meldung("update", "Neue Version verfügbar.", "gelb");
            var zeile = $("meldungen").querySelector('[data-key="update"]');
            var b = h("button", { type: "button", class: "hell", onclick: function () { w.postMessage("SKIP_WAITING"); } }, "Jetzt aktualisieren");
            zeile.appendChild(document.createTextNode(" "));
            zeile.appendChild(b);
          }
        });
      });
    }).catch(function () { /* ohne Service Worker läuft die App weiter, nur ohne Offline-Hülle */ });
    var neuGeladen = false, hatteController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      // Erstbesuch: der Service Worker übernimmt nur die Seite, ein Neuladen würde Eingaben verwerfen
      if (neuGeladen || !hatteController) return;
      neuGeladen = true;
      location.reload();
    });
  }

  start();
})();
