# CPU-Karte

Entscheidungshilfe für die kardiologische Notaufnahme: Der Rettungsdienst nennt den Standort, die Karte zeigt
ihn, und die Liste nennt Krankenhäuser, die für das Fallprofil geeignet sind und höchstens X Minuten
(Standard 10) länger entfernt liegen als die Uniklinik Heidelberg (UKHD).

Das Tool empfiehlt nichts. Es zeigt, was nach der hinterlegten Klinikliste geeignet ist. Zielklinikwahl und
Zuweisung liegen bei Notarzt und Leitstelle. Freie Kapazitäten und Aufnahmebereitschaft kennt das Tool nicht
und sind immer telefonisch beim Haus zu erfragen.

## Bedienung in drei Schritten

1. **Standort**: Straße und Ort eintippen (Hausnummern werden vor dem Senden entfernt), oder `A5 Walldorf`
   für eine Anschlussstelle, oder einen Punkt auf der Karte anklicken.
2. **Fallprofil** wählen.
3. **Ergebnis** lesen: UKHD als Vergleich, darunter die geeigneten Häuser nach Fahrzeit. Weitere Häuser
   stehen aufklappbar mit Grund darunter (zu weit, Katheter jetzt nicht verfügbar, Angabe unbekannt). Das UKHD
   gilt als Vergleichsziel, das alle Profile jederzeit aufnehmen kann. Klick auf ein Haus zoomt die Karte darauf.

Mit dem Schalter „Routen auf der Karte“ (oben rechts an der Karte, standardmäßig aus) werden die Fahrwege zum
UKHD (blau) und zu den angezeigten Alternativen (grün) eingezeichnet, das gewählte Haus dicker.

Unter „Einstellungen und Klinikliste": Mehrzeit-Schwelle, Uhrzeit für die Katheter-Zeitfenster (zum Prüfen
einer anderen Tageszeit) und eigene Klinikliste laden.

**Unbekannt ist nie „ja".** Fehlt eine Angabe in der Liste, gilt sie als nicht erfüllt und wird gelb markiert.
Fährt der Rettungsdienst nur wegen eines gelben Feldes nicht in ein nahes Haus, ist die Liste zu ergänzen,
nicht das Tool.

## Klinikliste pflegen

Die Pflegedatei ist die Excel `26-10-30 Klinikliste CPU-Karte.xlsx`. Leere Zelle = unbekannt. Ablauf:

```
python tools/klinikliste.py xlsx2json "26-10-30 Klinikliste CPU-Karte.xlsx" data/kliniken.json
node tools/pruefe-liste.js
```

