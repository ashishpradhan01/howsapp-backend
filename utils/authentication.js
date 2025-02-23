const { from, merge } = require("rxjs");
const { take } = require("rxjs/operators");

const { SELECTORS } = require("../constants");

/**
 * Function to check the authentication status on the given page.
 * It combines checks for the QR scan requirement and whether the user is inside a chat.
 *
 * @param {Object} page - The page object from the WhatsApp Web session.
 * @returns {Promise<boolean>} - Returns a promise that resolves to the authentication status (true/false).
 */
async function checkAuthenticationOnPage(page) {
  // Combine the checks for whether a QR scan is needed and if the user is inside a chat.
  return await merge(
    isScanRequired(page), // Check if QR scan is required
    isInsideChat(page) // Check if the user is inside a chat
  )
    .pipe(take(1)) // Take only the first result from the merged observable
    .toPromise(); // Convert the observable to a promise
}

/**
 * Checks if a QR code scan is needed.
 * @param {object} page - Puppeteer page instance.
 * @returns {Observable<boolean>} Emits `false` when a QR code is detected.
 */
function isScanRequired(page) {
  console.log("Checks if a QR code scan is needed.");
  return from(
    page
      .waitForSelector(SELECTORS.QRCODE_DATA, { timeout: 0 })
      .then(() => false)
      .catch(() => false) // Ensures function resolves correctly on errors.
  );
}

/**
 * Checks if inside the chat.
 * @param {object} page - Puppeteer page instance.
 * @returns {Observable<boolean>} Emits `true` when inside chat.
 */
function isInsideChat(page) {
  console.log("Checks if inside the chat.");
  return from(
    page
      .waitForFunction(SELECTORS.INSIDE_CHAT, { timeout: 0 })
      .then(() => true)
      .catch(() => false) // Ensures function resolves correctly on errors.
  );
}

module.exports = {
  checkAuthenticationOnPage,
};
