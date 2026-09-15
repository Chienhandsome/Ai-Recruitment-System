"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  type AiInterviewSession,
  createAiInterview,
  downloadAiInterviewVideo,
  getAiInterviewsForApplication,
} from "@/lib/interview-api";
import { AiInterviewReviewModal } from "./AiInterviewReviewModal";

interface AiInterviewManagerProps {
  token: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onCreated?: () => void;
}

const statusLabels: Record<AiInterviewSession["status"], string> = {
  CREATED: "Chờ ứng viên tham gia",
  IN_PROGRESS: "Đang phỏng vấn",
  COMPLETED: "Đã hoàn thành",
  TERMINATED: "Đã kết thúc bất thường",
  EXPIRED: "Đã hết hạn",
};

export function AiInterviewManager({
  token,
  applicationId,
  candidateName,
  jobTitle,
  onCreated,
}: AiInterviewManagerProps) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<AiInterviewSession[]>([]);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState<AiInterviewSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [question1, setQuestion1] = useState(
    "Bạn hãy giới thiệu ngắn gọn về bản thân và kinh nghiệm phù hợp nhất với vị trí này.",
  );
  const [question2, setQuestion2] = useState(
    "Điều gì khiến bạn quan tâm đến vị trí này?",
  );
  const [competencies, setCompetencies] = useState(
    "technical_experience, problem_solving, collaboration",
  );
  const [maxQuestions, setMaxQuestions] = useState(6);
  const [expiryDays, setExpiryDays] = useState(3);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await getAiInterviewsForApplication(token, applicationId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải phỏng vấn AI");
    } finally {
      setLoading(false);
    }
  }, [applicationId, token]);

  useEffect(() => {
    if (open) void loadSessions();
  }, [open, loadSessions]);

  async function handleCreate() {
    const openingQuestions = [question1.trim(), question2.trim()].filter(Boolean);
    const competencyList = competencies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!openingQuestions.length || !competencyList.length) {
      toast.error("Cần ít nhất một câu hỏi mở đầu và một năng lực đánh giá.");
      return;
    }
    setSaving(true);
    try {
      const created = await createAiInterview(token, {
        applicationId,
        openingQuestions,
        competencies: competencyList,
        maxQuestions,
        expiresInHours: expiryDays * 24,
      });
      setSessions((current) => [created, ...current]);
      toast.success("Đã tạo link và gửi thông báo cho ứng viên.");
      onCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo phỏng vấn AI");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(sessionId: string, videoId: string) {
    try {
      await downloadAiInterviewVideo(token, sessionId, videoId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải video");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-violet-700"
      >
        <Bot className="h-4 w-4" />
        Phỏng vấn online với AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                  AI Interview
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {candidateName} · {jobTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.1fr]">
              <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-violet-600" />
                  <h3 className="font-black text-slate-900">Tạo lời mời mới</h3>
                </div>
                <label className="block text-xs font-bold text-slate-700">
                  Câu hỏi mở đầu 1
                  <textarea
                    value={question1}
                    onChange={(event) => setQuestion1(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium outline-none focus:border-violet-500"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Câu hỏi mở đầu 2 (không bắt buộc)
                  <textarea
                    value={question2}
                    onChange={(event) => setQuestion2(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium outline-none focus:border-violet-500"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Năng lực cần đánh giá, phân cách bằng dấu phẩy
                  <input
                    value={competencies}
                    onChange={(event) => setCompetencies(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium outline-none focus:border-violet-500"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-slate-700">
                    Tổng số câu
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={maxQuestions}
                      onChange={(event) => setMaxQuestions(Number(event.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-700">
                    Hạn tham gia (ngày)
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={expiryDays}
                      onChange={(event) => setExpiryDays(Number(event.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-black text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  Tạo link và thông báo ứng viên
                </button>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900">Lịch sử phỏng vấn AI</h3>
                  <button
                    type="button"
                    onClick={() => void loadSessions()}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800"
                  >
                    Làm mới
                  </button>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div>
                ) : sessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    Chưa có cuộc phỏng vấn AI nào.
                  </div>
                ) : (
                  sessions.map((session) => (
                    <article key={session.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700">
                          {session.status === "COMPLETED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {statusLabels[session.status]}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Hết hạn {new Date(session.expiresAt).toLocaleString("vi-VN")}
                        </span>
                      </div>

                      {session.terminationReason && (
                        <p className="mt-2 text-xs font-semibold text-rose-600">
                          Lý do: {session.terminationReason}
                        </p>
                      )}

                      {session.status === "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => setSelectedSessionForReview(session)}
                          className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-3.5 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition cursor-pointer"
                        >
                          <Video className="h-4 w-4" /> Xem video & Đánh giá từng câu hỏi ({session.transcript?.length || 0} câu)
                        </button>
                      )}

                      {!!session.transcript?.length && (
                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                          {session.transcript.map((turn) => (
                            <div key={turn.question.number} className="rounded-lg bg-slate-50 p-3 text-xs">
                              <p className="font-black text-slate-800">Câu {turn.question.number}: {turn.question.text}</p>
                              <p className="mt-1 whitespace-pre-wrap text-slate-600">{turn.transcript || "Không nhận diện được câu trả lời."}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {!!session.videos?.length && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                          {session.videos.map((video) => (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() => void handleDownload(session.id, video.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-violet-300 hover:text-violet-700"
                            >
                              <Video className="h-3.5 w-3.5" /> Câu {video.question_number}
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {selectedSessionForReview && (
        <AiInterviewReviewModal
          isOpen={!!selectedSessionForReview}
          onClose={() => setSelectedSessionForReview(null)}
          token={token}
          session={selectedSessionForReview}
          candidateName={candidateName}
          jobTitle={jobTitle}
          onEvaluated={() => {
            void loadSessions();
            onCreated?.();
          }}
        />
      )}
    </>
  );
}
