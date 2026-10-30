# Klinikliste Rohentwurf: Belege und offene Punkte

Stand 2026-10-30. Zu `kliniken-entwurf.json` (28 Häuser). Alle Angaben stammen aus Seiten, die beim Erstellen tatsächlich abgerufen wurden. Leer (null) bedeutet: nicht belegt, nicht "nein". Spalte "geprueft" ist leer und vom Arzt auszufüllen.

Querquelle für alle CPU-Angaben: DGK-Karte der zertifizierten Chest Pain Units, https://cpu.dgk.org/zertifizierte-cpus/ (Daten über die REST-Schnittstelle der Karte, 392 Einträge; die Seite nennt 405 zertifizierte CPUs). Angezeigt wird nur "Zertifiziert seit/am"; ob die Zertifikate aktuell gültig sind, wurde nicht einzeln geprüft.

Koordinaten: Nominatim (OpenStreetMap), je ein Treffer mit Straße und Ort, Treffer auf Krankenhaus geprüft (Ausnahmen siehe unten).

## Belege je Haus

| id | Katheter | Belegende Seiten (Kurzform) |
|---|---|---|
| ukhd | leer | klinikum.uni-heidelberg.de: /einrichtungen/chest-pain-unit-827/, /einrichtungen/kardio-pulmonale-intensiv-und-wachstation-herzinsuffizienz-wachstation-829/ (ECMO, Impella, Beatmung, Hypothermie), /verfahren/herzkatheteruntersuchung-innere-med-iii-200592/ (4 Kathetersäle), /notfall/, Zentrum für Herzrhythmusstörungen; DGK-Karte CPU004 |
| umm | 24/7 | umm.de/i-medizinische-klinik/leistungsspektrum/ herzkatheterlabor (24-Stunden-Herzkatheterbereitschaft), chest-pain-unit-cpu, intensivmedizin (Beatmung, Impella, ECLS, systemische Lyse bei LAE), elektrophysiologie; /integriertes-notfallzentrum/notfall/; DGK CPU003 |
| theresienkrankenhaus-mannheim | 24/7 | bk-julia-lanz.de: kardiologie-...-theresienkrankenhaus-leistungen.php (24-Stunden-Herzkatheter-Bereitschaft, Ganzkörperkühlung, Beatmung, EP), zentrale-notaufnahme-tkh.php; DGK CPU010 |
| klinikum-ludwigshafen | leer | klilu.de: notfallversorgung/herzinfarkt_chest_pain_unit (CPU rund um die Uhr, Herzkatheterlabor direkt nebenan), Klinik Kardiologie (Med. Klinik B), herzzentrum_ludwigshafen (Herzchirurgie, CT); DGK CPU093 |
| grn-schwetzingen | 24/7 | grn.de/schwetzingen/klinik/kardiologie/die-fachdisziplin; grn.de/herz-und-gefaesse (24-h-Bereitschaft Herzkatheter-Labore Schwetzingen, Weinheim, Eberbach); grn.de/notfallversorgung; DGK CPU401 |
| grn-weinheim | 24/7 | grn.de/weinheim/klinik/kardiologie-angiologie-pneumologie/die-fachdisziplin (CT vor Ort); grn.de/herz-und-gefaesse; grn.de/notfallversorgung |
| grn-eberbach | 24/7 | grn.de/herz-und-gefaesse; grn.de/eberbach/klinik/kardiologie-und-angiologie/die-fachdisziplin; grn.de/notfallversorgung |
| grn-sinsheim | leer | grn.de/sinsheim/klinik/kardiologie-und-angiologie/die-fachdisziplin (Intensivstation, Beatmungsverfahren); grn.de/notfallversorgung |
| diakonissen-speyer | leer | diakonissen.de/diakonissen-stiftungs-krankenhaus-speyer/innere-medizin/schwerpunkte/kardiologie-angiologie/ (+ /chest-pain-unit-brustschmerz/); DGK CPU055 |
| hetzelstift-neustadt | leer | hetzelstift.de Fachabteilungen: innere-medizin-i-kardiologie-schlaganfalleinheit (2 Katheterlabore, Impella, EPU, Kardio-CT), anaesthesiologie-und-intensivmedizin-... (18 Betten, Beatmung), institut-fuer-diagnostische-und-interventionelle-radiologie; DGK CPU295 |
| kkh-bergstrasse-heppenheim | 24/7 | kkh-bergstrasse.de/medizinische-abteilungen/zentrale-notaufnahme/ (24h-Bereitschaft Herzkatheterlabor, CT 24 h), .../brustschmerzeinheit-chest-pain-unit-1, .../anaesthesie-intensivmedizin/...; DGK CPU137 |
| asklepios-kandel | leer | asklepios.com/kandel/.../abteilungen/kardiologie; asklepios.com/kandel/notfall; DGK CPU448 (zertifiziert am 20.10.2026) |
| klinikum-karlsruhe | 24/7 | klinikum-karlsruhe.de/einrichtungen/medizinische-kliniken/medizinische-klinik-iv/allgemeines/leistungsspektrum/ chest-pain-unit (rund um die Uhr, 4 Katheterlabore), cardiac-arrest-center, sektion-elektrophysiologie; DGK CPU120 |
| klinikum-mittelbaden-rastatt | 24/7 | klinikum-mittelbaden.de/klinik-fachbereiche/kardiologie-angiologie/ (CPU Rastatt: 24 Stunden Bereitschaft Herzkatheter), .../zentrale-notaufnahme/; DGK CPU411 |
| vidia-vincentius-karlsruhe | leer | vidia-kliniken.de/medizin-pflege/kliniken-institute/kardiologie-intensivmedizin-und-angiologie/, .../zentrale-notaufnahme/; DGK CPU069 |
| slk-heilbronn-gesundbrunnen | leer | slk-kliniken.de: .../klinik-fuer-innere-medizin-i-.../notfall, /intensivmedizin (16 Betten, Beatmung, ECMO-Zentrum), /kardiologie-gb; DGK CPU031 |
| slk-bad-friedrichshall-plattenwald | 24/7 | slk-kliniken.de/kardiologie-pla (Herzkatheter, CT 24 Stunden; Intensiv/IMC 22 Betten; CPU 24h-Betrieb); DGK CPU140 |
| caritas-bad-mergentheim | 24/7 | ckbm.de/ckbm/medizin-pflege/fachabteilungen/medizinische-klinik-i/ (zwei Herzkatheterlabore rund um die Uhr, Impella, VA-ECMO, Beatmung); DGK CPU426 |
| klinikum-darmstadt | 24/7 | klinikum-darmstadt.de/medizin-pflege/medizinische-klinik-i (Katheterlabore, CPU, Intensiv, "24 Stunden am Tag, 7 Tage"), /notfall (7/24/365); DGK CPU138 |
| alice-hospital-darmstadt | leer | alice-hospital.de/fachbereiche/kardiologie (+ /cpu); DGK CPU116 |
| helios-erlenbach | leer | helios-gesundheit.de/standorte-angebote/kliniken/erlenbach/fachbereiche/kardiologie/ (nur per Abruf-Zusammenfassung); DGK CPU185 |
| westpfalz-klinikum-kaiserslautern | leer | westpfalz-klinikum.de: innere-medizin-2-kaiserslautern (15 Intensivbetten, 7 Beatmungsplätze, CPU), zentrum-intensivmedizin-kaiserslautern (ECMO), herz-lungen-gefaesschirurgie-kaiserslautern; DGK CPU033 |
| rkh-fuerst-stirum-bruchsal | 24/7 | rkh-gesundheit.de/fuerst-stirum-klinik-bruchsal/behandlung/fachabteilungen/klinik-fuer-kardiologie-angiologie-diabetologie-neurologie-und-intensivmedizin/ |
| helios-pforzheim | 24/7 | helios-gesundheit.de/standorte-angebote/kliniken/pforzheim/fachbereiche/kardiologie/ und /intensivmedizin/ (nur per Abruf-Zusammenfassung); DGK CPU214 |
| siloah-st-trudpert-pforzheim | leer | siloah.de Startseite und Unterseite Herzkatheterlabor (nur per Abruf-Zusammenfassung); DGK CPU231 |
| klinikum-aschaffenburg-alzenau | 24/7 | klinikum-ab-alz.de/klinik/medizinische-klinik-i-kardiologie-nephrologie-pneumologie-rhythmologie/; DGK CPU357 |
| klinikum-landau-suew | 24/7 | klinikum-ld-suew.de: .../kardiologie-herzzentrum-landau/herzinfarktnetz-suedpfalz (24-stündige Rufbereitschaft), .../leistungsschwerpunkte-1/kardiologie (passagere Schrittmacher, EP) |

