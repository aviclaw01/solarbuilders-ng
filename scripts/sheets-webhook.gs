/**
 * SolarBuilders → Google Sheet backup (see app/lib/sheets.ts).
 *
 * Setup, once, in the Google Sheet that should hold the orders:
 *   1. Extensions → Apps Script. Paste this file. Save.
 *   2. Project Settings → Script properties → add WEBHOOK_SECRET (any long
 *      random string; the same value goes in Vercel as SHEETS_WEBHOOK_SECRET).
 *   3. Deploy → New deployment → Web app. Execute as: Me. Who has access:
 *      Anyone. Copy the URL into Vercel as SHEETS_WEBHOOK_URL.
 *
 * Rows go to the tab named TAB, or the first tab if there is none. Each key in the posted row
 * lands under the column with that header (case and spaces ignored); a key with
 * no column gets a new column at the end. Rename or reorder columns freely.
 */
var TAB = 'Orders';

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!secret || body.secret !== secret) return json({ ok: false, error: 'forbidden' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(TAB) || ss.getSheets()[0];
    var row = body.row || {};
    var norm = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); };

    var width = Math.max(sheet.getLastColumn(), 1);
    var headers = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
    var index = {};
    headers.forEach(function (h, i) { if (h !== '') index[norm(h)] = i; });

    Object.keys(row).forEach(function (k) {
      if (index[norm(k)] === undefined) {
        headers.push(k);
        index[norm(k)] = headers.length - 1;
        sheet.getRange(1, headers.length).setValue(k).setFontWeight('bold');
      }
    });

    var out = headers.map(function () { return ''; });
    Object.keys(row).forEach(function (k) {
      var v = row[k];
      out[index[norm(k)]] = v === null || v === undefined ? '' : v;
    });
    sheet.appendRow(out);
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
