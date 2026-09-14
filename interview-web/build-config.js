const fs = require("node:fs");
const path = require("node:path");

const apiUrl = process.env.INTERVIEW_WEB_API_URL || "http://127.0.0.1:8010";
if (!/^https?:\/\//.test(apiUrl)) {
  throw new Error("INTERVIEW_WEB_API_URL phải bắt đầu bằng http:// hoặc https://");
}

const outputDirectory = path.join(__dirname, "dist");
fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of ["index.html", "style.css", "app.js"]) {
  fs.copyFileSync(path.join(__dirname, file), path.join(outputDirectory, file));
}

fs.writeFileSync(
  path.join(outputDirectory, "config.js"),
  `window.INTERVIEW_WEB_CONFIG = { apiUrl: ${JSON.stringify(apiUrl.replace(/\/$/, ""))} };\n`,
);
