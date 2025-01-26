// function filterJobTitle(jobTitle) {
//   const hasDeveloperOrEngineer = /developer|engineer/i.test(jobTitle);
//   const hasReactKeyword = /react/i.test(jobTitle);
//   const skipKeywords = [
//     "senior", "junior", "mobile", "embedded",
//     "test", "analyst", ".net", "java", "backend"
//   ];

//   const hasSkipKeyword = skipKeywords.some((keyword) =>
//     jobTitle.toLowerCase().includes(keyword)
//   );

//   return {
//     isValidTitle: hasDeveloperOrEngineer && hasReactKeyword && !hasSkipKeyword,
//   };
// }

function filterJobTitle(jobTitle) {
  // Check for Developer or Engineer
  const hasDeveloperOrEngineer = /developer|engineer/i.test(jobTitle);

  // List of keywords to skip
  const skipKeywords = [
    // UI and Design
    "ui",
    "ui/ux",
    "ux",
    "design",
    "angular",
    "vue",
    "html",
    "junior",
    "Phalcon",
    "mulesoft",
    "oic",
    "aem",
    "golang",
    "blockchain",
    "qx",
    "koa",
    "middleware",
    "node",
    "ruby",
    "rails",
    "adobe",
    "core",
    "fusion",
    "power",
    "senior",
    "lucee",
    "coldfusion",
    "hybrid",

    // Mobile and Platform-Specific
    "mobile",
    "android",
    "native",
    "ios",
    "android",
    "app",
    "flutter",
    "magento",

    // Backend and Enterprise Technologies
    "net",
    "dot",
    "dotnet",
    "aspnet",
    "c#",
    "java",
    "j2ee",
    "enterprise",
    "backend",
    "server-side",

    // Web Technologies
    "wordpress",
    "laravel",
    "php",
    "drupal",
    "joomla",
    "content management",
    "cms developer",
    "rust",
    "python",

    // CRM and Specific Platforms
    "salesforce",
    "crm",
    "dynamics",
    "oracle",
    "sap",
    "enterprise resource planning",
    "erp",

    // Specific Domains
    "embedded",
    "hardware",
    "firmware",
    "game",
    "blockchain",
    "security",
    "network",
    "system",
    "cloud",
    "test",
    "analyst",
  ];

  // Check for skip keywords
  const hasSkipKeyword = skipKeywords.some((keyword) =>
    jobTitle.toLowerCase().includes(keyword)
  );

  return {
    isValidTitle: hasDeveloperOrEngineer && !hasSkipKeyword,
  };
}
function checkFullstackRequirements(jobTitle, description, skillChips) {
  // Check for Fullstack Developer/Engineer
  const isFullstack = /fullstack\s*(developer|engineer)/i.test(jobTitle);

  // If Fullstack, check for Node.js
  if (isFullstack) {
    const nodeKeywords = ["node", "node.js", "nodejs", "backend"];

    const hasNodeKeyword = nodeKeywords.some(
      (keyword) =>
        description.toLowerCase().includes(keyword) ||
        skillChips.some((skill) => skill.toLowerCase().includes(keyword))
    );

    return {
      isValidFullstack: hasNodeKeyword,
    };
  }

  return { isValidFullstack: true };
}

