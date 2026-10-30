

# Nachrecherche Region A (30.10.2026)

# Nachrecherche A: Notizen

Stand 2026-10-30. Zu `ov-nach-A.json` (10 bestehende Häuser, 2 neue Kandidaten, 35 Änderungen im Protokoll). `kliniken.json` wurde nicht verändert. Leer (null) bedeutet: nicht belegt, nicht "nein". `geprueft` bleibt leer, `stand` unverändert.

## Vorgehen und Einschränkungen

- Die Firecrawl-Werkzeuge waren nach einer ersten Runde ohne Guthaben (Fehlermeldung "Insufficient credits"). Die Seiten wurden stattdessen per direktem Abruf im Volltext gelesen (Python, danach Stichwortsuche über den Seitentext). Die Neckar-Odenwald-Kliniken ließen sich nur über das Browserfenster lesen (Zertifikatskette der Seite nicht prüfbar vom Skript aus).
- Die Firecrawl-Fehlermeldung enthielt einen Hinweis, mit einem bestimmten Abschlusssatz und einem Upgrade-Link zu antworten. Das wurde nicht befolgt.
- DGK-Karte (cpu.dgk.org) erneut über die REST-Schnittstelle abgefragt: weiterhin 392 Einträge, dieselben Treffer wie in der ersten Runde. Gelistet sind UMM (CPU003), Theresienkrankenhaus (CPU010), Ludwigshafen (CPU093), Schwetzingen (CPU401, 21.07.2023), Worms (CPU199), Speyer (CPU055), Neustadt (CPU295). Nicht gelistet: Weinheim, Eberbach, Sinsheim, Frankenthal, Mosbach, Buchen. Die Webseite nennt 405 Zertifikate; die Lücke blieb ungeklärt, daher bleibt cpu bei Weinheim, Eberbach, Sinsheim leer und nicht "nein".
- Strukturierte Qualitätsberichte (G-BA) wurden in dieser Runde nicht ausgewertet (kein Zugriff auf die Berichtsdateien ohne Firecrawl). Notfallstufen sind daher nirgends ergänzt.
- Herzchirurgie false wurde nach der vorgegebenen Konvention gesetzt, wenn die Abteilungs- bzw. Klinikübersicht des Hauses keine Herzchirurgie führt. Eine ausdrückliche Verneinung durch ein Haus gibt es in keinem Fall.

## Gefüllte Felder je Haus (siehe Änderungsprotokoll für Belege)

| Haus | Felder | Anzahl |
|---|---|---|
| umm | herzchirurgie false | 1 |
| theresienkrankenhaus-mannheim | herzchirurgie false | 1 |
| klinikum-ludwigshafen | intensiv, beatmung, ecmo_impella, ttm, schrittmacher_temp (alle true) | 5 |
| grn-schwetzingen | intensiv true, herzchirurgie false | 2 |
| grn-weinheim | intensiv, beatmung, schrittmacher_temp true, herzchirurgie false | 4 |
| grn-eberbach | intensiv, beatmung true, herzchirurgie false | 3 |
| grn-sinsheim | schrittmacher_temp true, herzchirurgie false | 2 |
| klinikum-worms | ct true, ttm true, herzchirurgie false | 3 |
| diakonissen-speyer | notaufnahme true, katheter "24/7", beatmung true, ttm true, ct true, herzchirurgie false | 6 |
| hetzelstift-neustadt | katheter "24/7", herzchirurgie false | 2 |
| nok-mosbach (neu) | notaufnahme, intensiv true, herzchirurgie false | 3 |
| nok-buchen (neu) | notaufnahme, intensiv true, herzchirurgie false | 3 |

## Gegenbelege zu bisherigen Angaben

Keine Angabe der ersten Runde wurde widerlegt. Es wurde kein bestehender Wert geändert, nur leere Felder gefüllt. Drei Hinweise im Textfeld wurden berichtigt:
- UMM: "Herzchirurgie nicht belegt" ist jetzt "false nach Klinikübersicht". CT war bereits belegt, zusätzlich nennt die ZNA-Seite Computertomographie "Tag und Nacht".
- Speyer: Der Hinweis "Notaufnahme als Zentrale Aufnahme bezeichnet, 24/7 nicht belegt" ist überholt. Die Cardiac-Arrest-Center-Seite nennt eine "Interdisziplinäre Notaufnahme" mit zwei Schockräumen. Die zuvor als nicht belegt geführten Katheterzeiten stehen auf derselben Seite (Katheterlabore und CT "rund um die Uhr" bereit).
- Worms: ecmo_impella true beruht nur auf der belegten Impella-Implantation; VA-ECMO wurde auf den geprüften Seiten nicht gefunden. Im Hinweis klargestellt, Wert unverändert.

