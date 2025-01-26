const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");
const logger = require("../utils/logger");
const { sendEmailNotification } = require("../config/emailService");
const { extractJobsFromPage } = require("./pageExtractor");

async function getTotalPages(page) {
  try {
    // Wait for the jobs list header to appear
    await page.waitForSelector(".styles_count-string__DlPaZ", {
      timeout: 15000,
    });

    const totalJobs = await page.evaluate(() => {
      const countElement = document.querySelector(
        ".styles_count-string__DlPaZ"
      );
      if (!countElement) return 0;

      // Extract the text content (e.g., "81 - 100 of 2790")
      const countText =
        countElement.getAttribute("title") || countElement.textContent;

      // Modified regex to capture the entire number after "of"
      const match = countText.match(/of\s+(\d+)/);
      if (!match) return 0;

      // Convert the matched number to integer
      const totalJobs = parseInt(match[1]);
      console.log("Extracted total jobs:", totalJobs); // Debug log
      return totalJobs;
    });

    // Calculate total pages (20 jobs per page) using Math.ceil to round up
    const totalPages = Math.ceil(totalJobs / 20);

    logger.info(`Found ${totalJobs} total jobs across ${totalPages} pages`);

    // Return the calculated pages, with fallback to 50 if something goes wrong
    return totalPages || 50;
  } catch (error) {
    logger.error("Error getting total pages:", error);
    return 50; // Default to 50 pages if detection fails
  }
}

// Handle successful scraping

async function handleScrapingSuccess(jobs, filename, searchQuery, options) {
  const timestamp = new Date().toLocaleString();
  const emailBody = `
   <h2 style="color: #2c3e50; font-family: Arial, sans-serif; text-align: center; margin-bottom: 20px;">
  Job Scraping Completed Successfully
</h2>
<p style="font-family: Arial, sans-serif; font-size: 14px; color: #34495e; margin-bottom: 10px;">
  <strong>Timestamp:</strong> ${timestamp}
</p>
<p style="font-family: Arial, sans-serif; font-size: 14px; color: #34495e; margin-bottom: 10px;">
  <strong>Search Query:</strong> ${searchQuery}
</p>
<p style="font-family: Arial, sans-serif; font-size: 14px; color: #34495e; margin-bottom: 20px;">
  <strong>Total Jobs Found:</strong> ${jobs.length}
</p>
<h3 style="font-family: Arial, sans-serif; font-size: 16px; color: #2c3e50; margin-bottom: 10px;">
  Applied Filters:
</h3>
<ul style="font-family: Arial, sans-serif; font-size: 14px; color: #34495e; list-style-type: disc; margin-left: 20px;">
  ${
    options.experience
      ? `<li style="margin-bottom: 5px;">Experience: ${options.experience} years</li>`
      : ""
  }
  ${
    options.jobAge
      ? `<li style="margin-bottom: 5px;">Job Age: ${options.jobAge} days</li>`
      : ""
  }
  ${
    options.location
      ? `<li style="margin-bottom: 5px;">Location: ${options.location}</li>`
      : ""
  }
  ${
    options.workMode
      ? `<li style="margin-bottom: 5px;">Work Mode: ${options.workMode}</li>`
      : ""
  }
  ${
    options.salary
      ? `<li style="margin-bottom: 5px;">Salary Range: ${options.salary}</li>`
      : ""
  }
</ul>
<p style="font-family: Arial, sans-serif; font-size: 14px; color: #34495e; margin-top: 20px;">
  Please find the complete job listings in the attached JSON file.
</p>

  `;

  await sendEmailNotification(
    `Job Scraping Successful - ${jobs.length} Jobs Found`,
    emailBody,
    [
      {
        filename: filename,
        path: path.join(process.cwd(), filename),
        contentType: "application/json",
      },
    ]
  );
}

