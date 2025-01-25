const { sendEmailNotification } = require("../config/emailService");
const logger = require("../utils/logger");

async function sendApplicationReport({
  to,
  appliedJobs,
  skippedJobs,
  attachments,
}) {

  const appliedJobsHtml =
    appliedJobs.length > 0
      ? appliedJobs
          .map(
            (job) => `
          <tr>
            <td>${job.title}</td>
            <td>${job.company}</td>
            <td>${job.location || "N/A"}</td>
            <td>${job.appliedAt}</td>
           <td>${job?.matchPercentage.toFixed(2)}%</td>
              <td>${job.matchedSkills.join(", ")}</td>
          </tr>
        `
          )
          .join("")
      : [];

  const skippedJobsHtml = skippedJobs
    .map((job) => {
      return job?.reason &&
        (job.reason ===
          "Apply failed: Application did not complete successfully" ||
          job.reason === "Company website redirect")
        ? `
              <tr>
                <td>${job.title}</td>
                <td>${job.company}</td>
                <td>${job.location || "N/A"}</td>
                <td>${job.reason}</td>
                <td><a href="${job.link}" target="_blank">${job.link}</a></td>
                <td>${
                  job?.matchPercentage ? job.matchPercentage.toFixed(2) : "N/A"
                }%</td>
                <td>${
                  job.matchedSkills ? job.matchedSkills.join(", ") : "N/A"
                }</td>
              </tr>
            `
        : "";
    })
    .join("");

  const emailHtml = `
          <h2>Job Application Report</h2>
          
          <h3>Successfully Applied Jobs (${appliedJobs.length})</h3>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px;">Title</th>
                <th style="padding: 8px;">Company</th>
                <th style="padding: 8px;">Location</th>
                <th style="padding: 8px;">Applied At</th>
                 <th style="padding: 8px;">Match Percentage</th>
          <th style="padding: 8px;">Matched Skills</th>
              </tr>
            </thead>
            <tbody>
              ${
                appliedJobsHtml ||
                '<tr><td colspan="4" style="text-align:center;">No jobs applied</td></tr>'
              }
            </tbody>
          </table>
      
          <h3>Skipped Jobs (${skippedJobs.length})</h3>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px;">Title</th>
                <th style="padding: 8px;">Company</th>
                <th style="padding: 8px;">Location</th>
                <th style="padding: 8px;">Reason</th>
                <th style="padding: 8px;">Link</th>
                <th style="padding: 8px;">Match Percentage</th>
                <th style="padding: 8px;">Matched Skills</th>
              </tr>
            </thead>
            <tbody>
              ${
                skippedJobsHtml ||
                '<tr><td colspan="5" style="text-align:center;">No jobs skipped</td></tr>'
              }
            </tbody>
          </table>
        `;

  await sendEmailNotification(`Naukri Job Application Report`, emailHtml, {
    to,
    attachments,
  });

  logger.info("Application report email sent successfully");
}

module.exports = sendApplicationReport;