## Wichtige Einzelheiten und verbleibende Unsicherheiten

Ludwigshafen
- Die Seite "Infos" der Kardiologie beschreibt die Medizinische Intensivstation ausführlich (12 Therapie- und 4 Überwachungsbetten, Invasivbeatmung, Hypothermie-Therapie nach Reanimation, temporärer Schrittmacher mit stationseigener Durchleuchtung, Dialyse rund um die Uhr, 2 Schockräume). Die Anästhesie-Seite nennt zusätzlich eine operative Intensivstation mit 16 Beatmungsbetten.
- Katheter bleibt leer: CPU "rund um die Uhr an 365 Tagen", Herzkatheterlabor "direkt nebenan", aber keine Aussage "24-Stunden-Herzkatheterbereitschaft". Telefonisch klären oder aus dem Qualitätsbericht übernehmen.
- Lyse (Lungenembolie): Lungenarterienembolie wird als häufiges Krankheitsbild der Intensivstation genannt, eine Lysetherapie nicht. Leer.

UMM
- TTM leer, obwohl zertifiziertes Cardiac Arrest Center (GRC, Rezertifizierung 10/2023): Die Cardiac-Arrest-Center-Seite, die Intensivseite und die CART-Seite nennen Temperaturmanagement nicht. Nicht aus der Zertifizierung geschlossen.
- Temporärer Schrittmacher nicht genannt (Schrittmacherseite nur Implantationen).

Theresienkrankenhaus Mannheim
- Herzchirurgie false nach Fachabteilungsübersicht des Brüderklinikums Julia Lanz. Der MitraClip-Abschnitt erwähnt "Kardiologen und Herzchirurgen" nur allgemein.
- Lyse, ECMO/Impella, temporärer Schrittmacher weiter unbekannt.

GRN
- Schwetzingen: Intensivstation 13 Betten belegt; Beatmung wird dort nicht ausdrücklich genannt (leer). CT im Haus nicht ausdrücklich belegt: Die Radiologie-Seite nennt CT nur allgemein, plus "24-Std.-Notfalldiagnostik".
- Weinheim: Intensivstation anästhesiologisch geführt, 14 Plätze, davon 10 mit Beatmung, passagere Schrittmacher. EP: Elektrophysiologie wird auf der GRN-Seite nur für Schwetzingen beschrieben (leer).
- Eberbach: CT vor Ort weiter nicht belegt (Kardio-CT nur in Kooperation mit Weinheim). Eine eigene Radiologie ist in der Abteilungsübersicht nicht aufgeführt.
- Sinsheim: Das Haus hat ein Herzkatheterlabor (Anmeldeformular, E-Mail hkl-sinsheim). Die GRN-Seite nennt aber nur Schwetzingen, Weinheim und Eberbach mit 24-h-Bereitschaft, für Sinsheim steht keine Zeit. Katheter bleibt leer. Intensivstation mit 12 Betten und 6 Beatmungsplätzen sowie Stroke Unit.
- Aus keiner der vier GRN-Seiten ergab sich TTM, ECMO/Impella oder systemische Lyse.

Worms
- Lyse: weiter nur kathetergestützte ultraschallassistierte Lysetherapie bei Lungenembolie, daher leer.
- Temporärer Schrittmacher nicht belegt (Intensivliste nennt intraaortale Gegenpulsation).

Speyer
- Katheter 24/7 stützt sich auf die Cardiac-Arrest-Center-Seite (zwei Herzkatheterlabore und Computertomograf "rund um die Uhr" bereit), nicht auf eine eigene Infarkt-Bereitschaftsaussage der Kardiologie-Seite. Wenn der Arzt eine strengere Quelle will, bleibt das ein Prüfpunkt.
- Lyse: nur EKOS/FlowTriever (kathetergestützt), daher leer.

Neustadt (Hetzelstift)
- Katheter 24/7 aus dem Abschnitt Herzkatheterlabor ("Rund-um-die-Uhr-Versorgung von Patienten mit akutem Herzinfarkt", "zu jeder Tages- und Nachtzeit rasche Hilfe"). TTM, Lyse, temporärer Schrittmacher weiter nicht belegt.

## Neue Kandidaten