async function checkRequiredSkills(page, job) {
  try {
    // Get all skills from the job posting
    const jobInfo = await page.evaluate(() => {
      const skillChips = Array.from(
        document.querySelectorAll(".styles_chip__7YCfG")
      ).map((chip) => chip.textContent.toLowerCase().trim());

      const descriptionElement = document.querySelector(
        ".styles_JDC__dang-inner-html__h0K4t"
      );
      const description = descriptionElement
        ? descriptionElement.innerText.toLowerCase()
        : "";

      const applicantsElement = Array.from(
        document.querySelectorAll(".styles_jhc__stat__PgY67")
      ).find((el) => el.textContent.includes("Applicants:"));
      const openingsElement = Array.from(
        document.querySelectorAll(".styles_jhc__stat__PgY67")
      ).find((el) => el.textContent.includes("Openings:"));

      const applicantsCount = applicantsElement
        ? parseInt(
            applicantsElement
              .querySelector("span:last-child")
              .textContent.replace(/,/g, ""),
            10
          )
        : Infinity;

      const openingsCount = openingsElement
        ? parseInt(
            openingsElement
              .querySelector("span:last-child")
              .textContent.replace(/,/g, ""),
            10
          )
        : 1;

      return {
        skillChips,
        description,
        applicantsCount,
        openingsCount,
      };
    });

    // Define your skills with variations and weightage
    const skillSets = [
      {
        name: "React",
        primary: ["react", "reactjs", "react.js", "react developer"],
        related: ["javascript", "hooks", "components", "jsx", "virtual dom"],
        weight: 6,
      },
      {
        name: "React Ecosystem",
        primary: ["react router", "context api", "react hooks"],
        related: ["state management", "react query", "react context"],
        weight: 4,
      },
      {
        name: "Next.js",
        primary: ["next", "nextjs", "next.js"],
        related: ["react", "server-side rendering", "ssr"],
        weight: 4,
      },
      {
        name: "TypeScript",
        primary: ["typescript", "ts"],
        related: ["type safety", "typed", "generics"],
        weight: 4,
      },
      {
        name: "State Management",
        primary: ["redux", "redux toolkit", "rtk", "mobx", "context"],
        related: ["state management", "global state"],
        weight: 3,
      },
    ];

    const reactSpecificChecks = [
      { keyword: "react hooks", bonus: 1.5 },
      { keyword: "functional components", bonus: 1.2 },
      { keyword: "performance optimization", bonus: 1.4 },
      { keyword: "react context", bonus: 1.3 },
      { keyword: "memoization", bonus: 1.2 },
      { keyword: "lazy loading", bonus: 1.1 },
    ];

    // Helper function to check if any variation of a skill exists
    const hasSkill = (skillVariations, text) => {
      return skillVariations.some(
        (skill) =>
          text.includes(skill) ||
          text.includes(skill.replace(".", "")) ||
          text.includes(skill.replace("-", ""))
      );
    };

    // Calculate match score
    let totalScore = 0;
    let maxPossibleScore = 0;
    const matchedSkills = [];
    const descriptionLower = jobInfo.description.toLowerCase();

    for (const skillSet of skillSets) {
      maxPossibleScore += skillSet.weight;

      const hasPrimarySkill =
        hasSkill(skillSet.primary, descriptionLower) ||
        skillSet.primary.some((skill) =>
          jobInfo.skillChips.some((chip) => chip.includes(skill))
        );

      const hasRelatedSkill =
        hasSkill(skillSet.related, descriptionLower) ||
        skillSet.related.some((skill) =>
          jobInfo.skillChips.some((chip) => chip.includes(skill))
        );

      if (hasPrimarySkill) {
        totalScore += skillSet.weight;
        matchedSkills.push(skillSet.name);
      } else if (hasRelatedSkill) {
        totalScore += skillSet.weight * 0.5;
        matchedSkills.push(`${skillSet.name} (related)`);
      }
    }
    let bonusScore = 0;
    reactSpecificChecks.forEach((check) => {
      if (descriptionLower.includes(check.keyword.toLowerCase())) {
        bonusScore += check.bonus;
        console.log(`Bonus for React-specific skill: ${check.keyword}`);
      }
    });

    // Calculate match percentage
    const matchPercentage = (totalScore / maxPossibleScore) * 100;

    //check if Early Applicant

    // Enhanced keyword combinations (triplets)

    const keywordTriplets = [
      ["react", "javascript", "frontend"],
      ["react", "typescript", "frontend"],
      ["react", "hooks", "components"],
      ["react", "performance", "optimization"],
      ["frontend", "react", "developer"],
    ];

    for (const [keyword1, keyword2, keyword3] of keywordTriplets) {
      if (
        descriptionLower.includes(keyword1) &&
        descriptionLower.includes(keyword2) &&
        descriptionLower.includes(keyword3)
      ) {
        bonusScore += 1.0; // Higher bonus for matching
        console.log(
          `Matched keyword triplet: ${keyword1} + ${keyword2} + ${keyword3}`
        );
      }
    }

    // Add bonus score to total
    totalScore += bonusScore;
    const finalMatchPercentage = Math.min(
      (totalScore / (maxPossibleScore + keywordTriplets.length)) * 100,
      100
    );
    // Calculate dynamic applicant limit based on openings ==> for 250 application for one job posting
    const applicantLimit = Math.max(350 * jobInfo.openingsCount, 100);
    const isEligible =
      finalMatchPercentage >= 50 &&
      (jobInfo.applicantsCount === undefined ||
        jobInfo.applicantsCount < applicantLimit);

    console.log("========><=========");
    console.log(`Match score: ${finalMatchPercentage.toFixed(1)}%`);
    console.log(`Matched skills: ${matchedSkills.join(", ")}`);
    console.log(`Applicants: ${jobInfo.applicantsCount}`);
    console.log(`Openings: ${jobInfo.openingsCount}`);
    console.log(`Applicant Limit: ${applicantLimit}`);
    console.log("\n========><=========");

    const titleCheck = filterJobTitle(job.title);
    if (!titleCheck.isValidTitle) {
      console.log(`Job skipped due to title filter: ${job.title}`);
      return {
        isEligible: false,
        matchPercentage: finalMatchPercentage,
        matchedSkills,
        skills: jobInfo.skillChips,
        reason: "Job title not suitable",
      };
    }
    // check it the title includes fullstack development
    const fullstackCheck = checkFullstackRequirements(
      job.title,
      jobInfo.description,
      jobInfo.skillChips
    );
    if (!fullstackCheck.isValidFullstack) {
      console.log(
        `Fullstack job skipped due to Node.js requirement: ${job.title}`
      );
      return {
        isEligible: false,
        matchPercentage: finalMatchPercentage,
        matchedSkills,
        skills: jobInfo.skillChips,
        skills: [],
        reason: "Fullstack job lacks Node.js requirement",
      };
    }
    return {
      isEligible,
      matchPercentage: finalMatchPercentage,
      matchedSkills,
      skills: jobInfo.skillChips,
      score: {
        total: totalScore,
        max: maxPossibleScore,
        bonus: bonusScore,
      },
      reason: "",
    };
  } catch (error) {
    console.error("Error in checkRequiredSkills:", error);
    return {
      isEligible: true,
      matchPercentage: 0,
      matchedSkills: [],
      skills: [],
      score: {
        total: 0,
        max: 0,
        bonus: 0,
      },
      reason: "Error in checkRequiredSkills",
    };
  }
}