## Offen / unsicher

Katheterzeiten
- Katheter leer bei 12 Häusern: Herzkatheterlabor ist vorhanden, aber auf den geprüften Seiten steht keine Zeitangabe. Betrifft auch das UKHD (nur "alle Patienten mit akutem Herzinfarkt werden notfallmäßig im Herzkatheterlabor behandelt"), Ludwigshafen (CPU "rund um die Uhr", Labor "direkt nebenan", aber kein ausdrücklicher Satz zur Katheterbereitschaft), Speyer, Neustadt, Kandel, Vincentius Karlsruhe, Heilbronn, Alice-Hospital, Erlenbach, Kaiserslautern, Siloah, Sinsheim.
- Darmstadt: "24/7" aus dem Satzzusammenhang (Katheterlabore, CPU, Intensivstation "aus einer Hand ... 24 Stunden am Tag, 7 Tage die Woche"), kein eigener Satz zum Katheterlabor.
- Landau: nur "24-stündige Rufbereitschaft" des Herzinfarktnetzwerks; Rufbereitschaft, nicht Präsenzdienst. Eintrag "24/7" ist deshalb nachzuprüfen.
- Rastatt: Zeit gilt für den Standort Rastatt; Baden-Baden Balg hat ein eigenes Katheterlabor, hier nicht erfasst.
- Sinsheim: Laut GRN-Seite haben nur Schwetzingen, Weinheim, Eberbach 24-h-Katheterbereitschaft. Für Sinsheim keine Katheterzeit; ein Katheterlabor in Sinsheim wurde nicht belegt (nur "ambulante Herzkatheteruntersuchung" für Zuweiser).

