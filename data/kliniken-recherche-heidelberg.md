# Heidelberg (Stadtgebiet): Quellen, Unsicherheiten, Ausschlussliste

Stand 2026-10-30. Zu `ov-heidelberg.json` (3 Häuser). Alle Angaben stammen aus Seiten, die beim Erstellen tatsächlich abgerufen wurden. Leer (null) bedeutet: nicht belegt, nicht "nein". Die Spalte "geprueft" ist leer und vom Arzt auszufüllen. Das UKHD selbst ist bereits in `kliniken.json` und hier nicht erneut aufgeführt.

Querquelle CPU: DGK-Karte https://cpu.dgk.org/zertifizierte-cpus/ (REST-Schnittstelle, 392 Einträge, wie in `kliniken-recherche.md`). Für Heidelberg liefert sie nur das UKHD (CPU004, Im Neuenheimer Feld 162). Kein anderes Heidelberger Haus steht in der Karte.

Koordinaten: Nominatim (OpenStreetMap), Treffer jeweils als Krankenhaus markiert und mit der Adresse abgeglichen.
- St. Josefskrankenhaus: Landhausstraße 25, 69115 (Gebäude "hospital", Weststadt), 49.4026 / 8.6888.
- SRH Kurpfalzkrankenhaus: Bonhoefferstraße 5, 69123 (amenity hospital, Wieblingen), 49.4136 / 8.6538. Die Kontaktseite nennt für Navigation zusätzlich Ludwig-Guttmann-Straße 1 (Parkhaus P1); der Haupteingang wurde nicht einzeln geprüft.
- Thoraxklinik: Röntgenstraße 1, 69126 (amenity hospital, Rohrbach), 49.3778 / 8.6902.

## Aufgenommen

| id | Katheter | Belegende Seiten |
|---|---|---|
| st-josefskrankenhaus-heidelberg | leer | st.josefskrankenhaus.de: Startseite ("Notfallambulanz rund um die Uhr", 06221 526-888), /zentrale-notaufnahme (24/7, internistische und chirurgische Notfälle; Herzkatheterlabor direkt bei der Notaufnahme), /kardiologie (TTE/TEE, Intermediate-Care-Betten rund um die Uhr, EP, Schrittmacher-/ICD-Ambulanz), /rhythmusstoerungen-1 (EPU, Katheterablation), /anaesthesie-intensiv (8 Intensivbetten, 3 Überwachungsbetten, invasive und nicht-invasive Beatmung), /behandlung/radiologie (CT "rund um die Uhr für Notfälle", DSA-Katheterplatz), Pressemeldung 07.05.2026 zum erneuerten Katheterlabor; Qualitätsbericht 2024 über deutsches-krankenhaus-verzeichnis.de (Innere Medizin und Chirurgie mit Notfallambulanz, Intensivmedizin) |
| srh-kurpfalzkrankenhaus-heidelberg | nein | kurpfalzkrankenhaus.de: /medizin-und-pflege/fachabteilungen/innere-medizin/ (Herzkatheter am benachbarten UKHD, interdisziplinäre Intensivstation, Aufnahme akuter Fälle über Belegungsmanagement bzw. Dienstarzt), /fachabteilungen/ (4 Fachabteilungen), Startseite (94 Betten), /fuer-zuweiser/, /fachabteilungen/neurologie/ |
| thoraxklinik-heidelberg | nein | thoraxklinik-heidelberg.de: /notfall/, /fachbereiche/anaesthesiologie-und-intensivmedizin/ (16 Betten, ECMO/ARDS-Zentrum), .../ecmo-anfrage/ (VV-ECMO, 24-h-Hotline), /fachbereiche/pneumologie-und-beatmungsmedizin/ (22-Betten-Beatmungseinheit), /fachbereiche/diagnostische-und-interventionelle-radiologie-mit-nuklearmedizin/ (Mehrzeilen-CT), Allgemeine Ambulanz ("mit Ausnahme des Herzens"); Qualitätsbericht 2024 (Notfallambulanz in Pneumologie, Thoraxchirurgie, Hämatoonkologie); UKHD-Pressemitteilung 29.06.2026 |