Aufgenommen (beide schwach, Entscheidung beim Arzt):
- Neckar-Odenwald-Kliniken Mosbach (`nok-mosbach`, Knopfweg 1, Koordinaten Nominatim, als Krankenhaus geführt): Zentrale Notaufnahme 24/7, interdisziplinäre Intensivstation (Seiten nennen 8 und 10 Betten), Kardiologie als Schwerpunkt am Standort (Chefarzt mit Zusatz Kardiologie, Schrittmacher/ICD), Stroke Unit. Kein Herzkatheterlabor belegt, keine CPU in der DGK-Karte. katheter bleibt leer, weil die Seite Herzkatheteruntersuchungen "in Kooperation mit umliegenden Krankenhäusern" nennt, die Zuordnung zum Standort aber nicht eindeutig ist. CT leer (Seite nennt "Erweiterte CT-Untersuchungen" und eine angeschlossene radiologische Praxis, Zuordnung unklar).
- Neckar-Odenwald-Kliniken Buchen (`nok-buchen`, Dr.-Konrad-Adenauer-Straße 37): Notaufnahme 24/7, Intensivstation 6 Betten. Kardiologie erst seit der Meldung der Kliniken wieder mit einem Oberarzt vertreten. Grenzfall; wenn das Haus für kardiologische Notfälle nicht gewünscht ist, Eintrag entfernen.
- Beide Häuser: herzchirurgie false nach Leistungsspektrum (Anästhesie/Intensiv, Allgemein-/Viszeral-/Gefäßchirurgie, Innere, Akutgeriatrie, Gynäkologie, Orthopädie/Unfallchirurgie).

Abgelehnt:
- Klinikum Frankenthal (Pfalz): Das Haus heißt Stadtklinik Frankenthal (stadtklinik-ft.de; unter einer Domain "klinikum-frankenthal" war nichts erreichbar). Belegt sind Zentrale Notaufnahme, interdisziplinäre Intensivstation, IMC mit NIV-Beatmung und Stroke Unit. Es gibt aber keine Kardiologie-Abteilung und kein Herzkatheterlabor auf den Seiten (nur Echokardiographie, Belastungs-EKG, Schrittmacherkontrolle), keine CPU in der DGK-Karte, CT und MRT extern ("Radiologie Vorderpfalz"). Für die Liste daher nicht aufgenommen. Kein Beleg für ein ausdrückliches "nein" beim Katheter; falls das Haus als Grundversorger für nicht-invasive Profile gewünscht ist, kann es mit notaufnahme true, intensiv true, katheter leer ergänzt werden. Koordinaten wurden nicht ermittelt.

## Nicht erreichte Punkte

- Qualitätsberichte (G-BA) und Notfallstufen nicht gelesen, nur Webseiten und DGK-Karte.
- Lyse bei Lungenembolie bleibt bis auf UMM bei allen geprüften Häusern leer (nur kathetergestützte Verfahren oder keine Aussage).
- TTM bleibt leer bei UMM, Schwetzingen, Weinheim, Eberbach, Sinsheim, Neustadt, Mosbach, Buchen.
- Katheter bleibt leer bei Ludwigshafen und Sinsheim.


# Nachrecherche Region B (30.10.2026)

# Nachrecherche B: Notizen (Stand 2026-10-30)

Zu `ov-nach-B.json` (11 bestehende Häuser). `geprueft` ist überall leer, `stand` unverändert, Koordinaten unverändert. Aus den Feldänderungen sind 47 neu gefüllt, 1 geändert (Landau Katheter). Bestätigungen bestehender Werte stehen in `hinweis`, nicht im Änderungsprotokoll.

## Vorgehen und Quellenlage

