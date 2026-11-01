'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Download, HelpCircle, Loader2, RefreshCw, Video } from 'lucide-react';
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
import { AiInterviewReviewWorkspace } from './AiInterviewReviewWorkspace';
import { formatQuestionReviews, getReviewAverage, reviewDraftKey } from './interview-review-state';
import { useInterviewReviewDraft } from './useInterviewReviewDraft';

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

const subscribe = () => () => {};

// Render at the document root so transformed HR panels cannot offset the workspace.
export function AiInterviewReviewModal(props: AiInterviewReviewModalProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!props.isOpen || !mounted) return null;
  return createPortal(<InterviewReviewContent key={reviewDraftKey(props.token, props.session.id) ?? props.session.id} {...props} />, document.body);
}

function InterviewReviewContent({
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

  const questionNumbers = useMemo(() => turns.map(turn => turn.question.number), [turns]);
  const { draft, setDraft, ready, saved, clearDraft } = useInterviewReviewDraft(token, session.id, questionNumbers, canDecide);
  const questionRatings = draft.ratings;
  const overallScore = draft.overallScore ?? getReviewAverage(questionRatings);
  const overallNote = draft.overallNote;
  const [summary, setSummary] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(true);
  const workspaceRef = useRef<HTMLDivElement>(null);
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
    if (!pendingDecision) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    workspaceRef.current?.querySelector<HTMLButtonElement>('[aria-labelledby="interview-decision-title"] button')?.focus();
    return () => { previous?.focus(); };
  }, [pendingDecision]);

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
            toast.error('Không thể tải video câu hỏi này. Vui lòng thử lại.');
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
      if (summary || videoId !== currentVideo?.id) {
        element.pause();
      } else {
        element.playbackRate = playbackRate;
      }
    }
  }, [currentVideo?.id, playbackRate, summary]);

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

  const handleCopyTranscript = async () => {
    if (!currentTurn?.transcript) return;
    try {
      await navigator.clipboard.writeText(currentTurn.transcript);
      toast.success('Đã sao chép nội dung câu trả lời!');
    } catch { toast.error('Không thể sao chép. Vui lòng chọn và sao chép văn bản thủ công.'); }
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
    if (!currentTurn || !canDecide || !ready) return;
    const number = currentTurn.question.number;
    setDraft(prev => ({ ...prev, ratings: { ...prev.ratings, [number]: { score, comment: prev.ratings[number]?.comment ?? '' } } }));
  };

  const updateCurrentQuestionComment = (comment: string) => {
    if (!currentTurn || !canDecide || !ready) return;
    const number = currentTurn.question.number;
    setDraft(prev => ({ ...prev, ratings: { ...prev.ratings, [number]: { score: prev.ratings[number]?.score ?? null, comment } } }));
  };

  const selectQuestion = (index: number) => {
    setActiveIdx(Math.max(0, Math.min(turns.length - 1, index)));
    setSummary(false);
    document.getElementById('interview-review-scroll')?.scrollTo({ top: 0 });
  };

  const changeStep = (value: boolean) => {
    setSummary(value);
    document.getElementById('interview-review-scroll')?.scrollTo({ top: 0 });
  };

  const retryCurrentVideo = () => {
    if (!currentVideo) return;
    const cached = videoSourcesRef.current[currentVideo.id];
    if (cached?.kind === 'blob') URL.revokeObjectURL(cached.url);
    const next = { ...videoSourcesRef.current };
    delete next[currentVideo.id];
    videoSourcesRef.current = next;
    setVideoSources(next);
    setVideoErrors(prev => ({ ...prev, [currentVideo.id]: false }));
    setVideoReady(prev => ({ ...prev, [currentVideo.id]: false }));
  };

  useEffect(() => {
    if (!ready || summary || !currentTurn) return;
    const number = currentTurn.question.number;
    // Record opening a question separately from actually grading it.
    setDraft(prev => prev.viewed.includes(number) ? prev : { ...prev, viewed: [...prev.viewed, number] });
  }, [ready, summary, currentTurn, setDraft]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    workspaceRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (submittingDecision) return;
        if (pendingDecision) setPendingDecision(null);
        else onClose();
      }
      if (event.key !== 'Tab') return;
      const scope = pendingDecision ? workspaceRef.current?.querySelector('[aria-labelledby="interview-decision-title"]') : workspaceRef.current;
      const elements = Array.from(scope?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), summary, a[href], [tabindex="0"]') ?? []).filter(element => element.getClientRects().length && !element.closest('[hidden]'));
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (!scope?.contains(document.activeElement) || document.activeElement === scope || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, pendingDecision, submittingDecision]);

  // Submit final decision: ĐẠT or KHÔNG ĐẠT
  const handleSubmitDecision = async (decision: 'PASSED' | 'FAILED') => {
    if (!canDecide || !ready || submittingDecision) return;
    if (!token) {
      toast.info('Bản xem thử chưa đăng nhập: quyết định không được gửi.');
      return;
    }
    if (overallScore === null || !Number.isInteger(overallScore) || overallScore < 0 || overallScore > 100) {
      toast.error('Vui lòng nhập điểm tổng kết từ 0 đến 100.');
      return;
    }
    if (!overallNote.trim()) {
      toast.error('Vui lòng nhập nhận xét tổng kết cho ứng viên trước khi quyết định');
      return;
    }

    setSubmittingDecision(true);
    try {
      // Format notes including per-question summary if available
      const questionSummary = formatQuestionReviews(questionRatings);

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

      clearDraft();
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
    if (!canDecide || !ready || submittingDecision) return;
    if (action !== 'RETRY' && overallScore === null) { toast.error('Vui lòng chấm điểm trước khi quyết định.'); return; }
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
      clearDraft();
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

  const player = (
            <div className="rounded-xl border border-slate-200 bg-black overflow-hidden shadow-sm relative">
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
                      onError={() => setVideoErrors(prev => ({ ...prev, [video.id]: true }))}
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
                      <button type="button" onClick={retryCurrentVideo} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><RefreshCw className="size-4" />Thử tải lại</button>
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
                    <p className="text-xs text-slate-500 max-w-xs">
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
                    <span className="text-xs uppercase font-bold text-slate-400">
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
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Download className="h-3 w-3" /> Tải file (
                    {Math.round(currentVideo.size_bytes / 1024)} KB)
                  </button>
                </div>
              )}
            </div>


  );

  return (
    <div ref={workspaceRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="interview-review-title" className="fixed inset-0 z-[70] outline-none">
      <AiInterviewReviewWorkspace candidateName={candidateName} jobTitle={jobTitle} roundTitle={roundTitle}
        session={session} turns={turns} activeIdx={activeIdx} draft={draft} overallScore={overallScore}
        saved={saved} ready={ready} canDecide={canDecide} submitting={submittingDecision}
        summary={summary} transcriptExpanded={transcriptExpanded} player={player}
        onClose={onClose} onSelect={selectQuestion} onSummary={changeStep}
        onToggleTranscript={() => setTranscriptExpanded(value => !value)} onCopy={() => void handleCopyTranscript()}
        onScore={updateCurrentQuestionRating} onComment={updateCurrentQuestionComment}
        onOverallScore={value => setDraft(prev => ({ ...prev, overallScore: value === null ? null : Math.max(0, Math.min(100, Math.round(value))) }))}
        onOverallNote={value => setDraft(prev => ({ ...prev, overallNote: value }))}
        onDecision={requestDecision} canRetry={!!onRequestRetry} isFinalRound={isFinalRound} />
      <InterviewDecisionDialog open={!!pendingDecision} action={pendingDecision} roundTitle={roundTitle}
        nextRoundTitle={nextRoundTitle} isFinalRound={isFinalRound} submitting={submittingDecision}
        onClose={() => setPendingDecision(null)} onConfirm={() => void confirmDecision()} />
    </div>
  );
}