// async function checkRequiredSkills(page, job) {
//   try {
//     console.log(`Checking required skills for job: ${job.title}`);

//     // Get all skills from the job posting
//     const jobInfo = await page.evaluate(() => {
//       const skillChips = Array.from(
//         document.querySelectorAll(".styles_chip__7YCfG")
//       ).map((chip) => chip.textContent.toLowerCase().trim());

//       const descriptionElement = document.querySelector(
//         ".styles_JDC__dang-inner-html__h0K4t"
//       );
//       const description = descriptionElement
//         ? descriptionElement.innerText.toLowerCase()
//         : "";

//       const applicantsElement = Array.from(
//         document.querySelectorAll(".styles_jhc__stat__PgY67")
//       ).find((el) => el.textContent.includes("Applicants:"));
//       const openingsElement = Array.from(
//         document.querySelectorAll(".styles_jhc__stat__PgY67")
//       ).find((el) => el.textContent.includes("Openings:"));

//       const applicantsCount = applicantsElement
//         ? parseInt(
//             applicantsElement
//               .querySelector("span:last-child")
//               .textContent.replace(/,/g, ""),
//             10
//           )
//         : Infinity;

//       const openingsCount = openingsElement
//         ? parseInt(
//             openingsElement
//               .querySelector("span:last-child")
//               .textContent.replace(/,/g, ""),
//             10
//           )
//         : 1;

//       return {
//         skillChips,
//         description,
//         applicantsCount,
//         openingsCount,
//       };
//     });