// Handle scraping failure
async function handleScrapingFailure(
  error,
  partialJobs,
  searchQuery,
  failedPage = null
) {
  const timestamp = new Date().toLocaleString();
  let partialDataFilename = null;

  if (partialJobs.length > 0) {
    partialDataFilename = `naukri-jobs-partial-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    await fs.writeFile(
      partialDataFilename,
      JSON.stringify(partialJobs, null, 2)
    );
  }

  const emailBody = `
    <h2>Job Scraping Failed</h2>
    <p><strong>Timestamp:</strong> ${timestamp}</p>
    <p><strong>Search Query:</strong> ${searchQuery}</p>
    ${failedPage ? `<p><strong>Failed at Page:</strong> ${failedPage}</p>` : ""}
    <p><strong>Error Message:</strong> ${error.message}</p>
    <p><strong>Partial Jobs Retrieved:</strong> ${partialJobs.length}</p>
    ${
      partialJobs.length > 0
        ? "<p>Partial data is attached to this email.</p>"
        : ""
    }
    <h3>Error Details:</h3>
    <pre>${error.stack}</pre>
  `;

  const attachments = [];
  if (partialDataFilename) {
    attachments.push({
      filename: partialDataFilename,
      path: path.join(process.cwd(), partialDataFilename),
      contentType: "application/json",
    });
  }

  await sendEmailNotification(
    `Job Scraping Failed - ${partialJobs.length} Partial Jobs Retrieved`,
    emailBody,
    attachments
  );
}

async function scrapeNaukriJobs(searchQuery, options = {}) {
  const {
    maxPages = 5,
    experience = null,
    jobAge = null,
    location = null,
    workMode = null,
    salary = null,
  } = options;

  // Get current application count

  let browser;
  let partialJobs = [];

  try {
    logger.info("Launching browser...");
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-features=FederatedCredentialManagement",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        logger.debug("Browser console:", msg.text());
      }
    });

    const baseUrl = "https://www.naukri.com";
    const searchTerm = searchQuery.replace(/\s+/g, "-").toLowerCase();

    const urlParams = new URLSearchParams();
    urlParams.append("k", searchQuery.replace(/-/g, " "));
    urlParams.append("nignbevent_src", "jobsearchDeskGNB");

    if (experience) urlParams.append("experience", experience);
    if (jobAge) urlParams.append("jobAge", jobAge);
    if (location) urlParams.append("location", location);
    if (workMode) urlParams.append("workType", workMode);
    if (salary) urlParams.append("salary", salary);

    // Initial URL for first page
    const url = `${baseUrl}/${searchTerm}-jobs?${urlParams.toString()}`;
    logger.info("Navigating to:", url);

    let pageLoaded = false;
    let retryCount = 0;
    while (!pageLoaded && retryCount < 3) {
      try {
        await page.goto(url, {
          waitUntil: ["networkidle0", "domcontentloaded"],
          timeout: 30000,
        });
        await page.waitForSelector(".srp-jobtuple-wrapper", { timeout: 15000 });
        pageLoaded = true;
      } catch (error) {
        retryCount++;
        logger.error(`Page load attempt ${retryCount} failed:`, error);
        if (retryCount === 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    const totalAvailablePages = await getTotalPages(page);
    logger.info(`Total available pages: ${totalAvailablePages}`);

    const pagesToScrape = Math.max(maxPages, totalAvailablePages);
    logger.info(`Will scrape ${pagesToScrape} pages`);

    const allJobs = [];
    for (let currentPage = 1; currentPage <= pagesToScrape; currentPage++) {
      logger.info(`Scraping page ${currentPage} of ${pagesToScrape}`);

      if (currentPage > 1) {
        // Modified URL construction for pagination
        const pageUrl = `${baseUrl}/${searchTerm}-jobs-${currentPage}?${urlParams.toString()}`;
        let pageLoadSuccess = false;
        let pageRetries = 0;

        while (!pageLoadSuccess && pageRetries < 3) {
          try {
            await page.goto(pageUrl, {
              waitUntil: ["networkidle0", "domcontentloaded"],
              timeout: 30000,
            });
            await page.waitForSelector(".srp-jobtuple-wrapper", {
              timeout: 15000,
            });
            pageLoadSuccess = true;
          } catch (error) {
            pageRetries++;
            logger.error(
              `Failed to load page ${currentPage}, attempt ${pageRetries}:`,
              error
            );
            if (pageRetries === 3) break;
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }

        if (!pageLoadSuccess) {
          logger.error(`Skipping page ${currentPage} after failed attempts`);
          continue;
        }
      }

      const jobs = await extractJobsFromPage(page, currentPage);
      logger.info(`Found ${jobs.length} jobs on page ${currentPage}`);

      if (jobs.length > 0) {
        allJobs.push(...jobs);
      } else {
        logger.debug("No jobs found on page, waiting and retrying...");
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const retryJobs = await extractJobsFromPage(page, currentPage);
        if (retryJobs.length > 0) {
          allJobs.push(...retryJobs);
          logger.info(`Retrieved ${retryJobs.length} jobs after retry`);
        } else {
          logger.error(
            `No jobs found on page ${currentPage} after retry, may have reached end`
          );
          break;
        }
      }

      if (currentPage < pagesToScrape) {
        const delay = Math.floor(Math.random() * (5000 - 3000 + 1) + 3000);
        logger.info(`Waiting ${delay}ms before next page...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // const filename = `naukri-jobs-${timestamp}.txt`;
    // await fs.writeFile(filename, JSON.stringify(allJobs, null, 2), "utf8");
    // logger.info(`Saved ${allJobs.length} jobs to ${filename}`);
    // await handleScrapingSuccess(allJobs, filename, searchQuery, options);

    return allJobs;
  } catch (error) {
    await handleScrapingFailure(error, partialJobs, searchQuery);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  scrapeNaukriJobs,
};
