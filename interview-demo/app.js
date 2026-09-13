const defaults = {
  cv: {
    full_name: "Nguyễn Minh Anh",
    headline: "Backend Developer · 2 năm kinh nghiệm",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Redis"],
    experience: [{ company: "ABC Technology", role: "Backend Developer", highlights: ["Xây dựng REST API", "Giảm 30% thời gian phản hồi API"] }],
    projects: [{ name: "Recruitment Platform", contribution: "Thiết kế API và tối ưu truy vấn" }],
  },
  jd: {
    title: "Backend Developer",
    level: "Junior",
    requirements: ["Java/Spring Boot", "SQL", "Thiết kế REST API", "Làm việc nhóm"],
    competencies: ["technical_experience", "problem_solving", "collaboration"],
  },
  config: {
    opening_questions: [
      "Bạn có thể giới thiệu ngắn gọn về bản thân và kinh nghiệm phù hợp nhất với vị trí này không?",
      "Điều gì khiến bạn quan tâm đến vị trí này vào thời điểm hiện tại?",
    ],
    competencies: ["technical_experience", "problem_solving", "collaboration"],
    max_questions: 5,
  },
};

const ANSWER_SECONDS = 30;
const PREPARATION_SECONDS = 3;
const state = { sessionId: null, activeQuestion: null, cameraStream: null, recorder: null, recordingDone: null, recognition: null, shouldListen: false, transcriptFinal: "", preparationTimer: null, answerTimer: null, remainingSeconds: ANSWER_SECONDS, phase: "idle", transitionId: 0 };
const $ = (id) => document.getElementById(id);

$("cvInput").value = JSON.stringify(defaults.cv, null, 2);
$("jdInput").value = JSON.stringify(defaults.jd, null, 2);
$("configInput").value = JSON.stringify(defaults.config, null, 2);

