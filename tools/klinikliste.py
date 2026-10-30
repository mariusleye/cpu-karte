"""Pflege der Klinikliste: JSON <-> Excel.

  python tools/klinikliste.py json2xlsx data/kliniken.json "26-10-30 Klinikliste CPU-Karte.xlsx"
  python tools/klinikliste.py xlsx2json "26-10-30 Klinikliste CPU-Karte.xlsx" data/kliniken.json

Die Excel ist die Pflegedatei. Leere Zelle = unbekannt (zählt in der App wie "nein", wird gelb gezeigt).
Ja/Nein-Felder: "ja" oder "nein". Katheter: "24/7" oder Zeitfenster wie "Mo-Fr 07:00-17:00; Sa 08:00-12:00"
(Tage Mo, Di, Mi, Do, Fr, Sa, So, Feiertag), "nein" oder leer. Stand als Text JJJJ-MM-TT.
"""
import json
import sys
from datetime import date

from openpyxl import Workbook, load_workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

# (Spaltenname in der Excel, Schlüssel im JSON, Art)
SPALTEN = [
    ("Id", "id", "text"), ("Name", "name", "text"), ("Ort", "ort", "text"),
    ("Breite", "lat", "zahl"), ("Länge", "lon", "zahl"), ("Uni", "uni", "jn"),
    ("Notaufnahme", "notaufnahme", "jn"), ("Katheter", "katheter", "text"),
    ("CPU", "cpu", "jn"), ("Intensiv", "intensiv", "jn"), ("Beatmung", "beatmung", "jn"),
    ("Herzchirurgie", "herzchirurgie", "jn"), ("ECMO/Impella", "ecmo_impella", "jn"),
    ("TTM", "ttm", "jn"), ("EP", "ep", "jn"), ("Lyse", "lyse", "jn"), ("CT", "ct", "jn"),
    ("Schrittmacher temp.", "schrittmacher_temp", "jn"),
    ("Stand", "stand", "text"), ("Quelle", "quelle", "text"), ("Geprüft von", "geprueft", "text"),
    ("Hinweis", "hinweis", "text"),
]

ANLEITUNG = [
    "Klinikliste der CPU-Karte",
    "",
    "Eine Zeile je Haus. Das Haus mit der Id 'ukhd' ist das Vergleichsziel und muss vorhanden sein.",
    "Leere Zelle = unbekannt. Die App behandelt unbekannt wie 'nein' und zeigt es gelb. Nichts raten.",
    "Ja/Nein-Spalten: 'ja' oder 'nein'.",
    "Katheter: '24/7', 'nein' oder Zeitfenster, z. B. 'Mo-Fr 07:00-17:00; Sa 08:00-12:00'.",
    "  Tage: Mo, Di, Mi, Do, Fr, Sa, So, Feiertag (Feiertage Baden-Württemberg; ohne eigenes Fenster wie Sonntag).",
    "  Fenster über Mitternacht sind möglich, z. B. 'Mo-So 20:00-06:00'.",
    "Breite/Länge in Dezimalgrad (Komma oder Punkt).",
    "Stand: Datum der letzten Prüfung dieser Zeile, als Text JJJJ-MM-TT. Nach 90 Tagen warnt die App.",
    "Geprüft von: Name der Person, die die Angaben fachlich bestätigt hat. Leer = nicht ärztlich geprüft.",
    "Quelle: woher die Angabe stammt (Adresse der Seite oder Dokument).",
    "",
    "Danach: python tools/klinikliste.py xlsx2json <diese Datei> data/kliniken.json",
]


def jn_zu_zelle(v):
    return "ja" if v is True else "nein" if v is False else None


def zelle_zu_jn(v):
    if v is None:
        return None
    s = str(v).strip().lower()
    if s in ("ja", "j", "x", "1", "true"):
        return True
    if s in ("nein", "n", "0", "false"):
        return False
    return None


def json2xlsx(src, dst):
    daten = json.load(open(src, encoding="utf-8"))
    wb = Workbook()
    ws = wb.active
    ws.title = "Kliniken"
    ws.append([s[0] for s in SPALTEN])
    for k in daten["kliniken"]:
        zeile = []
        for _, key, art in SPALTEN:
            v = k.get(key)
            zeile.append(jn_zu_zelle(v) if art == "jn" else (v if v not in ("",) else None))
        ws.append(zeile)
    fett = Font(bold=True, color="FFFFFF")
    for c in ws[1]:
        c.font = fett
        c.fill = PatternFill("solid", fgColor="0B4F6C")
        c.alignment = Alignment(wrap_text=True, vertical="center")
    breiten = {"Id": 12, "Name": 36, "Ort": 16, "Katheter": 26, "Quelle": 40, "Hinweis": 40, "Geprüft von": 16, "Stand": 12}
    for i, (name, _, _) in enumerate(SPALTEN, start=1):
        ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = breiten.get(name, 11)
    ws.freeze_panes = "C2"
    letzte = max(ws.max_row, 2) + 200
    dv = DataValidation(type="list", formula1='"ja,nein"', allow_blank=True)
    ws.add_data_validation(dv)
    gelb = PatternFill("solid", bgColor="FFF2A8")
    for i, (_, _, art) in enumerate(SPALTEN, start=1):
        col = ws.cell(row=1, column=i).column_letter
        if art == "jn":
            dv.add(f"{col}2:{col}{letzte}")
        if art == "jn" or col == ws.cell(row=1, column=8).column_letter:
            ws.conditional_formatting.add(
                f"{col}2:{col}{ws.max_row}",
                FormulaRule(formula=[f'AND($B2<>"",{col}2="")'], fill=gelb))
    an = wb.create_sheet("Anleitung")
    for z in ANLEITUNG:
        an.append([z])
    an.column_dimensions["A"].width = 120
    an["A1"].font = Font(bold=True, size=14)
    wb.save(dst)
    print(f"{len(daten['kliniken'])} Häuser nach {dst}")


def xlsx2json(src, dst):
    wb = load_workbook(src, data_only=True)
    ws = wb["Kliniken"] if "Kliniken" in wb.sheetnames else wb.worksheets[0]
    kopf = [str(c.value).strip() if c.value is not None else "" for c in ws[1]]
    index = {name: kopf.index(name) for name, _, _ in SPALTEN if name in kopf}
    fehlend = [n for n, _, _ in SPALTEN if n not in index]
    if fehlend:
        sys.exit("Spalten fehlen: " + ", ".join(fehlend))
    kliniken = []
    for zeile in ws.iter_rows(min_row=2, values_only=True):
        if not any(v not in (None, "") for v in zeile):
            continue
        k = {}
        for name, key, art in SPALTEN:
            v = zeile[index[name]]
            if art == "jn":
                k[key] = zelle_zu_jn(v)
            elif art == "zahl":
                k[key] = float(str(v).replace(",", ".")) if v not in (None, "") else None
            else:
                k[key] = "" if v is None else (v.strftime("%Y-%m-%d") if hasattr(v, "strftime") else str(v).strip())
        kliniken.append(k)
    out = {"erstellt": date.today().isoformat(), "kliniken": kliniken}
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"{len(kliniken)} Häuser nach {dst}")


if __name__ == "__main__":
    if len(sys.argv) != 4 or sys.argv[1] not in ("json2xlsx", "xlsx2json"):
        sys.exit(__doc__)
    (json2xlsx if sys.argv[1] == "json2xlsx" else xlsx2json)(sys.argv[2], sys.argv[3])