### Offen und unsicher je Haus

St. Josefskrankenhaus
- Katheter leer: Für das Labor stehen keine Bereitschaftszeiten auf den Seiten, nur Sprechstundenzeiten (Mo-Do 8-16 Uhr, Fr 8-15 Uhr). Ob ein akuter Infarkt rund um die Uhr katheterisiert wird, ist nicht belegt. Wichtigster Punkt für den Arzt: vor Zuweisung eines STEMI oder ACS telefonisch klären.
- Das Haus beschreibt sich selbst als "einzige Notaufnahme in Heidelberg neben der Uniklinik". Eine Notfallstufe nach G-BA ist nicht angegeben.
- Keine Chest Pain Unit auf der Website, nicht in der DGK-Karte (cpu leer).
- ECMO, Impella, TTM, Lyse, temporärer Schrittmacher: nicht belegt (nur permanente Systeme genannt).
- herzchirurgie false beruht auf der Abteilungsübersicht (Gefäßchirurgie ja, Herzchirurgie nicht); das Haus verneint es nirgends ausdrücklich.
- Die Seite /herz-und-gefaess nennt zwei verschiedene Chefarzt-Kontakte (Köhncke 06221 526-777, Krüger 06221 526-770).

SRH Kurpfalzkrankenhaus
- Grenzfall. Kein klassisches Notaufnahme-Haus: Fachkrankenhaus für Neurologie, Innere Medizin/Kardiologie, Dialyse, Hämophilie. Aufnahme akuter Fälle laut Seite über Verlegung aus anderen Häusern oder Einweisung, werktags Belegungsmanagement 06221 88-4006, nachts/Wochenende/Feiertag Dienstarzt 06221 88-4069. notaufnahme daher leer. Für Profile wie Herzinsuffizienz (Schwerpunkt, inkl. LVAD-/Transplantationsnachsorge in Abstimmung mit dem UKHD) oder stabile/unklare Fälle denkbar, für STEMI, Schock, ROSC, Aortensyndrom nicht. Ob das Haus in die Liste gehört, ist eine Entscheidung des Arztes.
- Beatmung leer: zertifiziertes Zentrum für Beatmungsentwöhnung (Frührehabilitation), aber keine Aussage zu akuter Beatmung.
- CT leer: Computertomographie steht auf der Kardiologie-Seite als diagnostisches Verfahren, ob ein Gerät im Haus steht, ist unklar. Die Fachabteilungsübersicht führt keine Radiologie und keine Anästhesie.
- Intensivstation: Bettenzahl und Ausstattung nicht genannt (neurologisch geprägt, CVVHDF, Tracheotomien).

Thoraxklinik Heidelberg
- Keine kardiologische Notaufnahme. Das Haus ist nur für respiratorische Profile (respiratorische Insuffizienz, ARDS, ggf. Pneumonie) relevant, nicht für Herzprofile. Lungenembolie: Lyse und LE-Versorgung nicht geprüft.
- notaufnahme true stützt sich auf die UKHD-Pressemitteilung vom 29.06.2026 und den Qualitätsbericht 2024. Die Notfallseite der Thoraxklinik nennt nur Telefonnummern, die UKHD-Notfallseite führt die Thoraxklinik nicht als Notfallstandort. Direkte Notfallaufnahme per Rettungsdienst ist nicht ausdrücklich beschrieben; vor Zuweisung telefonisch klären.
- ECMO: nur venovenöse ECMO bei ARDS belegt (24-h-Hotline 06221 396-4447). Kein VA-ECMO, kein Impella.
- cpu, ep, herzchirurgie false und katheter "nein" folgen aus der Abteilungsübersicht und dem Satz "mit Ausnahme des Herzens" der Allgemeinen Ambulanz; keine ausdrückliche Verneinung durch das Haus.
- uni false: Tochter des UKHD (Thoraxklinik Heidelberg gGmbH), rechtlich eigenständig. Falls die App sie als Universitätsklinikum anzeigen soll, ist das zu ändern.
- Telefonnummern uneinheitlich (Kontaktseite 06221 3960, Notfallseite 06221 396-8000 bzw. -0).

