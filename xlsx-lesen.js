/*
 * Minimaler Leser für das erste Blatt einer XLSX-Datei (und CSV) im Browser, ohne Bibliothek.
 * Eine XLSX ist ein ZIP; entpackt wird mit DecompressionStream. Angelehnt an den Kern
 * des Skills /auswertungstool (10-xlsx.js), hier auf das Nötige verkleinert:
 * Texte und Zahlen, keine Formeln, keine Datumsformate (Datum bitte als Text JJJJ-MM-TT).
 */
(function (root) {
  "use strict";

  function dv(b) { return new DataView(b.buffer, b.byteOffset, b.byteLength); }

  function zipEntries(bytes) {
    var d = dv(bytes), n = bytes.length, eocd = -1, i;
    for (i = n - 22; i >= Math.max(0, n - 65557); i--) {
      if (d.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("Das ist keine gültige Excel-Datei (ZIP-Verzeichnis fehlt).");
    var count = d.getUint16(eocd + 10, true), p = d.getUint32(eocd + 16, true), entries = {};
    for (i = 0; i < count; i++) {
      if (d.getUint32(p, true) !== 0x02014b50) break;
      var method = d.getUint16(p + 10, true), comp = d.getUint32(p + 20, true);
      var nl = d.getUint16(p + 28, true), el = d.getUint16(p + 30, true), cl = d.getUint16(p + 32, true);
      var off = d.getUint32(p + 42, true);
      var name = new TextDecoder("utf-8").decode(bytes.subarray(p + 46, p + 46 + nl));
      var start = off + 30 + d.getUint16(off + 26, true) + d.getUint16(off + 28, true);
      entries[name] = { method: method, data: bytes.subarray(start, start + comp) };
      p += 46 + nl + el + cl;
    }
    return entries;
  }

  function inflateRaw(bytes) {
    var ds = new DecompressionStream("deflate-raw");
    var w = ds.writable.getWriter();
    w.write(bytes); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }

  function text(entries, name) {
    var e = entries[name];
    if (!e) return Promise.resolve(null);
    var raw = e.method === 0 ? Promise.resolve(e.data) : inflateRaw(e.data);
    return raw.then(function (b) { return new TextDecoder("utf-8").decode(b); });
  }

  function unesc(s) {
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(+n); })
      .replace(/&#x([0-9a-f]+);/gi, function (m, n) { return String.fromCharCode(parseInt(n, 16)); })
      .replace(/&amp;/g, "&");
  }

  function sharedStrings(xml) {
    var out = [];
    if (!xml) return out;
    var re = /<si>([\s\S]*?)<\/si>/g, m;
    while ((m = re.exec(xml))) {
      var parts = m[1].match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [], s = "";
      parts.forEach(function (t) { s += unesc(t.replace(/<[^>]+>/g, "")); });
      out.push(s);
    }
    return out;
  }

  function colIndex(ref) {
    var n = 0;
    for (var i = 0; i < ref.length; i++) n = n * 26 + (ref.charCodeAt(i) - 64);
    return n - 1;
  }

  function sheet(xml, shared) {
    var rows = [], rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g, rm;
    while ((rm = rowRe.exec(xml))) {
      var cells = [], cellRe = /<c\s+([^>\/]*)(?:\/>|>([\s\S]*?)<\/c>)/g, cm;
      while ((cm = cellRe.exec(rm[1]))) {
        var ref = /\br="([A-Z]+)\d+"/.exec(cm[1]), t = /\bt="([^"]+)"/.exec(cm[1]);
        var idx = ref ? colIndex(ref[1]) : cells.length, type = t ? t[1] : "n", body = cm[2] || "", val = null;
        if (type === "inlineStr") {
          var im = /<t[^>]*>([\s\S]*?)<\/t>/.exec(body);
          val = im ? unesc(im[1]) : "";
        } else {
          var vm = /<v>([\s\S]*?)<\/v>/.exec(body);
          if (vm) {
            if (type === "s") val = shared[+vm[1]] !== undefined ? shared[+vm[1]] : "";
            else if (type === "b") val = vm[1] === "1" ? "ja" : "nein";
            else if (type === "str" || type === "e") val = unesc(vm[1]);
            else val = isFinite(parseFloat(vm[1])) ? parseFloat(vm[1]) : unesc(vm[1]);
          }
        }
        cells[idx] = val;
      }
      rows.push(cells);
    }
    return rows;
  }

  function leseXlsx(bytes) {
    var entries = zipEntries(bytes);
    return Promise.all([text(entries, "xl/sharedStrings.xml"), text(entries, "xl/_rels/workbook.xml.rels"),
      text(entries, "xl/workbook.xml")]).then(function (res) {
      var path = "xl/worksheets/sheet1.xml";
      if (res[2] && res[1]) {
        var rid = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(res[2]);
        if (rid) {
          var rel = new RegExp('<Relationship\\b[^>]*\\bId="' + rid[1] + '"[^>]*>').exec(res[1]);
          var tg = rel && /\bTarget="([^"]+)"/.exec(rel[0]);
          if (tg) path = "xl/" + tg[1].replace(/^\/?xl\//, "").replace(/^\//, "");
        }
      }
      if (!entries[path]) path = "xl/worksheets/sheet1.xml";
      return text(entries, path).then(function (xml) {
        if (xml === null) throw new Error("Das erste Tabellenblatt wurde nicht gefunden.");
        var rows = sheet(xml, sharedStrings(res[0]));
        if (!rows.length) throw new Error("Das Tabellenblatt ist leer.");
        return { header: rows[0].map(function (h) { return h === null || h === undefined ? "" : String(h); }), zeilen: rows.slice(1) };
      });
    });
  }

  function leseCsv(str) {
    if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
    var first = str.split(/\r?\n/)[0], delim = ";", best = -1;
    [";", ",", "\t"].forEach(function (d) { var n = first.split(d).length - 1; if (n > best) { best = n; delim = d; } });
    var rows = [], row = [], f = "", q = false, i, c;
    for (i = 0; i < str.length; i++) {
      c = str[i];
      if (q) { if (c === '"') { if (str[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
      if (c === '"') q = true;
      else if (c === delim) { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f.length || row.length) { row.push(f); rows.push(row); }
    if (!rows.length) throw new Error("Die CSV-Datei ist leer.");
    return { header: rows[0], zeilen: rows.slice(1) };
  }

  /** @param file File aus <input type=file> oder Drop. */
  function lies(file) {
    if (/\.csv$/i.test(file.name)) return file.text().then(leseCsv);
    if (!/\.xlsx$/i.test(file.name)) return Promise.reject(new Error("Bitte eine .xlsx- oder .csv-Datei wählen."));
    return file.arrayBuffer().then(function (b) { return leseXlsx(new Uint8Array(b)); });
  }

  root.XlsxLesen = { lies: lies, leseXlsx: leseXlsx, leseCsv: leseCsv };
})(typeof self !== "undefined" ? self : this);
