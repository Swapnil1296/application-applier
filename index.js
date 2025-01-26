const { scrapeNaukriJobs } = require("./src/scraper/scraper");
const { autoApplyToJobs } = require("./src/autoApply/autoApply");
const loginToNaukri = require("./src/auth/loginToNaukar");
const autoApplyToJobsSf = require("./src/failSafe/autoApplyToJobs");
const logger = require("./src/utils/logger");
const puppeteer = require("puppeteer");
const { getApplicationCount } = require("./src/helpers/appliedCount");
const { autoApplyToJobsUsingAi } = require("./src/autoApply/autoApplyUsingAi");
require("dotenv").config();

async function main() {
  try {
    const credentials = {
      username: process.env.NAUKRI_USERNAME,
      password: process.env.NAUKRI_PASSWORD,
    };

    const emailConfig = {
      to: process.env.EMAIL_RECIPIENT, // Email to receive reports
    };

    const options = {
      maxPages: 1,
      experience: 3,
      jobAge: 1,
      autoApply: true,
    };
    // const successfullyApplied = await getApplicationCount();
    // if (successfullyApplied >= 50) {
    //   logger.info("=====>Reached max limit of applicaton<========");
    //   return;
    // }
    // First scrape the jobs
    const jobs = await scrapeNaukriJobs("react js developer", options);
    logger.info(`===>Scraping completed. Found ${jobs?.length} jobs`);

    if (options.autoApply) {
      logger.info("Starting auto-apply process...");

      const browser = await puppeteer.launch({
        headless: false,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-features=FederatedCredentialManagement",
        ],
      });

      try {
        //## safe fail
        // const applicationResults = await autoApplyToJobsSf(
        //   jobs, // Array of scraped jobs
        //   credentials, // Login credentials
        //   emailConfig, // Email configuration for reports
        //   browser // Browser instance
        // );
        const applicationResults = await autoApplyToJobs(
          jobs, // Array of scraped jobs
          credentials, // Login credentials
          emailConfig, // Email configuration for reports
          browser // Browser instance
        );
        //## USING AI
        // const applicationResults = await autoApplyToJobsUsingAi(
        //   jobs,
        //   credentials,
        //   {  // Pass as an object
        //     resumePath: './src/aiAnalyzeJobMatch/Swapnil_Landage-3YOE.pdf',
        //     emailConfig,
        //     existingBrowser: browser
        //   }
        // );

        logger.info(`Auto-apply completed:`);
        logger.info(
          `- Successfully applied: ${applicationResults?.applied?.length} jobs`
        );
        logger.info(`- Skipped: ${applicationResults?.skipped?.length} jobs`);
      } finally {
        await browser.close();
      }
    }
  } catch (error) {
    logger.error("Main function error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  scrapeNaukriJobs,
  autoApplyToJobs, // Export the new function
  loginToNaukri, // Export the new function
};
