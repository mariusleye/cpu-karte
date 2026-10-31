/*
 * Hell oder dunkel. Läuft im Kopf der Seite vor dem ersten Zeichnen, damit nichts aufblitzt (besonders
 * nachts in der Notaufnahme). Ohne gespeicherte Wahl folgt die Seite der Einstellung des Betriebssystems.
 * Gespeichert wird nur "hell" oder "dunkel", sonst nichts.
 */
(function () {
  "use strict";
  var KEY = "cpu.theme";
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function gespeichert() {
    try { var v = localStorage.getItem(KEY); return v === "hell" || v === "dunkel" ? v : null; } catch (e) { return null; }
  }

  function aktuell() { return gespeichert() || (mq && mq.matches ? "dunkel" : "hell"); }

  function anwenden() {
    var t = aktuell();
    document.documentElement.setAttribute("data-theme", t === "dunkel" ? "dark" : "light");
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dunkel" ? "#0B1220" : "#033861");
    window.dispatchEvent(new CustomEvent("cpu-theme", { detail: t }));
  }

  function umschalten() {
    var neu = aktuell() === "dunkel" ? "hell" : "dunkel";
    try { localStorage.setItem(KEY, neu); } catch (e) { /* Speicher gesperrt: Wahl gilt nur bis zum Neuladen */ }
    document.documentElement.setAttribute("data-theme", neu === "dunkel" ? "dark" : "light");
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", neu === "dunkel" ? "#0B1220" : "#033861");
    window.dispatchEvent(new CustomEvent("cpu-theme", { detail: neu }));
  }

  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (!gespeichert()) anwenden(); });
  window.CPUTheme = { aktuell: aktuell, umschalten: umschalten };
  anwenden();
})();