Chest Pain Unit
- cpu = null bei Weinheim, Eberbach, Sinsheim, Bruchsal, Landau: nicht in der abgerufenen DGK-Karte. Die Karte lieferte 392 Einträge, die Webseite nennt 405; ob dazwischen Lücken liegen, ist ungeklärt, deshalb "leer" und nicht "nein".
- Gültigkeit der Zertifikate nicht geprüft (Karte zeigt nur Erstzertifizierung). Kandel erst seit 20.10.2026.

Seiten, die nicht direkt abrufbar waren
- Helios Erlenbach, Helios Pforzheim, Siloah Pforzheim: Inhalt nur über die Zusammenfassung des Abruftools (Direktabruf Helios: 403). Zitate sind nicht Wort für Wort geprüft.
- vincentius-kliniken.de nicht erreichbar, stattdessen ViDia-Seiten.
- klinikum-karlsruhe.com: Zertifikatsfehler, die Seiten liegen unter klinikum-karlsruhe.de.

Einzelne Felder mit Einschränkung
- ecmo_impella: Hetzelstift nur Impella; Heilbronn "überregionales ECMO-Zentrum" im Corona-Kontext (Aktualität offen); UKHD, UMM, Worms, Speyer, Karlsruhe, Kaiserslautern, Bad Mergentheim belegt.
- lyse: nur UMM (systemische Lyse bei Lungenembolie). Worms nennt nur kathetergestützte ultraschallassistierte Lyse, deshalb leer.
- ttm: UKHD ("therapeutische Hypothermie zur Postreanimationsbehandlung") und Theresienkrankenhaus ("kontrollierte Ganzkörperkühlung"). Sonst nirgends belegt.
- herzchirurgie: nur UKHD (Herzchirurgie/Herzzentrum auf der UKHD-Site, Leistungsseite nicht im Detail gelesen), Ludwigshafen, Kaiserslautern. Alle anderen leer, auch wo eine Kooperation genannt wird (Speyer, Heppenheim, Bad Mergentheim, Rastatt, Erlenbach, Pforzheim, Theresienkrankenhaus).
- ct: Vincentius nur Randnotiz "Realisiert: Kernspintomograph, Computertomograph und 3D C-Bogen"; Theresienkrankenhaus Kardio-CT in Kooperation mit der Radiologie; Eberbach Kardio-CT nur in Kooperation mit Weinheim (leer).
- schrittmacher_temp: nur Landau ("passagere und permanente Schrittmacher-Systeme"). Sonst nirgends ausdrücklich genannt.
- notaufnahme leer bei Speyer (Seite nennt "Zentrale Aufnahme"), Alice-Hospital, Kaiserslautern, Bruchsal, Siloah (nur Seite "Akut- und Notfallmedizin"), Aschaffenburg (nicht geprüft). Ludwigshafen: true, gestützt auf "internistische Notaufnahme" in der CPU-Seite.
- intensiv leer bei Alice-Hospital: Seite verweist für Intensivmedizin auf den Standort Elisabethenstift (kein Beleg für "nein" im Haus).

Koordinaten
- Theresienkrankenhaus Mannheim: Nominatim liefert für Bassermannstraße 1 nur ein Haus ohne Klinik-Markierung; Adresse laut DGK-Karte, Suche mit Namen lieferte keinen Treffer.
- Eberbach: Treffer "GRN-Klinik Eberbach, Scheuerbergstraße 3". Die zuerst versuchte Adresse (Neckarstraße 36) war nicht belegt und wurde verworfen.
- Karlsruhe Klinikum: Treffer ist Haus A (Verwaltung) auf dem Gelände Moltkestraße 90.

Nicht aufgenommen (zu dünne oder keine Belege, nicht geprüft)
- Neckar-Odenwald-Kliniken Mosbach und Buchen: keine Seite zu Herzkatheterlabor gefunden.
- Frankenthal, Bensheim, Pirmasens (zu weit), Groß-Umstadt (CPU laut DGK-Karte seit 30.03.2020, Fachseite lieferte keine Inhalte), Mainz (Uniklinik und Katholisches Klinikum, ca. 70 km), Frankfurter Häuser, Kerckhoff-Klinik Bad Nauheim, Ludwigsburg, Stuttgart, Würzburg, Tübingen: außerhalb des Kerns oder nicht bearbeitet.
- St. Josefskrankenhaus Heidelberg, Diakonissen Mannheim, BG Klinik Ludwigshafen, St. Marienkrankenhaus Ludwigshafen, Bretten, Ettlingen, Germersheim: nicht bearbeitet.
