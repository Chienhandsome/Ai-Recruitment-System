// Read-only checks. Does not publish/consume messages or change users/packages.
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("../backend/node_modules/dotenv");
const amqp = require("../backend/node_modules/amqplib");
const root = path.resolve(__dirname, "..");
const readEnv = (file) =>
  fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
const backend = readEnv(path.join(root, "backend/.env"));
const ai = readEnv(path.join(root, "ai-service/.env"));
const frontend = readEnv(path.join(root, "frontend/.env.local"));
let failures = 0;
function report(name, ready) {
  console.log(`${ready ? "PASS" : "FAIL"} ${name}`);
  if (!ready) failures++;
}
async function checkHttp(name, url, validate) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const data = validate ? await response.json() : null;
    report(name, response.ok && (!validate || validate(data)));
  } catch {
    report(name, false);
  }
}
async function main() {
  report(
    "Backend and AI use the same RabbitMQ configuration",
    Boolean(backend.RABBITMQ_URL && backend.RABBITMQ_URL === ai.RABBITMQ_URL),
  );
  report(
    "Backend and frontend use the same Supabase project",
    Boolean(
      backend.SUPABASE_URL &&
      backend.SUPABASE_URL.replace(/\/$/, "") ===
        frontend.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ""),
    ),
  );
  await Promise.all([
    checkHttp(
      "Frontend http://localhost:3000/login",
      "http://localhost:3000/login",
    ),
    checkHttp(
      "Backend, database, private storage, RabbitMQ and AI health",
      "http://localhost:3001/api/health",
      (data) => data.status === "UP",
    ),
    checkHttp(
      "Local AI API http://127.0.0.1:8000/health",
      "http://127.0.0.1:8000/health",
      (data) => data.status === "UP",
    ),
  ]);
  let connection;
  try {
    connection = await amqp.connect(backend.RABBITMQ_URL, { timeout: 10000 });
    const channel = await connection.createChannel();
    for (const queue of [
      "resume_analysis_queue",
      "evaluation_queue",
      "resume_analysis_queue_results",
      "evaluation_queue_result",
    ]) {
      const state = await channel.checkQueue(queue);
      report(
        `${queue}: ${state.consumerCount} consumer(s), ${state.messageCount} queued message(s)`,
        state.consumerCount > 0,
      );
    }
  } catch {
    report("RabbitMQ worker inspection", false);
  } finally {
    if (connection) await connection.close();
  }
  console.log(
    failures
      ? `${failures} check(s) failed. See docs/talent-pool-local-test.md.`
      : "Local infrastructure is ready. Run the two-account acceptance scenario in docs/talent-pool-local-test.md.",
  );
  process.exitCode = failures ? 1 : 0;
}
main().catch(() => {
  console.error(
    "Preflight could not finish. Check local services and environment configuration.",
  );
  process.exitCode = 1;
});
