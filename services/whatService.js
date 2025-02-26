const puppeteer = require("puppeteer");
const {
  SessionException,
  QRCodeRetrievalError,
  AuthenticationException,
  TimeOutException,
} = require("../exceptions");
const { encrypt, decrypt } = require("../utils/cryptoUtility");
const { SELECTORS, SESSION_PATH, SHOW_BROWSER } = require("../constants");
const { checkAuthenticationOnPage } = require("../utils/authentication");
const {
  mkdirSync,
  doesSessionExist,
  generateSessionId,
} = require("../utils/sessionUtility");
const supabase = require("../config/supabaseClient");
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Initializes a new WhatsApp Web session and returns the encrypted session ID.
 * The session is initialized with an optional parameter to show the browser.
 *
 * @param {boolean} showBrowser - Whether to show the browser during session initialization (defaults to false).
 * @returns {Promise<object>} - Returns a promise resolving to an object containing the encrypted session ID.
 */
const initializeNewWhatsWebSession = async (showBrowser = false) => {
  // Initialize the WhatsApp Web session with the showBrowser flag
  const { sessionId: rawSessionid, browser } =
    await initializeWhatsAppWebSession(null, SHOW_BROWSER);

  // Close the browser after session initialization
  console.log("closing browser....");
  await browser.close();

  // Encrypt the raw session ID and return it in an object
  return { sessionId: encrypt(rawSessionid) };
};

/**
 * Initializes a new WhatsApp Web session with an optional session ID and browser visibility.
 * The function creates a new session directory if it doesn't exist and starts a new Puppeteer browser instance.
 *
 * @param {string|null} reqSessionId - The session ID to use, or null to generate a new session ID (defaults to null).
 * @param {boolean} showBrowser - Whether to show the browser during session initialization (defaults to false).
 * @returns {Promise<object>} - Returns an object containing the session ID, browser instance, and page instance.
 */
const initializeWhatsAppWebSession = async (
  reqSessionId = null,
  showBrowser = false
) => {
  // Log the requested session ID (or null if not provided)
  console.log("reqSessionId: " + reqSessionId);

  // Generate a new session ID if one is not provided
  const sessionId = reqSessionId ? reqSessionId : generateSessionId();

  // Define the path where the session data will be stored
  const sessionPath = `${SESSION_PATH}/${sessionId}`;

  // Check if the session directory exists, and create it if it doesn't
  if (!doesSessionExist(sessionId)) {
    mkdirSync(sessionPath);
  }

  // Log the starting session information
  console.log(`Starting WhatsApp session: ${sessionId}`);

  // Configure Puppeteer arguments
  const args = {
    headless: !showBrowser, // Run headless or not based on showBrowser flag
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(), // Use system-installed Chromium
    userDataDir: sessionPath, // Use session-specific data directory
    args: [
      "--no-sandbox", // Required to run Puppeteer in a container
      "--disable-setuid-sandbox", // Helps avoid permission issues
      "--disable-dev-shm-usage", // Prevents crashes due to shared memory issues
      "--disable-gpu", // Disables GPU acceleration (improves stability)
      "--single-process", // Forces Chromium to run in a single process
      "--disable-software-rasterizer", // Prevents GPU-related issues
      "--no-zygote",
      "--mute-audio", // Prevents unnecessary audio processing
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-background-timer-throttling",
      "--disable-background-networking",
      "--disable-extensions", // Disable browser extensions
    ],
  };

  // Launch a new Puppeteer browser instance with the specified arguments
  const browser = await puppeteer.launch(args);
  const page = await browser.newPage();

  // Block unnecessary resource types, but **allow stylesheets**
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (["image", "font", "media", "xhr"].includes(resourceType)) {
      request.abort(); // Block images, fonts, media
    } else {
      request.continue();
    }
  });

  // Handle dialog boxes by automatically accepting them
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  // Set a custom user agent to mimic a real browser
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
  );

  // Set a default timeout for page interactions
  page.setDefaultTimeout(60000); // 60 seconds

  // Log that the WhatsApp Web page is being opened
  console.log("Opening WhatsApp Web...");

  // Navigate to the WhatsApp Web URL
  await page.goto("https://web.whatsapp.com", {
    waitUntil: "networkidle2",
    timeout: 0,
  });

  // Return an object containing sessionId, browser instance, and page instance
  return { sessionId, browser, page };
};