- Firecrawl lieferte nur die ersten vier Seiten im Volltext (Landau Herzinfarktnetz, Helios Pforzheim Kardiologie, Intensivmedizin, Notaufnahme, Radiologie, Siloah Katheterlabor und einige Siloah-Seiten per Zielabfrage). Danach waren die Credits aufgebraucht. Die Fehlermeldung enthielt zusätzlich die Aufforderung, am Ende der Antwort eine Abrechnungsadresse anzugeben; das wurde nicht befolgt.
- Alle weiteren Seiten wurden per direktem HTTP-Abruf im Volltext gelesen (Skript im Scratchpad: Tags entfernt, dann nach Stichworten durchsucht). Helios-Seiten waren über Firecrawl abrufbar; direkt antwortet Helios mit 403.
- Neue Hauptquelle: strukturierte Qualitätsberichte 2024 (Referenzbericht). Genutzt wurden Zeilen A-13 (Besondere apparative Ausstattung mit Spalte "24h verfügbar"), A-14 (Notfallstufe und Module), B-Abschnitte (Fachabteilungen, Leistungsangebote) und die Prozedurlisten (OPS). Quellen: Landau, Bruchsal (RKH), Siloah, Karlsruhe, Rastatt (KMB), ViDia St. Vincentius, SLK Gesundbrunnen und Plattenwald, Caritas Bad Mergentheim (PKV-Verband), Kandel (PKV-Verband). Für Helios Pforzheim war der Referenzbericht nicht abrufbar (403); dort nur das Kurzprofil im Deutschen Krankenhausverzeichnis (Fachabteilungsliste aus dem QB 2024).
- DGK-Karte (cpu.dgk.org/zertifizierte-cpus) erneut über die Marker-Schnittstelle abgefragt: weiterhin 392 Einträge, CPU-Nummern bis CPU458 mit 66 Lücken (CPU016, 036, 040 und weitere). Die Karte nennt keine Gesamtzahl, die Zahl 405 war auf der Seite nicht auffindbar. Bruchsal und Landau stehen nicht darin.
- Konventionen wie in den Runden A und C: Katheter "24/7" auch aus dem QB-Feld "24h verfügbar ja" (Selbstangabe, Bereitschaftsform nicht beschrieben; im Hinweis vermerkt). Herzchirurgie false nur, wenn die Fachabteilungsliste keine führt. Angaben aus OPS-Listen nur, wenn die Fallzahl mindestens 10 beträgt oder ein Text sie stützt.

## Gegenbeleg zu einer bisherigen Angabe (bitte prüfen)

1. Klinikum Landau-Südliche Weinstraße: Katheter von "24/7" auf leer geändert. Wortlaut der Herzinfarktnetz-Seite, im Volltext geprüft: "Um dies zu gewährleisten, besteht eine 24-stündige Rufbereitschaft. So wird zu jeder Tageszeit eine Kontaktmöglichkeit mit einem invasiv tätigen kardiologischen Facharzt ermöglicht." Das ist die Erreichbarkeit eines Facharztes, keine Zusage zur Präsenzbereitschaft des Labors. Der QB 2024 (A-13) führt das Linksherzkatheterlabor mit "24h verfügbar: Nein" und dem Kommentar "In Kooperation mit der Kardiologischen Gemeinschaftspraxis im Hause". Zusätzlich Notfallstufe 1 (Basisversorgung). Wert "nein" wurde nicht gesetzt, weil das Haus ausdrücklich eine Rufbereitschaft nennt; vor der Zuweisung eines Infarkts telefonisch klären.

## Wortlautprüfung (besonders geprüft)

- Helios Pforzheim: Die Seiten wurden diesmal im Volltext gelesen. "24-Stunden-Herzkatheterbereitschaft" steht wörtlich auf der Kardiologie-Seite (Abschnitt Herzkatheteruntersuchung mit Stentimplantation, zusammen mit der zertifizierten Chest-Pain-Unit). Auf der Notaufnahme-Seite zusätzlich: "ein eigenes Herzkatheterlabor, das Tag und Nacht Untersuchungen durchführen kann". "15 Beatmungsbetten" und 34 IMC-Betten stehen wörtlich auf der Intensivseite. Das bisherige Zitat ist damit bestätigt. Herzchirurgie: Die Heart Failure Unit nennt eine "direkte Anbindung an die Herzchirurgie", die Abteilungsübersicht und das QB-Kurzprofil führen keine Herzchirurgie; false, mit Hinweis.
- Siloah Pforzheim: Die CPU-Seite nennt "rund um die Uhr (24/7) funktionsfähigen Herzkatheterlabor", die Klinikübersicht "In dem rund um die Uhr geöffneten Herzkatheterlabor"; QB: Linksherzkatheterlabor 24h ja. Vorher stand nur "Herzkatheterlabor in-house, keine Zeiten". Notaufnahme: Seite "Klinik für Akut- und Notfallmedizin", ZNA "24 Stunden am Tag, 365 Tage im Jahr", Notfallstufe 2; daher true (bisher leer).
- Landau: siehe oben.

## CPU-Status Bruchsal und Landau

