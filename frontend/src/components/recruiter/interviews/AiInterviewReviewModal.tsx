"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  HelpCircle,
  Loader2,
  ShieldAlert,
  Sparkles,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  type AiInterviewSession,
  type AiInterviewTurn,
  type AiInterviewVideo,
  decideAiInterview,
  downloadAiInterviewVideo,
  getAiInterviewVideoBlobUrl,
} from "@/lib/interview-api";

interface AiInterviewReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  session: AiInterviewSession;
  candidateName: string;
  jobTitle: string;
  onEvaluated?: () => void | Promise<void>;
}

interface QuestionEvaluation {
  score: number; // 1 - 10
  comment: string;
}

export function AiInterviewReviewModal({
  isOpen,
  onClose,
  token,
  session,
  candidateName,
  jobTitle,
  onEvaluated,
}: AiInterviewReviewModalProps) {
  // Ordered questions/turns
  const turns: AiInterviewTurn[] = useMemo(() => {
    if (!session.transcript || !Array.isArray(session.transcript)) return [];
    return [...session.transcript].sort(
      (a, b) => a.question.number - b.question.number
    );
  }, [session.transcript]);

  // Video map by question_number
  const videoMap = useMemo(() => {
    const map = new Map<number, AiInterviewVideo>();
    if (session.videos && Array.isArray(session.videos)) {
      for (const v of session.videos) {
        map.set(v.question_number, v);
      }
    }
    return map;
  }, [session.videos]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [videoBlobUrls, setVideoBlobUrls] = useState<Record<string, string>>({});
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Per-question ratings
  const [questionRatings, setQuestionRatings] = useState<Record<number, QuestionEvaluation>>({});

  // Overall evaluation form
  const [overallScore, setOverallScore] = useState<number>(80);
  const [overallNote, setOverallNote] = useState<string>("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const currentTurn = turns[activeIdx] ?? null;
  const currentVideo = currentTurn ? videoMap.get(currentTurn.question.number) : null;

  // Auto-compute average score whenever question ratings change
  useEffect(() => {
    const ratedValues = Object.values(questionRatings);
    if (ratedValues.length > 0) {
      const avg =
        ratedValues.reduce((sum, item) => sum + item.score, 0) /
        ratedValues.length;
      // Convert 1-10 to 1-100 scale
      setOverallScore(Math.round(avg * 10));
    }
  }, [questionRatings]);

  // Fetch inline video blob when currentVideo changes
  useEffect(() => {
    if (!isOpen || !currentVideo) return;
    const videoId = currentVideo.id;
    if (videoBlobUrls[videoId]) return; // Already cached

    let cancelled = false;
    setLoadingVideo(true);

    getAiInterviewVideoBlobUrl(token, session.id, videoId)
      .then((blobUrl) => {
        if (!cancelled) {
          setVideoBlobUrls((prev) => ({ ...prev, [videoId]: blobUrl }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to stream video", err);
          toast.error("Không thể tải video câu hỏi này từ Supabase");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingVideo(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentVideo, isOpen, session.id, token, videoBlobUrls]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(videoBlobUrls).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    };
  }, [videoBlobUrls]);

  // Apply playback speed
  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleCopyTranscript = () => {
    if (!currentTurn?.transcript) return;
    navigator.clipboard.writeText(currentTurn.transcript);
    toast.success("Đã sao chép nội dung câu trả lời!");
  };

  const handleDownloadCurrentVideo = async () => {
    if (!currentVideo) return;
    try {
      await downloadAiInterviewVideo(token, session.id, currentVideo.id);
      toast.success("Bắt đầu tải video câu trả lời...");
    } catch {
      toast.error("Không thể tải file video");
    }
  };

  const updateCurrentQuestionRating = (score: number) => {
    if (!currentTurn) return;
    const num = currentTurn.question.number;
    setQuestionRatings((prev) => ({
      ...prev,
      [num]: {
        score,
        comment: prev[num]?.comment || "",
      },
    }));
  };

  const updateCurrentQuestionComment = (comment: string) => {
    if (!currentTurn) return;
    const num = currentTurn.question.number;
    setQuestionRatings((prev) => ({
      ...prev,
      [num]: {
        score: prev[num]?.score || 8,
        comment,
      },
    }));
  };

  // Submit final decision: ĐẠT or KHÔNG ĐẠT
  const handleSubmitDecision = async (decision: "PASSED" | "FAILED") => {
    if (!overallNote.trim()) {
      toast.error("Vui lòng nhập nhận xét tổng kết cho ứng viên trước khi quyết định");
      return;
    }

    setSubmittingDecision(true);
    try {
      // Format notes including per-question summary if available
      const questionSummary = Object.entries(questionRatings)
        .map(([qNum, val]) => `• Câu ${qNum}: ${val.score}/10 đ${val.comment ? ` - ${val.comment}` : ""}`)
        .join("\n");

      const finalNote = [
        overallNote.trim(),
        questionSummary ? `\n\n[Chi tiết chấm điểm theo câu hỏi]:\n${questionSummary}` : "",
      ]
        .filter(Boolean)
        .join("");

      await decideAiInterview(token, session.id, {
        decision,
        score: overallScore,
        note: finalNote,
      });

      if (decision === "PASSED") {
        toast.success("Đã xác nhận: Ứng viên ĐẠT vòng phỏng vấn online AI!");
      } else {
        toast.success("Đã ghi nhận: Ứng viên KHÔNG ĐẠT vòng phỏng vấn online AI.");
      }

      await onEvaluated?.();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu quyết định đánh giá"
      );
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (!isOpen) return null;

  const currentBlobUrl = currentVideo ? videoBlobUrls[currentVideo.id] : null;
  const currentRating = currentTurn ? questionRatings[currentTurn.question.number] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* MODAL HEADER */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#1F2937] truncate">
                  Đánh Giá Phỏng Vấn Online AI: {candidateName}
                </h2>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> Đã hoàn thành
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Vị trí: <strong className="text-slate-700">{jobTitle}</strong> · Tổng số: {turns.length} câu hỏi · Hoàn tất lúc: {session.completedAt ? new Date(session.completedAt).toLocaleString("vi-VN") : "N/A"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* QUESTION STEPPER NAVIGATION */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 shrink-0">
              Danh sách câu hỏi:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {turns.map((turn, idx) => {
                const qNum = turn.question.number;
                const isSelected = idx === activeIdx;
                const hasVideo = videoMap.has(qNum);
                const rating = questionRatings[qNum];

                return (
                  <button
                    key={qNum}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`group relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all shrink-0 ${
                      isSelected
                        ? "bg-[#2563EB] text-white shadow-sm ring-2 ring-[#2563EB]/30"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-slate-100/70"
                    }`}
                  >
                    <span>Câu {qNum}</span>
                    {hasVideo && (
                      <Video
                        className={`h-3 w-3 ${
                          isSelected ? "text-white" : "text-[#2563EB]"
                        }`}
                      />
                    )}
                    {rating && (
                      <span
                        className={`rounded px-1 text-[10px] font-mono ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {rating.score}đ
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={activeIdx <= 0}
              onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Trước
            </button>
            <span className="text-xs font-mono font-bold text-slate-500">
              {activeIdx + 1} / {turns.length || 1}
            </span>
            <button
              type="button"
              disabled={activeIdx >= turns.length - 1}
              onClick={() => setActiveIdx((prev) => Math.min(turns.length - 1, prev + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Sau <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (TWO COLUMNS) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/40">
          {/* LEFT COLUMN: VIDEO PLAYER & TRANSCRIPT (7 cols) */}
          <section className="lg:col-span-7 space-y-4">
            {/* 1. Video Player Container */}
            <div className="rounded-2xl border border-slate-200 bg-black overflow-hidden shadow-sm relative">
              <div className="aspect-video w-full flex items-center justify-center bg-slate-900 text-white relative">
                {currentVideo ? (
                  loadingVideo && !currentBlobUrl ? (
                    <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-300">
                      <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
                      <p className="text-xs font-bold">Đang tải video câu trả lời từ Supabase Storage...</p>
                    </div>
                  ) : currentBlobUrl ? (
                    <video
                      ref={videoRef}
                      key={currentBlobUrl}
                      src={currentBlobUrl}
                      controls
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-400">
                      <Video className="h-8 w-8 text-slate-500" />
                      <p className="text-xs">Không thể phát trực tiếp video này.</p>
                      <button
                        type="button"
                        onClick={handleDownloadCurrentVideo}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"
                      >
                        <Download className="h-3.5 w-3.5" /> Tải về máy để xem
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-400">
                    <HelpCircle className="h-8 w-8 text-slate-600" />
                    <p className="text-xs font-bold">Không tìm thấy video ghi hình cho câu hỏi này.</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Ứng viên có thể đã trả lời bằng microphone hoặc hệ thống đã ghi nhận dưới dạng bản chép lời (transcript).
                    </p>
                  </div>
                )}
              </div>

              {/* Video Toolbar */}
              {currentVideo && (
                <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Tốc độ xem:</span>
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => changeSpeed(rate)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                          playbackRate === rate
                            ? "bg-[#2563EB] text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadCurrentVideo}
                    title="Tải video câu này về máy"
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Download className="h-3 w-3" /> Tải file ({Math.round(currentVideo.size_bytes / 1024)} KB)
                  </button>
                </div>
              )}
            </div>

            {/* 2. Candidate Speech Transcript Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1F2937]">
                  <FileText className="h-4 w-4 text-[#2563EB]" /> Bản chép lời câu trả lời (Transcript)
                </h4>
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#2563EB]"
                >
                  <Copy className="h-3 w-3" /> Sao chép
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap border border-slate-100 max-h-48 overflow-y-auto">
                {currentTurn?.transcript ? (
                  currentTurn.transcript
                ) : (
                  <span className="italic text-slate-400">
                    Chưa có văn bản bóc băng âm thanh cho câu hỏi này.
                  </span>
                )}
              </div>

              {currentTurn?.answered_at && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Clock className="h-3 w-3" /> Trả lời lúc: {new Date(currentTurn.answered_at).toLocaleTimeString("vi-VN")} ngày {new Date(currentTurn.answered_at).toLocaleDateString("vi-VN")}
                </div>
              )}
            </div>

            {/* 3. Anti-cheating / Security Events (if any) */}
            {session.securityEvents && session.securityEvents.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5 text-amber-800">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Cảnh báo an ninh trong buổi phỏng vấn:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                  {session.securityEvents.map((evt, idx) => (
                    <li key={idx}>
                      Sự kiện: <strong>{evt.type}</strong> vào lúc {new Date(evt.happened_at).toLocaleTimeString("vi-VN")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: QUESTION INFO, HR EVALUATION & FINAL DECISION (5 cols) */}
          <section className="lg:col-span-5 space-y-5">
            {/* Card 1: Question Details & Target Competency */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-black text-[#2563EB]">
                  Câu hỏi #{currentTurn?.question.number || activeIdx + 1}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Nguồn: {currentTurn?.question.source === "opening" ? "Câu mở đầu" : currentTurn?.question.source === "llm" ? "AI phỏng vấn" : "Mặc định"}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#1F2937] leading-snug">
                  {currentTurn?.question.text || "Đang tải nội dung câu hỏi..."}
                </h3>
              </div>

              {currentTurn?.question.competency && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-bold">Năng lực đánh giá:</span>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-extrabold text-[#2563EB] border border-blue-100">
                    {currentTurn.question.competency}
                  </span>
                </div>
              )}
            </div>

            {/* Card 2: Question-specific HR Rating */}
            <div className="rounded-2xl border border-blue-100 bg-[#EFF6FF]/40 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#2563EB]" /> Chấm điểm cho Câu #{currentTurn?.question.number || activeIdx + 1}
                </h4>
                <span className="text-xs font-black text-[#2563EB]">
                  {currentRating?.score ? `${currentRating.score} / 10 điểm` : "Chưa chấm"}
                </span>
              </div>

              {/* Quick score buttons: 1 to 10 */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updateCurrentQuestionRating(num)}
                    className={`h-8 rounded-lg font-mono text-xs font-black transition-all ${
                      currentRating?.score === num
                        ? "bg-[#2563EB] text-white shadow-sm scale-105"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nhận xét nhanh cho câu này:
                </label>
                <input
                  type="text"
                  placeholder="VD: Trả lời tự tin, đúng trọng tâm dự án..."
                  value={currentRating?.comment || ""}
                  onChange={(e) => updateCurrentQuestionComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#2563EB] text-[#1F2937]"
                />
              </div>
            </div>

            {/* Card 3: OVERALL DECISION PANEL (PASSED / FAILED) */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-md space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#2563EB]" /> Tổng kết & Quyết định vòng phỏng vấn online
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đánh giá ứng viên có qua được vòng phỏng vấn online với AI này hay không.
                </p>
              </div>

              {/* Overall Score input */}
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-extrabold text-[#1F2937]">
                  Điểm tổng kết buổi phỏng vấn:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={overallScore}
                    onChange={(e) => setOverallScore(Number(e.target.value))}
                    className="w-16 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-mono text-sm font-black text-[#1F2937] outline-none focus:border-[#2563EB] focus:bg-white"
                  />
                  <span className="text-xs font-bold text-slate-400">/ 100 đ</span>
                </div>
              </div>

              {/* Feedback Note textarea */}
              <div>
                <label className="block text-xs font-extrabold text-[#1F2937] mb-1">
                  Nhận xét tổng quát của HR <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi nhận đánh giá năng lực, thái độ và lý do cho ứng viên Đạt hoặc Không đạt..."
                  value={overallNote}
                  onChange={(e) => setOverallNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-[#1F2937] outline-none focus:border-[#2563EB] focus:bg-white transition leading-relaxed font-medium"
                />
              </div>

              {/* DECISION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* 1. KHÔNG ĐẠT */}
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleSubmitDecision("FAILED")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 hover:bg-rose-100 hover:border-rose-400 transition disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" /> KHÔNG ĐẠT
                </button>

                {/* 2. ĐẠT (VƯỢT QUA VÒNG ONLINE) */}
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleSubmitDecision("PASSED")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingDecision ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  XÁC NHẬN ĐẠT
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