/**
 * Function to check if a user session is authenticated.
 * @param {string} sessionId - The session ID to verify authentication for.
 * @returns {Object} - The result of the authentication check with sessionId and authentication status.
 */
async function checkAuthentication(reqSessionId) {
  const sessionId = decrypt(reqSessionId);

  // Ensure the session exists before continuing
  if (!(sessionId && doesSessionExist(sessionId))) {
    console.error(`Session ${sessionId} does not exist.`);
    return { sessionId: null, authenticated: false };
  }

  // Get the browser and page objects for WhatsApp Web session
  const { browser, page } = await initializeWhatsAppWebSession(
    sessionId,
    SHOW_BROWSER
  );

  console.log("Authenticating...");

  try {
    // Check authentication
    const isAuthenticated = await checkAuthenticationOnPage(page);

    return {
      sessionId: reqSessionId,
      authenticated: isAuthenticated,
    };
  } catch (error) {
    console.error("Error during authentication check:", error);
    return { sessionId: reqSessionId, authenticated: false };
  } finally {
    // Close the browser session after authentication check
    console.log("closing browser....");
    await browser.close();
  }
}

/**
 * Generates and emits a QR code for the given session ID.
 * It ensures that the session exists, initializes WhatsApp Web, checks if authentication is required,
 * and then retrieves and returns the QR code data.
 *
 * @param {string} reqSessionId - The session ID for which the QR code should be generated.
 * @returns {Promise<string>} - Returns a promise that resolves to the QR code data.
 * @throws {SessionException} - Thrown if the session does not exist.
 * @throws {InvalidPageException} - Thrown if the page instance is invalid.
 * @throws {QRCodeRetrievalError} - Thrown if there is an error retrieving QR code data.
 * @throws {QRScannedException} - Thrown if authentication is already completed.
 */
const generateAndEmitQRCode = async (reqSessionId) => {
  console.log("Generating QR code for session:", reqSessionId);

  // Ensure the session exists
  const sessionId = decrypt(reqSessionId);

  // Check if the session exists
  if (!doesSessionExist(sessionId)) {
    console.error(`Session ${sessionId} does not exist.`);
    throw new SessionException(`Session ${sessionId} does not exist.`);
  }
  console.log(`Session ${sessionId} found:`);

  // Initialize WhatsApp Web session and retrieve the page instance
  const { browser, page } = await initializeWhatsAppWebSession(
    sessionId,
    SHOW_BROWSER
  );

  // Ensure the page instance is valid
  if (!page || typeof page.waitForSelector !== "function") {
    console.error(`Invalid page instance for session ${sessionId}`);
    throw new InvalidPageException(
      `Invalid page instance for session ${sessionId}`
    );
  }

  // Check if the session is already authenticated
  const isAlreadyAuthenticated = await checkAuthenticationOnPage(page);

  // If already authenticated, no QR scan is needed
  if (isAlreadyAuthenticated) {
    console.log("no QR scan is needed");
    throw new AuthenticationException(
      `QR Scan not required for session ${sessionId}`
    );
  }

  // Retrieve the QR code data
  const qrData = await getQRCodeData(page).catch((error) => {
    throw new QRCodeRetrievalError("Error fetching QR Code data:", error);
  });

  // If QR data is retrieved, log and return it
  if (qrData) {
    console.log("QR Code Data:", qrData);
    console.log("QR Code generated and emitted, waiting for scan...");
    return { browser, page, qrData };
  } else {
    // Handle failure to retrieve QR code data
    console.log("Failed to retrieve QR Code data.");
    throw new QRCodeRetrievalError("Failed to retrieve QR Code data.");
  }
};

/**
 * Retrieves the QR code data from the WhatsApp Web page.
 * It waits for the QR code to appear on the page and then extracts the QR code data attribute.
 *
 * @param {Object} page - The Puppeteer page object representing the WhatsApp Web session.
 * @returns {Promise<string|null>} - Returns a promise that resolves to the QR code data, or null if not found.
 */