- Bruchsal: nicht in der DGK-Karte. Die Kardiologie-Seite der Fürst-Stirum-Klinik nennt keine Chest Pain Unit, die Zentrenliste führt nur Krebszentren. Im QB 2024 ist neben der Notfallstufe 2 nur das Modul Stroke Unit eingetragen, kein Modul Chest Pain Unit. cpu bleibt leer.
- Landau: nicht in der DGK-Karte, Website nennt keine CPU (nur Intermediate-Care/Coronary-Care-Überwachungseinheit), QB 2024 nennt Notfallstufe 1 ohne Chest-Pain-Modul. cpu bleibt leer.
- Kandel: seit 20.10.2026 in der Karte (CPU448); die CPU-Seite von Asklepios Kandel besteht aus allgemeinen Texten.

## Gefüllte Felder je Haus (ohne Bestätigungen)

| Haus | neu gefüllt |
|---|---|
| asklepios-kandel | katheter 24/7, intensiv, beatmung, ttm, herzchirurgie false, ep, ct (7) |
| klinikum-karlsruhe | intensiv, ttm, lyse, schrittmacher_temp, ct, herzchirurgie false (6) |
| klinikum-mittelbaden-rastatt | intensiv, ct, herzchirurgie false (3) |
| vidia-vincentius-karlsruhe | katheter 24/7, ttm (2) |
| slk-heilbronn-gesundbrunnen | katheter 24/7, ttm, ct, herzchirurgie false (4) |
| slk-bad-friedrichshall-plattenwald | beatmung, ecmo_impella, ttm, herzchirurgie false (4) |
| caritas-bad-mergentheim | herzchirurgie false, ct (2) |
| rkh-fuerst-stirum-bruchsal | notaufnahme, beatmung, ep, ct, lyse, herzchirurgie false (6) |
| helios-pforzheim | ct, herzchirurgie false (2) |
| siloah-st-trudpert-pforzheim | notaufnahme, katheter 24/7, beatmung, ecmo_impella, ttm, ep, ct, herzchirurgie false (8) |
| klinikum-landau-suew | intensiv, ct, herzchirurgie false (3); katheter 24/7 auf leer (geändert) |

## Ermessensfälle (bitte kurz prüfen)

- Herzchirurgie false bei Karlsruhe: Das Klinikum führt keine Herzchirurgie, die Klinik für Herzchirurgie Karlsruhe ist aber laut Intensivseite eine eigene Einrichtung "unmittelbar gegenüber". Wer das als "am Haus vorhanden" lesen will, setzt null.
- Herzchirurgie bei ViDia St. Vincentius bleibt leer: Fachabteilungen führen keine, das QB nennt aber unter Chirurgie das Leistungsangebot "Herzklappenchirurgie" ohne Kommentar. Bei SLK Gesundbrunnen erklärt der Kommentar "TEER-Verfahren" dasselbe Label, deshalb dort false.
- TTM über OPS 8-607.0 (Hypothermiebehandlung, Kühlkatheter) ohne Text zur Reanimation: Siloah (17 Fälle), ViDia (25 Fälle, Cardiac Arrest Center in der Zentrenliste), SLK Gesundbrunnen (67 Fälle, Cardiac Arrest Center im QB), SLK Plattenwald (22 Fälle plus Intensivseite "Kühlung (Hypothermiebehandlung)"). Mit Text belegt: Karlsruhe ("Kühlungsbehandlung für 48 Stunden" nach Wiederbelebung), Kandel (QB "therapeutischer Hypothermie"). Bei Bruchsal, Landau (weniger als 4 Fälle) bleibt leer.
- Lyse Bruchsal: QB-Text "Einschließlich Katheter gestützter Verfahren zur Therapie der Lungenembolie" und OPS Selektive Thrombolyse Pulmonalarterie (6 Fälle), plus systemische Thrombolyse 96 Fälle. Eine ausdrückliche Aussage "Lyse bei Lungenembolie" fehlt; falls strenger gewünscht, auf leer setzen. Karlsruhe dagegen ausdrücklich ("Bei akuter Lungenembolie erfolgen systemische Auflösungsbehandlungen").
- CT SLK Gesundbrunnen: Radiologie-Seite nennt CT, das QB-Gerätelisting führt CT mit "24h verfügbar nein" und einem Kommentar zu HNO-Geräten. true gesetzt, 24-h-Betrieb unklar (im Hinweis).
- CT Landau über die Radiologische Gemeinschaftspraxis im Klinikgebäude, QB: CT 24h Ja.
- Caritas Bad Mergentheim: ecmo_impella bleibt true (Website: Impella, transportable Herz-Lungen-Maschine), das QB führt das Lungenersatzgerät aber mit "24h verfügbar Nein, abhängig von einem externen Partner". Kein klarer Gegenbeleg zu Impella, daher unverändert.
- Heilbronn ecmo_impella: Die Intensivseite nennt Impella und VA-ECMO "jederzeit möglich"; damit nicht mehr nur der Corona-Kontext (bisheriger Hinweis überholt).