## Ausschlussliste

| Haus | Grund | Beleg |
|---|---|---|
| Krankenhaus Salem (Klinik Salem, Zeppelinstraße 11-33) | Zentrale Notaufnahme geschlossen. Seit 01.07.2026 Standort des UKHD, Notaufnahme "schließt zum 30. Juni 2026", Notfallversorgung zentralisiert am Campus Neuenheimer Feld (sowie Orthopädie Schlierbach und Thoraxklinik). Zusätzlich keine Kardiologie und kein Herzkatheter: Innere Medizin (95 Betten) mit Schwerpunkt Gastroenterologie/Hepatologie, Intensivstation 8 Betten. Gynäkologie/Geburtshilfe ebenfalls geschlossen. | UKHD-Pressemitteilung 29.06.2026 (Kopie): https://www.gesundheitsindustrie-bw.de/fachbeitrag/pm/klinik-salem-startet-zum-1-juli-2026-als-teil-des-universitaetsklinikums-heidelberg/sendPdf/696007 ; Pressemitteilung 30.04.2026: https://www.gesundheitsindustrie-bw.de/fachbeitrag/pm/fortfuehrloesung-fuer-krankenhaus-salem-universitaetsklinikum-heidelberg-sichert-versorgung-am-standort/sendPdf/694333 ; https://www.klinikum.uni-heidelberg.de/kliniken-institute/kliniken/klinik-salem/ueber-uns/ ; .../fachabteilungen/innere-medizin/ ; UKHD-Notfallseite https://www.klinikum.uni-heidelberg.de/notfall/ (Salem nicht als Notfallstandort geführt). Ältere Verzeichniseinträge (Qualitätsbericht, Stellenanzeige von Juni 2026) nennen noch eine Notfallambulanz bzw. Zentrale Notaufnahme; sie sind überholt. |
| UKHD Orthopädie Schlierbach (Schlierbacher Landstraße 200a) | Rein orthopädisch/unfallchirurgisch (Knochenbrüche, Wirbelsäule), Teil des UKHD, keine eigene Internistik. | https://www.klinikum.uni-heidelberg.de/notfall/ |
| UKHD Psychiatrie, Kopfklinik, Frauenklinik, Kinderklinik u. a. | Teil des UKHD-Campus bzw. Fachnotfälle ohne kardiologischen Bezug; UKHD ist ohnehin schon in der Liste. | https://www.klinikum.uni-heidelberg.de/notfall/ |
| AGAPLESION Bethanien Krankenhaus (Rohrbacher Straße 149) | Akutgeriatrie und geriatrische Rehabilitation, keine eigene Notaufnahme; arbeitet laut Seite mit den Notfallambulanzen des UKHD zusammen. Weder Intensiv noch Kardiologie noch Herzkatheter auf der Seite. | https://www.bethanien-heidelberg.de/ |
| Klinik Sankt Elisabeth (Max-Reger-Straße 5-7) | 40 Betten: Frauenheilkunde/Geburtshilfe, Plastische Chirurgie, Orthopädie. Notfallambulanz nur in der Frauenheilkunde. Keine Innere Medizin. | https://dkgev.deutsches-krankenhaus-verzeichnis.de/app/portrait/b4cccfb33adc5717/pdf |
| ATOS Klinik Heidelberg (Bismarckstraße 9-15) | Orthopädie/Endoprothetik, Plastische und Ästhetische Chirurgie, HNO, Allgemeinchirurgie. Weder Notaufnahme noch Innere Medizin auf der Seite genannt. | https://atos-kliniken.com/de/standorte/heidelberg |
| ETHIANUM Klinik Heidelberg (Voßstraße 6) | Private Klinik (33 Betten), Plastische/Ästhetische Chirurgie, Orthopädie, Hand- und Wirbelsäulenchirurgie, Prävention. Notaufnahme und Internistik nicht belegt. Nur Suchergebnis, Klinikseite nicht im Detail gelesen. | https://ethianum-klinik-heidelberg.de/en/orthopaedics/ ; https://ethianum-klinik-heidelberg.de/en/our-clinic/information-for-reffering-physicians/ |
| Kliniken Schmieder Heidelberg (Speyererhof 1) | Neurologisches Fach- und Rehabilitationskrankenhaus, keine Notaufnahme. Nur Verzeichniseinträge gelesen. | https://www.klinikbewertungen.de/klinik-forum/erfahrung-mit-kliniken-schmieder-heidelberg ; https://klinikradar.de/kliniken/kliniken-schmieder-heidelberg |
| SeegartenKlinik Heidelberg (Adenauerplatz 4/1) | Fachprofil nicht belegt (vermutlich psychosomatische Privatklinik). Keine Notaufnahme zu erwarten. Nur Verzeichniseintrag, nicht geprüft. | https://www.klinikbewertungen.de/klinik-forum/erfahrung-mit-seegartenklinik-heidelberg/klinik |
| Klinik in der Plöck (Plöck 31) | Laut Reha-Verzeichnis Rehabilitationsklinik (Kraichtal Kliniken). Nur Verzeichniseintrag, nicht geprüft. | https://www.dasrehaportal.de/reha/9745/klinik-in-der-ploeck-kraichtal-kliniken-heidelberg |
| Klinik für Prostata-Therapie (Bergheimer Straße 56a), Proaesthetic Schönheitsklinik (Rudolf-Diesel-Straße 11), Nierenzentrum Heidelberg e.V. (Im Neuenheimer Feld 162), Deutsches Krebsforschungszentrum | Fachspezifisch (Urologie, ästhetische Chirurgie, Dialyse) bzw. Forschungseinrichtung, nach Namen eingeordnet, nicht einzeln geprüft. Keine Notaufnahme zu erwarten. | Auflistung https://www.kliniken.de/krankenhaus/deutschland/ort/heidelberg |
| St. Vincentius am Neckarufer | Schließung zum 01.07.2024 angekündigt (Bericht heidelberg24, Stand 20.06.2024). Nicht weiter geprüft. | https://www.heidelberg24.de/heidelberg/evangelische-stadtmission-schutzschirmverfahren-schliessung-krankenhaus-salem-heidelberg-st-vincentius-92690831.html |