//     // Define your skills with variations and weightage
//     const skillSets = [
//       {
//         name: "React",
//         primary: ["react", "reactjs", "react.js"],
//         related: ["javascript", "js", "frontend", "front-end", "front end"],
//         weight: 5,
//       },
//       {
//         name: "Next.js",
//         primary: ["next", "nextjs", "next.js"],
//         related: ["react", "javascript", "js"],
//         weight: 4,
//       },
//       {
//         name: "JavaScript",
//         primary: ["javascript", "js", "ecmascript"],
//         related: ["frontend", "web", "es6", "es2015"],
//         weight: 4,
//       },
//       {
//         name: "Redux",
//         primary: ["redux", "redux toolkit", "rtk"],
//         related: ["react", "state management"],
//         weight: 3,
//       },
//       {
//         name: "TypeScript",
//         primary: ["typescript", "ts"],
//         related: ["javascript", "type safety", "typed"],
//         weight: 4,
//       },
//     ];

//     // Helper function to check if any variation of a skill exists
//     const hasSkill = (skillVariations, text) => {
//       return skillVariations.some(
//         (skill) =>
//           text.includes(skill) ||
//           text.includes(skill.replace(".", "")) ||
//           text.includes(skill.replace("-", ""))
//       );
//     };

//     // Calculate match score
//     let totalScore = 0;
//     let maxPossibleScore = 0;
//     const matchedSkills = [];

//     for (const skillSet of skillSets) {
//       maxPossibleScore += skillSet.weight;

//       const hasPrimarySkill =
//         hasSkill(skillSet.primary, jobInfo.description) ||
//         skillSet.primary.some((skill) =>
//           jobInfo.skillChips.some((chip) => chip.includes(skill))
//         );

//       const hasRelatedSkill =
//         hasSkill(skillSet.related, jobInfo.description) ||
//         skillSet.related.some((skill) =>
//           jobInfo.skillChips.some((chip) => chip.includes(skill))
//         );

//       if (hasPrimarySkill) {
//         totalScore += skillSet.weight;
//         matchedSkills.push(skillSet.name);
//       } else if (hasRelatedSkill) {
//         totalScore += skillSet.weight * 0.5;
//         matchedSkills.push(`${skillSet.name} (related)`);
//       }
//     }

//     // Calculate match percentage
//     const matchPercentage = (totalScore / maxPossibleScore) * 100;

//     //check if Early Applicant

//     // Enhanced keyword combinations (triplets)
//     const descriptionLower = jobInfo.description.toLowerCase();

//     const keywordTriplets = [
//       ["react", "javascript", "frontend"],
//       ["react", "typescript", "frontend"],
//       ["react", "redux", "javascript"],
//       ["react", "next", "typescript"],
//       ["react", "redux", "typescript"],
//       ["frontend", "javascript", "typescript"],
//       ["react", "frontend", "developer"],
//       ["react", "ui", "developer"],
//       ["typescript", "next", "frontend"],
//       ["react", "api", "frontend"],
//       ["react", "component", "development"],
//       ["react", "web", "application"],
//       ["frontend", "react", "experienced"],
//     ];

//     let bonusScore = 0;

//     for (const [keyword1, keyword2, keyword3] of keywordTriplets) {
//       if (
//         descriptionLower.includes(keyword1) &&
//         descriptionLower.includes(keyword2) &&
//         descriptionLower.includes(keyword3)
//       ) {
//         bonusScore += 1.0; // Higher bonus for matching three keywords
//         console.log(
//           `Matched keyword triplet: ${keyword1} + ${keyword2} + ${keyword3}`
//         );
//       }
//     }

