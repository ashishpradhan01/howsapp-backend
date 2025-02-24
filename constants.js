const fs = require("fs");

const SELECTORS = {
  LOADING: "progress",
  INSIDE_CHAT: "document.getElementsByClassName('two')[0]",
  QRCODE_PAGE: "body > div > div > .landing-wrapper",
  QRCODE_DATA: "div[data-ref]",
  QRCODE_DATA_ATTR: "data-ref",
  SEND_BUTTON: 'div:nth-child(2) > button > span[data-icon="send"]',
  AUTO_LOGOUT_INPUT: `document.getElementById("auto-logout-toggle")`,
};

const SESSION_PATH = process.env.SESSION_PATH;
const SHOW_BROWSER = false;

module.exports = { SELECTORS, SESSION_PATH, SHOW_BROWSER };