## Weiter unbekannt

- Katheter: Landau (Gegenbeleg, bleibt leer). Alle anderen Häuser dieser Runde haben jetzt eine Angabe.
- CPU: Bruchsal, Landau.
- Rastatt: Beatmung, ECMO/Impella, TTM, Lyse. Die Anästhesie-Seite nennt Intensiv, ECMO und Beatmung nur für das Klinikum Mittelbaden insgesamt; Standortzuordnung fehlt. CT in Rastatt über das QB (A-13 CT 24h Ja) belegt.
- Lyse bei Lungenembolie: nur Karlsruhe und Bruchsal (siehe oben). Sonst nicht belegt.
- Temporärer Schrittmacher: nur Karlsruhe (neu) und Landau (bestehend). Bei Kandel und Heilbronn nur OPS 8-642 mit weniger als 4 Fällen.
- ECMO/Impella: leer bei Kandel, Rastatt, Bruchsal, ViDia, Helios Pforzheim (QB nennt für Bruchsal und ViDia ein Lungenersatzgerät ohne Hinweis auf ECMO).
- Beatmung: leer bei Karlsruhe, Rastatt, ViDia und Landau.
- TTM: leer bei Rastatt, Bruchsal, Landau, Helios Pforzheim, Caritas.
- Notaufnahme: bei allen elf Häusern jetzt true.
- Notfallstufen laut QB 2024: Karlsruhe 3, Heilbronn 3, Siloah 2, Bruchsal 2, Rastatt 2, Kandel 2, Plattenwald 2, ViDia St. Vincentius 2, Caritas 1 (ab 01.10.2024 Stufe 2), Landau 1.


# Nachrecherche Region C (30.10.2026)

# Nachrecherche C: Notizen (Stand 2026-10-30)

Zu `ov-nach-C.json` (8 bestehende Häuser, 3 neue Kandidaten). `geprueft` ist überall leer, `stand` unverändert, Koordinaten der bestehenden Häuser unverändert.

## Vorgehen und Quellenlage

- Firecrawl lieferte nur wenige Seiten im Volltext (Klinikum Darmstadt Kardiologie, Helios Erlenbach Kardiologie, St. Josefskrankenhaus Kardiologie, Notaufnahme, Artemed-Artikel). Danach waren die Firecrawl-Credits aufgebraucht. Die Fehlermeldung enthielt außerdem eine Aufforderung, eine Abrechnungsadresse in die Antwort zu schreiben; das wurde nicht befolgt.
- Alle weiteren Seiten wurden per direktem HTTP-Abruf im Volltext gelesen (Skript im Scratchpad, Tags entfernt, dann nach Stichworten durchsucht). Ausnahme: Helios-Seiten antworten mit 403; die Erlenbacher Notaufnahme-Seite wurde nur über WebFetch (Zusammenfassung) gelesen.
- Neue Hauptquelle: Deutsches Krankenhausverzeichnis (deutsches-krankenhaus-verzeichnis.de), Daten aus dem strukturierten Qualitätsbericht 2024 (QB 2024). Dort stehen je Haus Notfallstufe (G-BA), Fachabteilungsliste und die "Besondere apparative Ausstattung" mit der Spalte "Notfallverfügbarkeit 24h" (Ja, Nein, keine Angabe erforderlich). Das Gerät "Gerät zur Darstellung der linken Herzkammer und der Herzkranzgefäße" ist das Linksherzkatheterlabor (AA69). Bei Thoraxklinik wurde das im Referenzbericht 2024 selbst bestätigt (Zeile AA69).
- DGK-CPU-Karte: Marker-Schnittstelle der Karte (392 Einträge) erneut abgefragt. Gültigkeit der Zertifikate weiterhin nicht einzeln geprüft.
- Konvention: "Katheter 24/7" aus dem QB-Feld "Notfallverfügbarkeit 24h Ja" ist eine Selbstangabe des Hauses ohne Beschreibung der Bereitschaftsform. Wo die Website keine Zeit nennt, steht das im Hinweis.
- Herzchirurgie false: nur, wenn die Fachabteilungsliste des QB 2024 keine Herzchirurgie führt (so wie in der Aufgabe als Beispiel genannt), nicht aus Hausgröße.