async function getQRCodeData(page) {
  console.log("Waiting for QR Code...");

  try {
    // Wait for the QR code to appear on the page, with a timeout of 60 seconds
    await page.waitForSelector(SELECTORS.QRCODE_DATA, { timeout: 60000 });
  } catch (err) {
    // Log any error if waiting for the QR code selector fails
    console.log(err);
  }

  // Extract the QR code data from the page
  const qrcodeData = await page.evaluate((SELECTORS) => {
    // Find the QR code element using the provided selector
    let qrcodeDiv = document.querySelector(SELECTORS.QRCODE_DATA);

    // If the QR code element exists, return the value of the data attribute
    return qrcodeDiv
      ? qrcodeDiv.getAttribute(SELECTORS.QRCODE_DATA_ATTR)
      : null; // Return null if no QR code is found
  }, SELECTORS);

  // Return the QR code data (or null if not found)
  return qrcodeData;
}

/**
 * Waits for the QR code to be scanned and the session to be authenticated.
 * It waits until the QR code disappears from the page, indicating that the QR scan was successful.
 *
 * @param {string} reqSessionId - The session ID for which QR code scanning should be awaited.
 * @throws {SessionException} - Thrown if the session does not exist.
 * @throws {InvalidPageException} - Thrown if the page instance is invalid.
 * @throws {QRScannedException} - Thrown if the QR code scan is completed or if there is a timeout.
 */
async function waitQRCode(reqSessionId) {
  const sessionId = decrypt(reqSessionId);

  // Ensure session exists
  if (!doesSessionExist(sessionId)) {
    console.error(`Session ${sessionId} does not exist.`);
    throw new SessionException(`Session ${sessionId} does not exist.`);
  }
  console.log(`Session ${sessionId} found:`);

  // Initialize the WhatsApp Web session and get the page object
  // Get the browser and page objects for WhatsApp Web session
  const { browser, page } = await initializeWhatsAppWebSession(
    sessionId,
    SHOW_BROWSER
  );

  // Ensure the page instance is valid
  if (!page || typeof page.waitForSelector !== "function") {
    console.error(`Invalid page instance for session ${sessionId}`);
    throw new InvalidPageException(
      `Invalid page instance for session ${reqSessionId}`
    );
  }

  // Check if the user is already authenticated (QR scan not required)
  const isAlreadyAuthenticated = await checkAuthenticationOnPage(page);

  if (isAlreadyAuthenticated) {
    throw new AuthenticationException(
      `QR Scan not required for session ${sessionId}`
    );
  }

  // Wait for the QR code to disappear, indicating the QR scan is successful
  try {
    await page.waitForSelector(SELECTORS.QRCODE_DATA, {
      timeout: 30000, // Wait for a maximum of 30 seconds
      hidden: true, // Wait until QR code disappears (scanned)
    });
  } catch (error) {
    // Log any errors that occur during the QR code waiting process
    console.error("QR Code scan timeout:", err.message);
    // If waiting for QR code scan times out, throw an error
    throw new TimeOutException("QR Code scan timeout:", err.message);
  } finally {
    // Close the browser after the process is done
    console.log("closing browser....");
    await browser.close();
  }
}

/**
 * Waits for the QR code to be scanned and the session to be authenticated.
 * It waits until the QR code disappears from the page, indicating that the QR scan was successful.
 *
 * @param {Object} browser - The Puppeteer browser objects for WhatsApp Web session.
 * @param {Object} page - The Puppeteer page object representing the WhatsApp Web session.
 */
async function waitQRCodeOnPage(browser, page) {
  // Ensure the page instance is valid
  if (!page || typeof page.waitForSelector !== "function") {
    console.error(`Invalid page instance for session ${sessionId}`);
    throw new InvalidPageException(
      `Invalid page instance for session ${reqSessionId}`
    );
  }

  // Wait for the QR code to disappear, indicating the QR scan is successful
  try {
    await page.waitForFunction(SELECTORS.INSIDE_CHAT, { timeout: 30000 });
  } catch (error) {
    // Log any errors that occur during the QR code waiting process
    console.error("QR Code scan timeout:", error.message);
    // If waiting for QR code scan times out, throw an error
    throw new TimeOutException("Dont't be late to scan the QR Code.");
  } finally {
    console.log("closing browser....");
    await browser.close();
  }
}