Danach committen und pushen; GitHub Pages veröffentlicht die neue Liste. Zum Ausprobieren lässt sich eine
Excel auch direkt im Tool laden. Sie bleibt dann nur in diesem Browser (zurück mit „Standardliste
wiederherstellen"). Spalte „Geprüft von" trägt die Person ein, die die Zeile fachlich bestätigt hat; leer
heißt in den Details „Nicht ärztlich geprüft". Nach 90 Tagen warnt die App vor einer veralteten Liste.

Die Zuordnung Profil zu nötigen Fähigkeiten steht in `logic.js` (`PROFILE`). Sie ist ein Entwurf und
klinisch abzunehmen.

## Listenprüfung (Lücken sehen)

Der Reiter **Listenprüfung** (oben, mit gelber Zahl der Häuser mit Lücken) ist für die fachliche Abnahme und die
Planung von Rückfragen gedacht. Er zeigt je Haus ✓ ja, ✗ nein oder ? unbekannt für alle Angaben, dazu Alter des
Stands, „Geprüft von“, Quellen (anklickbar) und Hinweis. Die Balken „Wo sich eine Rückfrage lohnt“ nennen je
Fallprofil, wie viele Häuser nur wegen unbekannter Angaben ausfallen; ein Klick filtert die Tabelle. Ein Klick
auf eine Spaltenüberschrift zeigt nur Häuser, bei denen dieses Feld fehlt. „Rückfrageliste kopieren“ erzeugt
einen Text mit den offenen Angaben je Haus für die telefonische Klärung. Die Ansicht speichert und ändert
nichts; Korrekturen kommen wie gewohnt in die Pflege-Excel. Direktlink: `…/cpu-karte/#pruefung`.

## Automatische Pflegeprüfung

Die GitHub Action `Klinikliste prüfen` (`.github/workflows/klinikliste-pruefen.yml`) läuft am Monatsersten und
lässt sich im Reiter Actions von Hand starten. Sie führt die Logik-Tests aus und erzeugt mit
`tools/pflegebericht.js` einen Bericht: formale Fehler der Liste, Angaben mit Stand älter als 90 Tage und
Quellseiten, die nicht mehr existieren (HTTP 404/410 oder Adresse nicht auflösbar). Seiten, die nur den Zugriff
sperren oder nicht antworten, stehen als „nicht eindeutig prüfbar“ im Bericht, ohne Befund. Bei Befund legt die
Action ein Issue mit dem Label `listenpflege` an (GitHub benachrichtigt wie üblich), aktualisiert es bei den
nächsten Läufen und schließt es, sobald alles in Ordnung ist. Lücken und fehlende ärztliche Prüfung stehen nur
zur Information im Bericht. Lokal: `node tools/pflegebericht.js` (mit `--ohne-netz` ohne Quellenprüfung).

## Datenschutz-Kurzbeschreibung

| Dienst | Was dorthin geht | Was nicht |
|---|---|---|
| GitHub Pages (diese Seite) | IP-Adresse beim Laden der Seite | keine Eingaben, kein Standort |
| Nominatim (OpenStreetMap), Adresssuche | Straße und Ort, **nie die Hausnummer**; technisch die IP-Adresse | keine Namen, keine Patientendaten |
| OSRM (OpenStreetMap), Fahrzeiten | Koordinaten von Standort und Kliniken | keine Namen, keine Patientendaten |
| OpenStreetMap-Kacheln | der sichtbare Kartenausschnitt | nichts weiter |

Gespeichert wird nichts über Einsätze: Standort, Profil und Eingaben bleiben im Arbeitsspeicher. Im Browser
liegen höchstens die Wahl hell oder dunkel und eine selbst geladene Klinikliste. Keine Cookies, keine Statistik, keine Schlüssel. Die
Content-Security-Policy in `index.html` beschränkt Verbindungen auf diese drei Dienste.

Ein Klick auf die Karte setzt den Standort ohne jede Adresssuche; nur Koordinaten gehen an OSRM.

## Vor dem Einsatz abzustimmen

- **ÄLRD und Leitstelle**: Kurzabstimmung, dass das Tool als Entscheidungshilfe genutzt wird.
- **Datenschutzbeauftragte:r**: Kurzbeschreibung oben prüfen lassen.
- **Klinik-IT**: Erreichbarkeit von `github.io`, `tile.openstreetmap.org`, `nominatim.openstreetmap.org` und
  `router.project-osrm.org` vom Notaufnahme-PC.
- **Klinikliste**: fachliche Prüfung jeder Zeile, Eintrag in „Geprüft von".
- **Öffentliche Dienste**: Der OSRM-Demoserver und Nominatim haben keine Verfügbarkeitszusage und
  Fair-Use-Grenzen. Bei Ausfall zeigt die App Schätzungen aus der Luftlinie, deutlich gekennzeichnet.

## Technik

Statische Seite ohne Server: `index.html`, `app.js` (Oberfläche), `pruefung.js` (Listenprüfung), `theme.js` (hell/dunkel), `logic.js` (Eignung, Zeitfenster,
Feiertage BW, Adressbereinigung; ohne Browser getestet), `xlsx-lesen.js` (Excel im Browser lesen),
`sw.js` und `manifest.webmanifest` (installierbare App), `vendor/leaflet` (Karte, BSD-2),
`vendor/fonts` (Hanken Grotesk, SIL OFL, lokal eingebunden), `icons` (MedApe-Logo),
`data/kliniken.json`, `data/anschlussstellen.json` (aus OpenStreetMap, ODbL; ohne Kilometrierung).

Tests der Logik:

```
node tests/logic.test.js
```

Lokal ansehen (Service Worker und PWA brauchen `http://localhost` oder `https`, nicht `file://`):

```
python -m http.server 8000
```

Neue Version ausrollen: `VERSION` in `sw.js` erhöhen. Offline starten nur Oberfläche und zuletzt geladene
Liste; Karte, Adresssuche und Routing brauchen Netz.

Kartendaten © OpenStreetMap-Mitwirkende (ODbL).
