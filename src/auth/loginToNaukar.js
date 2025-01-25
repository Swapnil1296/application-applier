const logger = require("../utils/logger");

async function loginToNaukri(page, credentials) {
  try {
    logger.info("Attempting to login to Naukri...");

    await page.goto("https://www.naukri.com/nlogin/login", {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 60000,
    });

    await page.waitForSelector(
      'input[placeholder="Enter Email ID / Username"]',
      {
        timeout: 60000,
      }
    );

    await page.type(
      'input[placeholder="Enter Email ID / Username"]',
      credentials.username
    );
    await page.type(
      'input[placeholder="Enter Password"]',
      credentials.password
    );
    await page.click('button[type="submit"]');

    // Wait for successful login
    await Promise.race([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
      page.waitForSelector('[class*="nI-gNb-drawer"]', { timeout: 60000 }),
    ]);

    // Store session data
    const cookies = await page.cookies();
    const localStorage = await page.evaluate(() =>
      Object.assign({}, window.localStorage)
    );
    const sessionStorage = await page.evaluate(() =>
      Object.assign({}, window.sessionStorage)
    );

    return {
      cookies,
      localStorage,
      sessionStorage,
    };
  } catch (error) {
    logger.error("Login failed:", error);
    throw error;
  }
}
module.exports = loginToNaukri;