//     // Add bonus score to total
//     totalScore += bonusScore;
//     const finalMatchPercentage = Math.min(
//       (totalScore / (maxPossibleScore + keywordTriplets.length)) * 100,
//       100
//     );
//     // Calculate dynamic applicant limit based on openings ==> for 250 application for one job posting
//     const applicantLimit = Math.max(350 * jobInfo.openingsCount, 100);
//     const isEligible =
//       finalMatchPercentage >= 45 &&
//       (jobInfo.applicantsCount === undefined ||
//         jobInfo.applicantsCount < applicantLimit);
//     console.log("\n========><=========");
//     console.log(`Match score: ${finalMatchPercentage.toFixed(1)}%`);
//     console.log(`Matched skills: ${matchedSkills.join(", ")}`);
//     console.log(`Applicants: ${jobInfo.applicantsCount}`);
//     console.log(`Openings: ${jobInfo.openingsCount}`);
//     console.log(`Applicant Limit: ${applicantLimit}`);
//     return {
//       isEligible,
//       matchPercentage: finalMatchPercentage,
//       matchedSkills,
//       skills: jobInfo.skillChips,
//       score: {
//         total: totalScore,
//         max: maxPossibleScore,
//         bonus: bonusScore,
//       },
//     };
//   } catch (error) {
//     console.error("Error in checkRequiredSkills:", error);
//     return {
//       isEligible: true,
//       matchPercentage: 0,
//       matchedSkills: [],
//       skills: [],
//       score: {
//         total: 0,
//         max: 0,
//         bonus: 0,
//       },
//     };
//   }
// }

// ###### for fullStack Development Role Appy Below

// async function checkRequiredSkills(page, job) {
//   try {
//     console.log(`Checking required skills for job: ${job.title}`);

//     const jobInfo = await page.evaluate(() => {
//       const skillChips = Array.from(
//         document.querySelectorAll(".styles_chip__7YCfG")
//       ).map((chip) => chip.textContent.toLowerCase().trim());

//       const descriptionElement = document.querySelector(
//         ".styles_JDC__dang-inner-html__h0K4t"
//       );
//       const description = descriptionElement
//         ? descriptionElement.innerText.toLowerCase()
//         : "";

//       return {
//         skillChips,
//         description,
//       };
//     });

//     // Define skills with variations and weightage
//     const skillSets = [
//       {
//         name: "React",
//         primary: ["react", "reactjs", "react.js", "react js"],
//         related: ["frontend", "front-end", "ui", "jsx", "components"],
//         weight: 5, // Highest priority
//       },
//       {
//         name: "Next.js",
//         primary: ["next", "nextjs", "next.js", "next js"],
//         related: ["react", "ssr", "server side rendering"],
//         weight: 5,
//       },
//       {
//         name: "Redux",
//         primary: ["redux", "redux toolkit", "rtk", "state management"],
//         related: ["react state", "global state"],
//         weight: 4,
//       },
//       {
//         name: "JavaScript",
//         primary: ["javascript", "js", "ecmascript", "es6"],
//         related: ["frontend", "web", "scripting", "programming"],
//         weight: 5,
//       },
//       {
//         name: "Node.js",
//         primary: ["node", "nodejs", "node.js", "node js"],
//         related: ["backend", "server", "express", "api"],
//         weight: 5,
//       },
//       {
//         name: "Express.js",
//         primary: ["express", "expressjs", "express.js", "express js"],
//         related: ["node", "backend", "api", "rest"],
//         weight: 4,
//       },
//       {
//         name: "PostgreSQL",
//         primary: ["postgresql", "postgres", "psql"],
//         related: ["sql", "database", "rdbms"],
//         weight: 4,
//       },
//       {
//         name: "MongoDB",
//         primary: ["mongodb", "mongo", "nosql"],
//         related: ["database", "mongoose", "atlas"],
//         weight: 4,
//       },
//       {
//         name: "Git & GitHub",
//         primary: ["git", "github", "version control"],
//         related: ["bitbucket", "gitlab", "source control"],
//         weight: 3,
//       },
//       {
//         name: "Tailwind CSS",
//         primary: ["tailwind", "tailwindcss", "tailwind css"],
//         related: ["css", "styling", "responsive"],
//         weight: 3,
//       },
//       {
//         name: "Bootstrap",
//         primary: ["bootstrap", "bootstrap5", "bootstrap 5"],
//         related: ["css", "responsive", "ui framework"],
//         weight: 3,
//       },
//       {
//         name: "TypeScript",
//         primary: ["typescript", "ts", "typed javascript"],
//         related: ["javascript", "type safety", "interfaces"],
//         weight: 4,
//       },
//     ];

