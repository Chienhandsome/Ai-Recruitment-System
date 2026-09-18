'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type AiInterviewSession,
  type AiInterviewTurn,
  type AiInterviewVideo,
  type AiInterviewVideoPlaybackSource,
  decideAiInterview,
  downloadAiInterviewVideo,
  getAiInterviewVideoPlaybackSource,
} from '@/lib/interview-api';
import { InterviewDecisionDialog, type InterviewDecisionAction } from './InterviewDecisionDialog';

interface AiInterviewReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  session: AiInterviewSession;
  candidateName: string;
  jobTitle: string;
  roundTitle?: string;
  nextRoundTitle?: string | null;
  isFinalRound?: boolean;
  canDecide?: boolean;
  onRequestRetry?: () => Promise<boolean | void> | boolean | void;
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
  roundTitle = 'vòng phỏng vấn online AI',
  nextRoundTitle,
  isFinalRound = true,
  canDecide = true,
  onRequestRetry,
  onEvaluated,
}: AiInterviewReviewModalProps) {
  // Ordered questions/turns
  const turns: AiInterviewTurn[] = useMemo(() => {
    if (!session.transcript || !Array.isArray(session.transcript)) return [];
    return [...session.transcript].sort((a, b) => a.question.number - b.question.number);
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
  const [videoSources, setVideoSources] = useState<Record<string, AiInterviewVideoPlaybackSource>>(
    {},
  );
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [videoReady, setVideoReady] = useState<Record<string, boolean>>({});
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoSourcesRef = useRef<Record<string, AiInterviewVideoPlaybackSource>>({});
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const videoPositionsRef = useRef<Record<string, number>>({});
  const videoRequestsRef = useRef<Map<string, Promise<AiInterviewVideoPlaybackSource>>>(
    new Map(),
  );
  const activeSessionIdRef = useRef(session.id);
  const componentMountedRef = useRef(true);

  // Per-question ratings
  const [questionRatings, setQuestionRatings] = useState<Record<number, QuestionEvaluation>>({});

  // Overall evaluation form
  const [overallScore, setOverallScore] = useState<number>(80);
  const [overallNote, setOverallNote] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<InterviewDecisionAction | null>(null);

  const currentTurn = turns[activeIdx] ?? null;
  const currentVideo = currentTurn ? videoMap.get(currentTurn.question.number) : null;

  // Keep only the previous, current and next players mounted. This preserves the
  // browser buffer when HR moves one question backward or forward without keeping
  // every interview video in memory.
  const bufferedVideos = useMemo(() => {
    const videos: AiInterviewVideo[] = [];
    const start = Math.max(0, activeIdx - 1);
    const end = Math.min(turns.length - 1, activeIdx + 1);
    for (let index = start; index <= end; index += 1) {
      const turn = turns[index];
      const video = turn ? videoMap.get(turn.question.number) : null;
      if (video) videos.push(video);
    }
    return videos;
  }, [activeIdx, turns, videoMap]);

  useEffect(() => {
    videoSourcesRef.current = videoSources;
  }, [videoSources]);

  useEffect(() => {
    activeSessionIdRef.current = session.id;
  }, [session.id]);

  // Fetch the current URL and prepare the adjacent players. Requests are shared
  // per video so quick navigation cannot trigger duplicate downloads.
  useEffect(() => {
    if (!isOpen) return;
    const requestedSessionId = session.id;

    for (const video of bufferedVideos) {
      const videoId = video.id;
      const cached = videoSourcesRef.current[videoId];
      if (cached && (!cached.expiresAt || cached.expiresAt > Date.now() + 10_000)) continue;
      if (videoRequestsRef.current.has(videoId)) continue;
      if (videoErrors[videoId] && videoId === currentVideo?.id) continue;

      const request = getAiInterviewVideoPlaybackSource(token, requestedSessionId, videoId);
      videoRequestsRef.current.set(videoId, request);
      request
        .then((source) => {
          if (!componentMountedRef.current || activeSessionIdRef.current !== requestedSessionId) {
            if (source.kind === 'blob') URL.revokeObjectURL(source.url);
            return;
          }
          setVideoSources((prev) => {
            const previous = prev[videoId];
            if (previous?.kind === 'blob' && previous.url !== source.url) {
              URL.revokeObjectURL(previous.url);
            }
            const next = { ...prev, [videoId]: source };
            videoSourcesRef.current = next;
            return next;
          });
          setVideoErrors((prev) => {
            if (!prev[videoId]) return prev;
            const next = { ...prev };
            delete next[videoId];
            return next;
          });
        })
        .catch((err) => {
          console.error('Failed to stream video', err);
          // A speculative preload may be retried when that video becomes active.
          if (componentMountedRef.current && videoId === currentVideo?.id) {
            setVideoErrors((prev) => ({ ...prev, [videoId]: true }));
            toast.error('Không thể tải video câu hỏi này từ Supabase');
          }
        })
        .finally(() => {
          videoRequestsRef.current.delete(videoId);
        });
    }
  }, [bufferedVideos, currentVideo?.id, isOpen, session.id, token, videoErrors]);

  // Blob fallback contains the entire file in memory. Keep it only for the same
  // three-video window; signed URLs are cheap and can remain cached for the session.
  useEffect(() => {
    const retainedIds = new Set(bufferedVideos.map((video) => video.id));
    setVideoSources((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [videoId, source] of Object.entries(prev)) {
        if (source.kind === 'blob' && !retainedIds.has(videoId)) {
          URL.revokeObjectURL(source.url);
          delete next[videoId];
          changed = true;
        }
      }
      if (changed) videoSourcesRef.current = next;
      return changed ? next : prev;
    });
  }, [bufferedVideos]);

  // Pause inactive players but keep their DOM nodes and buffers alive.
  useEffect(() => {
    for (const [videoId, element] of videoElementsRef.current) {
      if (videoId !== currentVideo?.id) {
        element.pause();
      } else {
        element.playbackRate = playbackRate;
      }
    }
  }, [currentVideo?.id, playbackRate]);

  // Revoke only local fallback Blob URLs when the modal component unmounts.
  useEffect(() => {
    componentMountedRef.current = true;
    const videoElements = videoElementsRef.current;
    return () => {
      componentMountedRef.current = false;
      Object.values(videoSourcesRef.current).forEach((source) => {
        if (source.kind === 'blob') {
          try {
            URL.revokeObjectURL(source.url);
          } catch {
            // ignore
          }
        }
      });
      videoElements.forEach((element) => element.pause());
      videoElements.clear();
    };
  }, []);

  // Apply playback speed
  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    const activeVideo = currentVideo ? videoElementsRef.current.get(currentVideo.id) : null;
    if (activeVideo) {
      activeVideo.playbackRate = rate;
    }
  };

  const handleCopyTranscript = () => {
    if (!currentTurn?.transcript) return;
    navigator.clipboard.writeText(currentTurn.transcript);
    toast.success('Đã sao chép nội dung câu trả lời!');
  };

  const handleDownloadCurrentVideo = async () => {
    if (!currentVideo) return;
    try {
      await downloadAiInterviewVideo(token, session.id, currentVideo.id);
      toast.success('Bắt đầu tải video câu trả lời...');
    } catch {
      toast.error('Không thể tải file video');
    }
  };

  const updateCurrentQuestionRating = (score: number) => {
    if (!currentTurn) return;
    const num = currentTurn.question.number;
    const nextRatings = {
      ...questionRatings,
      [num]: {
        score,
        comment: questionRatings[num]?.comment || '',
      },
    };
    setQuestionRatings(nextRatings);
    const ratedValues = Object.values(nextRatings);
    const average = ratedValues.reduce((sum, item) => sum + item.score, 0) / ratedValues.length;
    setOverallScore(Math.round(average * 10));
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
  const handleSubmitDecision = async (decision: 'PASSED' | 'FAILED') => {
    if (!overallNote.trim()) {
      toast.error('Vui lòng nhập nhận xét tổng kết cho ứng viên trước khi quyết định');
      return;
    }

    setSubmittingDecision(true);
    try {
      // Format notes including per-question summary if available
      const questionSummary = Object.entries(questionRatings)
        .map(
          ([qNum, val]) =>
            `• Câu ${qNum}: ${val.score}/10 đ${val.comment ? ` - ${val.comment}` : ''}`,
        )
        .join('\n');

      const finalNote = [
        overallNote.trim(),
        questionSummary ? `\n\n[Chi tiết chấm điểm theo câu hỏi]:\n${questionSummary}` : '',
      ]
        .filter(Boolean)
        .join('');

      await decideAiInterview(token, session.id, {
        decision,
        score: overallScore,
        note: finalNote,
      });

      if (decision === 'PASSED') {
        toast.success(
          isFinalRound
            ? 'Đã hoàn tất quy trình phỏng vấn. Hồ sơ đang chờ cân nhắc Offer.'
            : 'Ứng viên đã qua vòng này. Vòng tiếp theo đã được mở.',
        );
      } else {
        toast.success('Đã từ chối ứng viên và kết thúc quy trình phỏng vấn.');
      }

      setPendingDecision(null);
      await onEvaluated?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu quyết định đánh giá');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const requestDecision = (action: InterviewDecisionAction) => {
    if ((action === 'PASS' || action === 'REJECT') && !overallNote.trim()) {
      toast.error('Vui lòng nhập nhận xét tổng kết cho ứng viên trước khi quyết định');
      return;
    }
    setPendingDecision(action);
  };

  const confirmDecision = async () => {
    if (!pendingDecision) return;
    if (pendingDecision !== 'RETRY') {
      await handleSubmitDecision(pendingDecision === 'PASS' ? 'PASSED' : 'FAILED');
      return;
    }
    if (!onRequestRetry) return;

    setSubmittingDecision(true);
    try {
      const succeeded = await onRequestRetry();
      if (succeeded === false) return;
      setPendingDecision(null);
      toast.success('Đã mở lại vòng phỏng vấn để ứng viên thực hiện từ đầu.');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể mở lại vòng phỏng vấn');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (!isOpen) return null;

  const currentVideoSource = currentVideo ? videoSources[currentVideo.id] : null;
  const currentVideoUrl = currentVideoSource?.url ?? null;
  const currentVideoError = currentVideo ? Boolean(videoErrors[currentVideo.id]) : false;
  const currentVideoReady = currentVideo ? Boolean(videoReady[currentVideo.id]) : false;
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
                Vị trí: <strong className="text-slate-700">{jobTitle}</strong> | Tổng số:{' '}
                {turns.length} câu hỏi | Hoàn tất lúc:{' '}
                {session.completedAt
                  ? new Date(session.completedAt).toLocaleString('vi-VN')
                  : 'N/A'}
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
                        ? 'bg-[#2563EB] text-white shadow-sm ring-2 ring-[#2563EB]/30'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <span>Câu {qNum}</span>
                    {hasVideo && (
                      <Video
                        className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-[#2563EB]'}`}
                      />
                    )}
                    {rating && (
                      <span
                        className={`rounded px-1 text-[10px] font-mono ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
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
                {bufferedVideos.map((video) => {
                  const source = videoSources[video.id];
                  if (!source) return null;
                  const isActive = video.id === currentVideo?.id;
                  return (
                    <video
                      key={video.id}
                      ref={(element) => {
                        const previous = videoElementsRef.current.get(video.id);
                        if (!element) {
                          if (previous && Number.isFinite(previous.currentTime)) {
                            videoPositionsRef.current[video.id] = previous.currentTime;
                          }
                          videoElementsRef.current.delete(video.id);
                          return;
                        }
                        videoElementsRef.current.set(video.id, element);
                      }}
                      src={source.url}
                      controls={isActive}
                      preload="auto"
                      playsInline
                      aria-hidden={!isActive}
                      onLoadStart={() =>
                        setVideoReady((prev) => ({ ...prev, [video.id]: false }))
                      }
                      onLoadedMetadata={(event) => {
                        const element = event.currentTarget;
                        const savedPosition = videoPositionsRef.current[video.id] ?? 0;
                        if (savedPosition > 0 && savedPosition < element.duration) {
                          element.currentTime = savedPosition;
                        }
                        element.playbackRate = playbackRate;
                      }}
                      onCanPlay={() =>
                        setVideoReady((prev) =>
                          prev[video.id] ? prev : { ...prev, [video.id]: true },
                        )
                      }
                      onTimeUpdate={(event) => {
                        videoPositionsRef.current[video.id] = event.currentTarget.currentTime;
                      }}
                      className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
                        isActive
                          ? 'visible z-[1] opacity-100'
                          : 'invisible pointer-events-none opacity-0'
                      }`}
                    />
                  );
                })}

                {currentVideo && !currentVideoError && (!currentVideoUrl || !currentVideoReady) && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/85 p-8 text-center text-slate-300">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
                    <p className="text-xs font-bold">
                      {currentVideoUrl
                        ? 'Đang chuẩn bị bộ đệm video...'
                        : 'Đang lấy đường dẫn phát video...' }
                    </p>
                  </div>
                )}

                {currentVideo ? (
                  currentVideoError ? (
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
                  ) : null
                ) : (
                  <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-400">
                    <HelpCircle className="h-8 w-8 text-slate-600" />
                    <p className="text-xs font-bold">
                      Không tìm thấy video ghi hình cho câu hỏi này.
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Ứng viên có thể đã trả lời bằng microphone hoặc hệ thống đã ghi nhận dưới dạng
                      bản chép lời (transcript).
                    </p>
                  </div>
                )}
              </div>

              {/* Video Toolbar */}
              {currentVideo && (
                <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Tốc độ xem:
                    </span>
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => changeSpeed(rate)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                          playbackRate === rate
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
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
                    <Download className="h-3 w-3" /> Tải file (
                    {Math.round(currentVideo.size_bytes / 1024)} KB)
                  </button>
                </div>
              )}
            </div>

            {/* 2. Candidate Speech Transcript Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1F2937]">
                  <FileText className="h-4 w-4 text-[#2563EB]" /> Bản chép lời câu trả lời
                  (Transcript)
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
                  <Clock className="h-3 w-3" /> Trả lời lúc:{' '}
                  {new Date(currentTurn.answered_at).toLocaleTimeString('vi-VN')} ngày{' '}
                  {new Date(currentTurn.answered_at).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>

            {/* 3. Anti-cheating / Security Events (if any) */}
            {session.securityEvents && session.securityEvents.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5 text-amber-800">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Cảnh báo an ninh trong buổi
                  phỏng vấn:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                  {session.securityEvents.map((evt, idx) => (
                    <li key={idx}>
                      Sự kiện: <strong>{evt.type}</strong> vào lúc{' '}
                      {new Date(evt.happened_at).toLocaleTimeString('vi-VN')}
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
                  Nguồn:{' '}
                  {currentTurn?.question.source === 'opening'
                    ? 'Câu mở đầu'
                    : currentTurn?.question.source === 'llm'
                      ? 'AI phỏng vấn'
                      : 'Mặc định'}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#1F2937] leading-snug">
                  {currentTurn?.question.text || 'Đang tải nội dung câu hỏi...'}
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
                  <Award className="h-4 w-4 text-[#2563EB]" /> Chấm điểm cho Câu #
                  {currentTurn?.question.number || activeIdx + 1}
                </h4>
                <span className="text-xs font-black text-[#2563EB]">
                  {currentRating?.score ? `${currentRating.score} / 10 điểm` : 'Chưa chấm'}
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
                        ? 'bg-[#2563EB] text-white shadow-sm scale-105'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:bg-blue-50'
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
                  value={currentRating?.comment || ''}
                  onChange={(e) => updateCurrentQuestionComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#2563EB] text-[#1F2937]"
                />
              </div>
            </div>

            {/* Card 3: Overall evaluation and decision */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-md space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#2563EB]" /> Tổng kết và quyết định vòng phỏng
                  vấn online
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

              {canDecide ? (
                <div
                  className={`grid gap-2.5 pt-2 ${onRequestRetry ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}
                >
                  {onRequestRetry && (
                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => requestDecision('RETRY')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-xs font-black text-amber-800 transition hover:bg-amber-50 active:scale-[0.98] disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" /> LÀM LẠI
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={submittingDecision}
                    onClick={() => requestDecision('REJECT')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-50 active:scale-[0.98] disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> TỪ CHỐI
                  </button>

                  <button
                    type="button"
                    disabled={submittingDecision}
                    onClick={() => requestDecision('PASS')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2.5 text-xs font-black text-white transition hover:bg-blue-800 active:scale-[0.98] disabled:opacity-50"
                  >
                    {submittingDecision ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {isFinalRound ? 'HOÀN TẤT' : 'QUA VÒNG'}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
                  Vòng này đã có quyết định. Bạn vẫn có thể xem lại video, transcript và nhận xét đã
                  chấm.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <InterviewDecisionDialog
        open={!!pendingDecision}
        action={pendingDecision}
        roundTitle={roundTitle}
        nextRoundTitle={nextRoundTitle}
        isFinalRound={isFinalRound}
        submitting={submittingDecision}
        onClose={() => setPendingDecision(null)}
        onConfirm={() => void confirmDecision()}
      />
    </div>
  );
}