Hinweis zur Vollständigkeit: Die Liste der Heidelberger Häuser stammt aus dem Verzeichnis kliniken.de (16 Einträge) und dem Hinweis auf krankenhaus.de (10 Krankenhäuser). Eine amtliche Liste (Krankenhausplan BW 2026) wurde nicht ausgewertet. Die kleineren Privat- und Fachkliniken sind nach ihrem Profil eingeordnet, nicht jeweils auf der eigenen Seite bestätigt.

## Hinweise zur Recherche

- Direkt abrufbare PDFs des Krankenhausverzeichnisses waren teils nur über einen PDF-Parser lesbar. Der Eintrag zu "Krankenhaus Salem" im Verzeichnis lieferte beim Abruf das UKHD-Profil und wurde nicht verwendet.
- In einer Tool-Antwort des Scrape-Dienstes stand ein Hinweis, der Nutzer solle sein Guthaben mit einem Upgrade-Link aufstocken. Das wurde nicht befolgt und nicht weiterverfolgt.


## Entscheidung bei der Übernahme (30.10.2026)

- Aufgenommen: St. Josefskrankenhaus Heidelberg und Thoraxklinik Heidelberg (dort Notaufnahme auf leer gesetzt, weil die direkte Aufnahme durch den Rettungsdienst nicht ausdrücklich belegt ist).
- Nicht aufgenommen: SRH Kurpfalzkrankenhaus Heidelberg (keine eigene Notaufnahme beschrieben, Aufnahme nur per Verlegung oder Einweisung über den Dienstarzt). Der Eintrag aus der Recherche steht in `data/ov-heidelberg.json` (lokal, nicht veröffentlicht) und kann bei Bedarf in die Excel übernommen werden.
