
/**
 * ---------------------------------------------------------
 * 🚨 CRITICAL: GOOGLE APPS SCRIPT SETUP INSTRUCTIONS 🚨
 * ---------------------------------------------------------
 * 
 * You are getting a "SyntaxError: Unexpected token 'export'" because you pasted 
 * THIS whole file into Google Apps Script. DO NOT DO THAT.
 * 
 * Instead, follow these steps:
 * 
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. DELETE everything in the 'Code.gs' file.
 * 4. PASTE ONLY THE CODE INSIDE THE BLOCK BELOW:
 * 
 * ================== COPY FROM HERE ==================
 * 
 * function doPost(e) {
 *   var lock = LockService.getScriptLock();
 *   lock.tryLock(10000);
 *   
 *   try {
 *     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *     var data = JSON.parse(e.postData.contents);
 *     
 *     // Adds a timestamp, the role (user/assistant), and the message
 *     sheet.appendRow([new Date(), data.role, data.text]);
 *     
 *     return ContentService.createTextOutput(JSON.stringify({'result': 'success'}))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   } catch (e) {
 *     return ContentService.createTextOutput(JSON.stringify({'result': 'error', 'error': e}))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   } finally {
 *     lock.releaseLock();
 *   }
 * }
 * 
 * ================== TO HERE ==================
 * 
 * 5. Click "Deploy" > "New deployment".
 * 6. Select type: "Web app".
 * 7. Description: "Chat Logger".
 * 8. Execute as: "Me".
 * 9. Who has access: "Anyone" (IMPORTANT: Must be 'Anyone' or it will fail).
 * 10. Click "Deploy".
 * 11. Copy the "Web App URL" and paste it into the React App.
 */

export const saveToGoogleSheets = async (url: string, role: string, text: string) => {
  if (!url) {
    console.warn("Google Sheets Web App URL is missing.");
    return;
  }

  try {
    // We use no-cors mode because Google Apps Script redirects, which standard CORS fetch blocks.
    // The request will be 'opaque' (you won't see the response body), but the data 
    // WILL be sent to the sheet successfully.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role, text }),
    });
    console.log(`Saved to Sheets: [${role}] ${text.substring(0, 20)}...`);
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
  }
};
