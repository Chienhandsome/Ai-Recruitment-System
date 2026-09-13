const fs = require("node:fs");

const apiUrl = process.env.INTERVIEW_WEB_API_URL || "http://127.0.0.1:8010";
if (!/^https?:\/\//.test(apiUrl)) {
  throw new Error("INTERVIEW_WEB_API_URL phải bắt đầu bằng http:// hoặc https://");
}

fs.writeFileSync(
  "config.js",
  `window.INTERVIEW_WEB_CONFIG = { apiUrl: ${JSON.stringify(apiUrl.replace(/\/$/, ""))} };\n`,
);