function apiBase() { return $("apiBaseUrl").value.trim().replace(/\/$/, ""); }
function setError(message = "") { $("setupError").textContent = message; }
function parseJson(id, label) {
  try {
    const parsed = JSON.parse($(id).value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error();
    return parsed;
  } catch { throw new Error(`${label} phải là JSON object hợp lệ.`); }
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase()}${path}`, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Không thể kết nối Interview Service.");
  return data;
}

async function checkHealth() {
  try {
    const health = await request("/health", { method: "GET" });
    $("serviceStatus").textContent = `Service sẵn sàng · ${health.llm_mode}`;
  } catch { $("serviceStatus").textContent = "Service chưa sẵn sàng"; }
}

function addMessage(kind, title, text, question) {
  const message = document.createElement("article");
  message.className = `message ${kind}`;
  const meta = document.createElement("div"); meta.className = "message-meta";
  const left = document.createElement("span"); left.textContent = title; meta.append(left);
  if (question) {
    const source = document.createElement("span");
    source.textContent = question.source === "opening" ? "HR CONFIG" : question.source.toUpperCase();
    meta.append(source);
  }
  const content = document.createElement("p"); content.textContent = text;
  message.append(meta, content); $("conversation").append(message);
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearTimers() {
  window.clearInterval(state.preparationTimer); window.clearInterval(state.answerTimer);
  state.preparationTimer = null; state.answerTimer = null;
}
function setRecordingStatus(message, timer = "--") {
  $("recordingStatus").textContent = message; $("answerTimer").textContent = timer;
}
function setAnswerEnabled(enabled) {
  $("answerInput").disabled = !enabled; $("answerButton").disabled = !enabled;
  if (enabled) $("answerInput").focus();
}

async function prepareCamera() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    setRecordingStatus("Trình duyệt không hỗ trợ ghi hình. Bạn vẫn có thể trả lời bằng văn bản."); return;
  }
  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    $("cameraPreview").srcObject = state.cameraStream;
    setRecordingStatus("Camera và microphone đã sẵn sàng.");
  } catch (error) {
    console.warn("Camera permission was denied or unavailable", error);
    setRecordingStatus("Không truy cập được camera/microphone. Phiên vẫn tiếp tục ở chế độ văn bản.");
  }
}
function stopCamera() {
  state.cameraStream?.getTracks().forEach((track) => track.stop());
  state.cameraStream = null; $("cameraPreview").srcObject = null;
}
function pickRecorderOptions() {
  const mimeTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  const mimeType = mimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));
  return mimeType ? { mimeType } : undefined;
}
function startVideoRecording(questionNumber) {
  if (!state.cameraStream || !window.MediaRecorder || state.recorder?.state === "recording") return;
  const chunks = []; let resolveRecording;
  state.recordingDone = new Promise((resolve) => { resolveRecording = resolve; });
  try {
    const recorder = new MediaRecorder(state.cameraStream, pickRecorderOptions());
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => resolveRecording({ questionNumber, blob: new Blob(chunks, { type: recorder.mimeType || "video/webm" }) });
    recorder.onerror = () => resolveRecording({ questionNumber, blob: null });
    state.recorder = recorder; recorder.start(500);
  } catch (error) {
    console.warn("Video recording could not start", error); resolveRecording({ questionNumber, blob: null });
  }
}
function stopVideoRecording() {
  const recordingDone = state.recordingDone || Promise.resolve(null);
  if (state.recorder?.state === "recording") state.recorder.stop();
  state.recorder = null; state.recordingDone = null;
  return recordingDone;
}
function setupBrowserTranscription() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    $("uploadStatus").textContent = "Trình duyệt không hỗ trợ Speech-to-Text; hãy nhập câu trả lời bằng văn bản.";
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "vi-VN";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (event) => {
    const finalParts = [];
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const spoken = event.results[index][0].transcript;
      if (event.results[index].isFinal) finalParts.push(spoken);
      else interim += spoken;
    }
    state.transcriptFinal = `${state.transcriptFinal} ${finalParts.join(" ")}`.trim();
    $("answerInput").value = `${state.transcriptFinal} ${interim}`.trim();
  };
  recognition.onend = () => {
    if (state.shouldListen && state.phase === "answering") {
      window.setTimeout(() => { try { recognition.start(); } catch { /* already starting */ } }, 120);
    }
  };
  recognition.onerror = () => {
    $("uploadStatus").textContent = "Speech-to-Text tạm dừng; bạn vẫn có thể nhập câu trả lời bằng văn bản.";
  };
  state.recognition = recognition;
}
function startBrowserTranscription() {
  if (!state.recognition) return;
  state.shouldListen = true;
  state.transcriptFinal = $("answerInput").value.trim();
  try { state.recognition.start(); } catch { /* recognition is already active */ }
}
function stopBrowserTranscription() {
  state.shouldListen = false;
  try { state.recognition?.stop(); } catch { /* browser already stopped it */ }
}
function uploadVideoInBackground(recording) {
  if (!recording?.blob?.size) { $("uploadStatus").textContent = "Không có video để tải lên cho lượt này."; return; }
  $("uploadStatus").textContent = `Đang gửi ngầm video câu ${recording.questionNumber}…`;
  fetch(`${apiBase()}/v1/interviews/${state.sessionId}/videos`, {
    method: "POST",
    headers: { "Content-Type": recording.blob.type || "video/webm", "X-Interview-Question-Number": String(recording.questionNumber) },
    body: recording.blob,
  })
    .then(async (response) => {
      if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.detail || "Không thể gửi video"); }
      return response.json();
    })
    .then(() => { $("uploadStatus").textContent = `Video câu ${recording.questionNumber} đã được gửi.`; })
    .catch((error) => { console.warn("Background video upload failed", error); $("uploadStatus").textContent = `Không gửi được video câu ${recording.questionNumber}: ${error.message}`; });
}

function speakThenPrepare(question, transitionId) {
  const begin = () => { if (transitionId === state.transitionId) startPreparationCountdown(question, transitionId); };
  if (!$("autoSpeak").checked || !("speechSynthesis" in window)) { begin(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(question.text);
  utterance.lang = "vi-VN"; utterance.rate = 0.96;
  const vietnameseVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("vi"));
  if (vietnameseVoice) utterance.voice = vietnameseVoice;
  utterance.onend = begin; utterance.onerror = begin; window.speechSynthesis.speak(utterance);
}
function startPreparationCountdown(question, transitionId) {
  clearTimers(); state.phase = "preparing"; setAnswerEnabled(false);
  let seconds = PREPARATION_SECONDS;
  setRecordingStatus("AI đã đọc xong. Chuẩn bị trả lời sau…", `${seconds}s`);
  state.preparationTimer = window.setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      window.clearInterval(state.preparationTimer);
      if (transitionId === state.transitionId) startAnswerWindow(question);
      return;
    }
    setRecordingStatus("AI đã đọc xong. Chuẩn bị trả lời sau…", `${seconds}s`);
  }, 1000);
}
function startAnswerWindow(question) {
  state.phase = "answering"; state.remainingSeconds = ANSWER_SECONDS;
  setRecordingStatus("Đang ghi hình và ghi âm câu trả lời.", `${state.remainingSeconds}s`);
  setAnswerEnabled(true); startVideoRecording(question.number); startBrowserTranscription();
  state.answerTimer = window.setInterval(() => {
    state.remainingSeconds -= 1;
    setRecordingStatus("Đang ghi hình và ghi âm câu trả lời.", `${state.remainingSeconds}s`);
    if (state.remainingSeconds <= 0) submitAnswer({ timedOut: true });
  }, 1000);
}
function renderQuestion(question) {
  clearTimers(); state.transitionId += 1;
  const transitionId = state.transitionId;
  state.activeQuestion = question;
  $("questionProgress").textContent = `Câu hỏi ${question.number} · ${question.target_competency.replaceAll("_", " ")}`;
  $("answerInput").value = "";
  addMessage("ai", "AI INTERVIEWER", question.text, question);
  speakThenPrepare(question, transitionId);
}
function setInterviewBusy(busy) {
  $("finishButton").disabled = busy;
  if (busy) setAnswerEnabled(false);
}

async function startInterview() {
  setError();
  try {
    const payload = { cv: parseJson("cvInput", "CV"), jd: parseJson("jdInput", "JD"), config: parseJson("configInput", "Cấu hình"), metadata: { source: "standalone-demo" } };
    $("startButton").disabled = true; $("startButton").textContent = "Đang xin quyền camera…";
    const mediaRequest = prepareCamera();
    const data = await request("/v1/interviews", { method: "POST", body: JSON.stringify(payload) });
    await mediaRequest;
    state.sessionId = data.session_id;
    $("setupPanel").classList.add("hidden"); $("interviewPanel").classList.remove("hidden");
    $("conversation").replaceChildren(); $("answerBox").classList.remove("hidden"); $("finishButton").classList.remove("hidden");
    renderQuestion(data.question);
  } catch (error) { setError(error.message); }
  finally { $("startButton").disabled = false; $("startButton").textContent = "Bắt đầu phỏng vấn →"; }
}

async function submitAnswer({ timedOut = false } = {}) {
  if (state.phase !== "answering" || !state.activeQuestion) return;
  clearTimers(); state.phase = "submitting";
  const answer = $("answerInput").value.trim();
  stopBrowserTranscription();
  const recordingDone = stopVideoRecording();
  recordingDone.then(uploadVideoInBackground);
  setInterviewBusy(true);
  setRecordingStatus(timedOut ? "Đã hết thời gian. Đang chuyển sang câu tiếp theo…" : "Đã nộp câu trả lời. Đang chuyển sang câu tiếp theo…");
  addMessage("candidate", "ỨNG VIÊN", answer || "[Không có câu trả lời bằng văn bản]");
  $("answerInput").value = "";
  try {
    const data = await request(`/v1/interviews/${state.sessionId}/answers`, { method: "POST", body: JSON.stringify({ text: answer }) });
    if (data.status === "completed") { stopCamera(); renderReport(data.report); }
    else renderQuestion(data.question);
  } catch (error) {
    addMessage("ai", "LỖI", error.message); state.phase = "answering"; setAnswerEnabled(true);
  } finally { setInterviewBusy(false); }
}
async function finishInterview() {
  clearTimers(); state.transitionId += 1; state.phase = "completed";
  stopBrowserTranscription();
  const recordingDone = stopVideoRecording(); setInterviewBusy(true);
  recordingDone.then(uploadVideoInBackground);
  try {
    const report = await request(`/v1/interviews/${state.sessionId}/complete`, { method: "POST", body: "{}" });
    stopCamera(); renderReport(report);
  } catch (error) { addMessage("ai", "LỖI", error.message); }
  finally { setInterviewBusy(false); }
}
function renderReport(report) {
  $("answerBox").classList.add("hidden"); $("finishButton").classList.add("hidden"); $("reportPanel").classList.remove("hidden");
  $("reportSummary").textContent = `${report.summary} Video được gửi nền và có thể hoàn tất sau khi báo cáo đã hiển thị.`;
  $("reviewerNote").textContent = report.reviewer_note;
  const evidenceList = $("evidenceList"); evidenceList.replaceChildren();
  Object.entries(report.competency_evidence).forEach(([competency, answers]) => {
    const item = document.createElement("article"); item.className = "evidence-item";
    const title = document.createElement("h3"); title.textContent = competency.replaceAll("_", " "); item.append(title);
    answers.forEach((answer) => { const text = document.createElement("p"); text.textContent = answer || "[Không có câu trả lời văn bản]"; item.append(text); });
    evidenceList.append(item);
  });
}

$("startButton").addEventListener("click", startInterview);
$("answerButton").addEventListener("click", () => submitAnswer());
$("finishButton").addEventListener("click", finishInterview);
$("restartButton").addEventListener("click", () => { stopCamera(); window.location.reload(); });
$("answerInput").addEventListener("keydown", (event) => { if (event.ctrlKey && event.key === "Enter") submitAnswer(); });
setupBrowserTranscription();
checkHealth();
