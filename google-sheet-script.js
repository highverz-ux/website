/**
 * ============================================================================
 * HIGHVERZ — GOOGLE SHEET WEBHOOK SYNC SCRIPT (Google Apps Script)
 * ============================================================================
 * 
 * Instructions to connect your Google Sheet in 60 seconds:
 * 
 * 1. Open your Google Sheet where you want leads to be stored.
 * 2. In Google Sheets, click "Extensions" -> "Apps Script".
 * 3. Delete any code in the editor and paste THIS ENTIRE FILE.
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "Highverz Leads Webhook".
 * 7. Set "Execute as": "Me (your email)".
 * 8. Set "Who has access": "Anyone" (IMPORTANT so your website can send leads).
 * 9. Click "Deploy", authorize permissions, and COPY the Web App URL.
 * 10. Paste that Web App URL into the Highverz Admin Leads Portal
 *     (Press Shift + L on the site, or click "🔒 Leads Portal" in the footer)
 *     and click "Save URL".
 * 
 * All submissions from the website will now appear in your Google Sheet in real-time!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();

    // Create header row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Lead Reference ID",
        "Submission Date & Time",
        "Enquiry Category",
        "Client Name",
        "Email or WhatsApp",
        "Instagram / YouTube / Company",
        "Project Message / Goals",
        "Source Page"
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#00e5ff").setFontColor("#000000");
    }

    // Parse incoming JSON data
    var raw = e.postData.contents;
    var data = JSON.parse(raw);

    // Append new lead
    sheet.appendRow([
      data.id || "HV-" + Math.floor(100000 + Math.random() * 900000),
      data.timestamp || new Date().toLocaleString(),
      data.type || "Creator / Personal Brand",
      data.name || "",
      data.contact || "",
      data.handle || "",
      data.message || "",
      data.source || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