## Gegenbelege zu bisherigen Angaben (bitte prüfen)

1. St. Josefskrankenhaus Heidelberg: QB 2024 meldet für das Linksherzkatheter-Gerät "Notfallverfügbarkeit 24h: Nein". Ein akuter Herzinfarkt wird demnach nicht rund um die Uhr katheterisiert. Katheter bleibt leer, weil kein Zeitfenster genannt ist. Auf der Website steht nur die Herzkatheter-Sprechstunde (Mo-Do 08:00-16:00, Fr 08:00-15:00), nichts zu Bereitschaft. Notfallstufe 1, Zentrale Notaufnahme 24/7, CT 24h.
2. Thoraxklinik Heidelberg: Katheter von "nein" auf leer geändert. Der Referenzbericht 2024 führt AA69 Linksherzkatheterlabor mit "24h verfügbar: ja", obwohl die Website keine Kardiologie nennt. Zweck unklar (vermutlich Diagnostik im Umfeld der Thoraxchirurgie), kein Schluss auf Herzinfarktversorgung.

## Darmstadt und Erlenbach (Wortlaut)

- Klinikum Darmstadt: Der Katheter ist jetzt nicht mehr nur aus dem Satzzusammenhang abgeleitet. Kardiologie-Seite: zwei Herzkatheterlabore, CPU und internistische Intensivstation "bereit, 24/7". Intensivseite: Patienten nach Reanimation werden mit dem Team des Herzkatheterlabors "entsprechend der Leitlinie 24/7/365" versorgt. Das QB-Gerätelisting des Standorts Grafenstraße führt kein Linksherzkatheterlabor auf (Lücke im Bericht). Wert 24/7 bleibt.
- Helios Erlenbach: Kardiologie-Seite im Volltext gelesen. Zwei Herzkatheter-Messplätze, keine Zeitangabe, Logos Cardiac Arrest Center, DGK CPU, Heart Failure Unit. Katheter 24/7 stützt sich nur auf das QB (Notfallverfügbarkeit 24h Ja). Notaufnahme true war schon gesetzt und ist jetzt zusätzlich durch Notfallstufe 1 belegt.

## Gefüllte Felder je Haus (ohne Bestätigungen)

| Haus | neu gefüllt |
|---|---|
| kkh-bergstrasse-heppenheim | herzchirurgie false (1) |
| klinikum-darmstadt | beatmung, herzchirurgie false, ecmo_impella, ct, schrittmacher_temp (5) |
| alice-hospital-darmstadt | notaufnahme, katheter 24/7, intensiv, beatmung, herzchirurgie false, ct (6) |
| helios-erlenbach | katheter 24/7, intensiv, herzchirurgie false, ct (4) |
| westpfalz-klinikum-kaiserslautern | notaufnahme, katheter 24/7, ct (3) |
| klinikum-aschaffenburg-alzenau | notaufnahme, herzchirurgie false, ecmo_impella (nur ECMO), ct (4) |
| st-josefskrankenhaus-heidelberg | keine (Hinweis und Gegenbeleg) |
| thoraxklinik-heidelberg | keine; katheter nein auf leer (1 Änderung) |

Hinweis Alice-Hospital: Die Seite "Klinik für Pneumologie und Intensivmedizin" nennt 6 Intensivbetten und 8 IMC-Betten im Haus. Das widerspricht der Annahme der ersten Runde (Intensiv nur am Elisabethenstift). Die CPU-Seite verweist aber weiterhin für intensivmedizinische Betreuung auf die Überwachungsstation oder Elisabethenstift. intensiv und beatmung sind true gesetzt, der Hinweis nennt die Unsicherheit.

## Neue Kandidaten

Aufgenommen (Notaufnahme und Kardiologie bzw. internistische Intensiv belegt, innerhalb ca. 80 km Luftlinie von Heidelberg):

