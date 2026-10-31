/*
 * Service Worker der CPU-Karte. Zwischengespeichert wird nur die App-Hülle und der letzte Stand
 * der Klinikliste und der Anschlussstellen. Karte, Adresssuche und Routing laufen immer direkt
 * gegen die Dienste (kein Abfangen fremder Anfragen, keine Kachel-Zwischenspeicherung).
 * Gleiche Herkunft: erst Netz, bei Ausfall der gespeicherte Stand. So ist die Klinikliste online
 * immer die aktuelle; offline gilt der zuletzt geladene Stand (die App zeigt dessen Datum).
 * Bei einer neuen Version die Zahl VERSION erhöhen.
 */
var VERSION = "cpu-karte-0.3.0";
var HUELLE = [
  "./", "index.html", "app.css", "app.js", "logic.js", "xlsx-lesen.js", "pruefung.js", "theme.js",
  "manifest.webmanifest", "icons/medape-logo-256.png", "icons/icon-192.png", "icons/icon-512.png",
  "icons/icon-maskable-512.png", "icons/favicon-48.png", "icons/apple-touch-icon.png", "vendor/fonts/HankenGrotesk-latin.woff2",
  "vendor/leaflet/leaflet.js", "vendor/leaflet/leaflet.css",
  "data/kliniken.json", "data/anschlussstellen.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(HUELLE); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var kopie = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, kopie); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === "navigate" ? caches.match("index.html") : Promise.reject(new Error("offline")));
      });
    })
  );
});