/**
 * Generates a custom message by replacing placeholders with contact properties
 * @param {object} contact - Contact with properties
 * @param {string} template - Message template with placeholders
 * @returns {string} - Formatted message
 */
function generateCustomMessage(contact, template) {
  return Object.entries(contact).reduce(
    (msg, [key, value]) => msg.replace(new RegExp(`{{${key}}}`, "g"), value),
    template
  );
}

/**
 * Sends a message to a given phone number via WhatsApp Web
 * @param {string|object} phoneOrContact - Phone number or contact object
 * @param {string} message - Message to send
 */
async function sendTo(page, phoneOrContact, message) {
  const phone =
    typeof phoneOrContact === "object" ? phoneOrContact.phone : phoneOrContact;
  const finalMessage =
    typeof phoneOrContact === "object"
      ? generateCustomMessage(phoneOrContact, message)
      : message;

  try {
    console.log("Sending Message...\r");
    await page.goto(
      `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
        finalMessage
      )}`
    );
    await page.waitForSelector(SELECTORS.LOADING, {
      hidden: true,
      timeout: 60000,
    });
    await page.waitForSelector(SELECTORS.SEND_BUTTON, { timeout: 10000 });
    await page.keyboard.press("Enter");
    await sleep(3000);
    console.log("Success send message...");
  } catch (err) {
    console.log(err);
  }
}

// sendRequest: [
//   { message: "YOUR_MESSAGE", numbers: [] },
//   { message: "YOUR_MESSAGE", numbers: [] },
// ];

/**
 * Sends the same message to multiple phone numbers or contacts concurrently
 * @param {Array<string|object>} phoneOrContacts - List of phone numbers or contact objects
 * @param {string} message - Message to send
 */
async function sendMessage(reqSessionId, messages) {
  const sessionId = decrypt(reqSessionId);

  // Ensure session exists
  if (!doesSessionExist(sessionId)) {
    console.error(`Session ${sessionId} does not exist.`);
    throw new SessionException(`Session ${sessionId} does not exist.`);
  }
  console.log(`Session ${sessionId} found:`);

  // Initialize the WhatsApp Web session and get the page object
  // Get the browser and page objects for WhatsApp Web session
  const { browser, page } = await initializeWhatsAppWebSession(
    sessionId,
    SHOW_BROWSER
  );

  // Ensure the page instance is valid
  if (!page || typeof page.waitForSelector !== "function") {
    console.error(`Invalid page instance for session ${sessionId}`);
    throw new InvalidPageException(
      `Invalid page instance for session ${reqSessionId}`
    );
  }

  // Check if the user is already authenticated (QR scan not required)
  const isAlreadyAuthenticated = await checkAuthenticationOnPage(page);

  if (!isAlreadyAuthenticated) {
    throw new AuthenticationException(
      `Not an authenticated session: ${sessionId}`
    );
  }

  try {
    console.log(messages);
    for (let message of messages) {
      await sendToWrapper(page, message.numbers, message.message);
    }
    return { message: "done" };
  } catch (error) {
    console.log(error);
    return { error: "failed" };
  } finally {
    console.log("closing browser....");
    await browser.close();
  }
}

async function sendToWrapper(page, phoneOrContacts, message) {
  // await Promise.all(
  //   phoneOrContacts.map((phoneOrContact) =>
  //     sendTo(page, phoneOrContact, message)
  //   )
  // );
  for (let phone of phoneOrContacts) {
    await sendTo(page, phone, message);
  }
}

// async function scheduleMessage(sessionId, message, sendAt, recipient) {
//   const { data, error } = await supabase.from("scheduled_messages").insert([
//     {
//       session_id: sessionId,
//       message,
//       send_at: sendAt,
//       recipient,
//       sent: false,
//     },
//   ]);

//   if (error) {
//     console.error("Error saving scheduled message:", error);
//   } else {
//     console.log("Message scheduled:", data);
//   }
// }

module.exports = {
  initializeNewWhatsWebSession,
  generateAndEmitQRCode,
  waitQRCode,
  waitQRCodeOnPage,
  checkAuthentication,
  sendMessage,
};