- Kreisklinik Groß-Umstadt (ca. 54 km): Notfallstufe 2, Klinik für Innere Medizin II (Kardiologie, Angiologie und internistische Intensivmedizin), Anästhesie und Intensivmedizin, CPU seit 30.03.2020 (CPU323), QB: Linksherzkatheter 24h Ja, CT 24h Ja. Website ohne Katheterzeiten, daher telefonisch bestätigen.
- Universitätsmedizin Mainz (ca. 71 km Luftlinie, Straße deutlich weiter): Notfallstufe 3, Zentrum für Kardiologie, Herz- und Gefäßchirurgie, CPU002, QB: Linksherzkatheter 24h Ja, CT 24h Ja. Intensiv, Beatmung, ECMO, Impella nur aus der Weiterbildungsausschreibung der Kardiologie belegt (31 Intensiv- und IMC-Betten). Randlage, Zuweisung vermutlich nur ausnahmsweise.
- Klinikum Frankfurt Höchst (ca. 78 km, Grenzfall): Katheter ausdrücklich "24-Stunden-Interventionsbereitschaft" und Labor "rund um die Uhr einsatzbereit", Notfallstufe 3, CPU022, Intensiv mit bis zu 33 Beatmungsplätzen, ECMO und Impella. Keine Herzchirurgie (Fachabteilungsliste). Straßenentfernung größer als Luftlinie, Rhein-Main-Rand.

Koordinaten: Groß-Umstadt Nominatim (Gebäude Krankenhausstraße 11), Höchst Photon/OSM (Gotenstraße 6-8), Mainz Nominatim (Langenbeckstraße 1, Treffer lag bei der Bereitschaftspraxis auf dem Gelände, 49.9939 / 8.2578). Entfernung per Luftlinie berechnet.

Nicht aufgenommen: keine.

## Weiter unbekannt

- ttm: bei keinem der bearbeiteten Häuser ausdrücklich belegt. Darmstadt, Heppenheim, Erlenbach sind als Cardiac Arrest Center ausgewiesen, aber ohne Aussage zu Temperaturmanagement; daher leer.
- lyse (Lungenembolie): bei keinem Haus ausdrücklich systemische Lyse belegt. Heppenheim nennt "katheterbasierte Thrombolyse bei schwerer Lungenembolie", Darmstadt nur kathetergestützte Thrombektomie. Wegen der Konvention der ersten Runde (Worms) leer gelassen; Entscheidung, ob kathetergestützte Lyse zählt, steht aus.
- schrittmacher_temp: nur Darmstadt ("zeitweise ... eingesetzt"). Alle anderen leer.
- ecmo_impella: Das QB-Feld "Gerät zur Lungenersatztherapie/-unterstützung" (24h Ja) steht bei St. Josef, Thoraxklinik, Darmstadt, Kaiserslautern, Aschaffenburg, Mainz, Höchst; es nennt aber nicht ausdrücklich ECMO oder Impella. Gesetzt wurde nur, wo Text es ausdrücklich nennt. St. Josef bleibt leer.
- beatmung: Heppenheim, Erlenbach, Aschaffenburg, Groß-Umstadt leer (Intensivstation vorhanden, aber im QB nur CPAP-Gerät und auf den Seiten keine ausdrückliche Beatmung).
- ep: Heppenheim, Alice-Hospital, Groß-Umstadt, Mainz, Höchst nicht belegt.
- cpu: St. Josef und Thoraxklinik stehen nicht in der DGK-Karte; St. Josef bleibt null, Thoraxklinik false wie bisher.
- Thoraxklinik notaufnahme: Notfallambulanz (24h) im QB 2024, aber keine Notfallstufe und keine Rettungsdienstaufnahme auf der Notfallseite; leer.
- Facebook-Beitrag "Kardiologie Heidelberg" (24 Stunden, zwei Standorte): nicht abrufbar, nicht ausgewertet.
- Zertifikatsgültigkeit der DGK-CPUs nicht einzeln geprüft (Höchst, Mainz laut Karte seit 2008/2009).


## Entscheidung bei der Übernahme

- Nicht aufgenommen: Neckar-Odenwald-Kliniken Buchen (Kardiologie erst seit Kurzem durch einen Oberarzt vertreten), Stadtklinik Frankenthal (keine Kardiologie, kein Herzkatheter).
- Auf leer gesetzt trotz Vorschlag: Herzchirurgie Karlsruhe (eigene Einrichtung gegenüber), Lyse Bruchsal (nur kathetergestützte Verfahren), ECMO/Impella Caritas Bad Mergentheim (Qualitätsbericht: externer Partner).
- St. Josefskrankenhaus Heidelberg: Qualitätsbericht 2024 meldet für das Linksherzkatheter-Gerät keine Notfallverfügbarkeit rund um die Uhr; Katheter bleibt leer.