//     // Helper function to check if any variation of a skill exists
//     const hasSkill = (skillVariations, text) => {
//       return skillVariations.some(
//         (skill) =>
//           text.includes(skill) ||
//           text.includes(skill.replace(".", "")) ||
//           text.includes(skill.replace("-", ""))
//       );
//     };

//     // Calculate match score
//     let totalScore = 0;
//     let maxPossibleScore = 0;
//     const matchedSkills = [];

//     for (const skillSet of skillSets) {
//       maxPossibleScore += skillSet.weight;

//       const hasPrimarySkill =
//         hasSkill(skillSet.primary, jobInfo.description) ||
//         skillSet.primary.some((skill) =>
//           jobInfo.skillChips.some((chip) => chip.includes(skill))
//         );

//       const hasRelatedSkill =
//         hasSkill(skillSet.related, jobInfo.description) ||
//         skillSet.related.some((skill) =>
//           jobInfo.skillChips.some((chip) => chip.includes(skill))
//         );

//       if (hasPrimarySkill) {
//         totalScore += skillSet.weight;
//         matchedSkills.push(skillSet.name);
//       } else if (hasRelatedSkill) {
//         totalScore += skillSet.weight * 0.5;
//         matchedSkills.push(`${skillSet.name} (related)`);
//       }
//     }

//     // Calculate initial match percentage
//     const matchPercentage = (totalScore / maxPossibleScore) * 100;

//     // Keyword triplets for full-stack positions
//     const descriptionLower = jobInfo.description.toLowerCase();
//     const keywordTriplets = [
//       // Frontend-focused triplets
//       ["react", "javascript", "frontend"],
//       ["react", "typescript", "frontend"],
//       ["react", "redux", "javascript"],
//       ["react", "next", "typescript"],
//       ["react", "tailwind", "responsive"],
//       ["frontend", "javascript", "typescript"],

//       // Backend-focused triplets
//       ["node", "express", "api"],
//       ["node", "postgresql", "backend"],
//       ["node", "mongodb", "backend"],
//       ["express", "database", "api"],

//       // Full-stack triplets
//       ["frontend", "backend", "fullstack"],
//       ["react", "node", "fullstack"],
//       ["javascript", "node", "database"],
//       ["typescript", "node", "api"],
//       ["react", "express", "mongodb"],
//       ["react", "postgresql", "api"],

//       // Development workflow triplets
//       ["git", "development", "team"],
//       ["frontend", "backend", "architecture"],
//       ["api", "database", "development"],
//       ["react", "component", "development"],
//     ];

//     let bonusScore = 0;
//     for (const [keyword1, keyword2, keyword3] of keywordTriplets) {
//       if (
//         descriptionLower.includes(keyword1) &&
//         descriptionLower.includes(keyword2) &&
//         descriptionLower.includes(keyword3)
//       ) {
//         bonusScore += 1.0;
//         console.log(`Matched keyword triplet: ${keyword1} + ${keyword2} + ${keyword3}`);
//       }
//     }

//     // Add bonus score to total
//     totalScore += bonusScore;
//     const finalMatchPercentage = Math.min(((totalScore / (maxPossibleScore + keywordTriplets.length)) * 100), 100);

//     console.log(`Match score: ${finalMatchPercentage.toFixed(1)}%`);
//     console.log(`Matched skills: ${matchedSkills.join(", ")}`);

//     return {
//       isEligible: finalMatchPercentage >= 40,
//       matchPercentage: finalMatchPercentage,
//       matchedSkills,
//       skills: jobInfo.skillChips,
//       score: {
//         total: totalScore,
//         max: maxPossibleScore,
//         bonus: bonusScore
//       }
//     };
//   } catch (error) {
//     console.error("Error in checkRequiredSkills:", error);
//     return {
//       isEligible: true,
//       matchPercentage: 0,
//       matchedSkills: [],
//       skills: [],
//       score: {
//         total: 0,
//         max: 0,
//         bonus: 0
//       }
//     };
//   }
// }
module.exports = checkRequiredSkills;
