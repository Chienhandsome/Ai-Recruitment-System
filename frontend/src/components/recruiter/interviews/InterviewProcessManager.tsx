'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Bot,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ClipboardCheck,
  Download,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UserRound,
  Video,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateOrEditOfferModal } from '../offers/CreateOrEditOfferModal';
import {
  activateInterviewProcess,
  addInterviewRound,
  createAiInterview,
  createInterview,
  createInterviewProcess,
  decideInterviewRound,
  deleteInterviewRound,
  downloadAiInterviewVideo,
  getInterviewProcess,
  reorderInterviewRounds,
  retryInterviewRound,
  submitInterviewFeedback,
  syncAiInterviewSession,
  type AiInterviewSession,
  type InterviewConductedBy,
  type InterviewMode,
  type InterviewProcessData,
  type InterviewPurpose,
  type InterviewRoundData,
} from '@/lib/interview-api';
import { updateApplicationStage, type ApplicationStage } from '@/lib/recruiter-api';
import { AiInterviewReviewModal } from './AiInterviewReviewModal';
import { InterviewDecisionDialog, type InterviewDecisionAction } from './InterviewDecisionDialog';

interface InterviewProcessManagerProps {
  token: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  currentStage?: ApplicationStage | string;
  onCreated?: () => void;
}

const statusLabels: Record<InterviewRoundData['status'], string> = {
  DRAFT: 'Bản nháp',
  READY: 'Sẵn sàng',
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang thực hiện',
  AWAITING_REVIEW: 'Chờ HR đánh giá',
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Đã hết hạn',
  NO_SHOW: 'Không tham gia',
};

const statusStyles: Record<InterviewRoundData['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  READY: 'bg-blue-100 text-blue-800',
  SCHEDULED: 'bg-cyan-100 text-cyan-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  AWAITING_REVIEW: 'bg-orange-100 text-orange-800',
  PASSED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
  EXPIRED: 'bg-rose-100 text-rose-800',
  NO_SHOW: 'bg-rose-100 text-rose-800',
};

const purposeLabels: Record<InterviewPurpose, string> = {
  SCREENING: 'Sơ tuyển',
  TECHNICAL: 'Chuyên môn',
  BEHAVIORAL: 'Hành vi',
  CULTURE_FIT: 'Phù hợp văn hóa',
  FINAL: 'Vòng cuối',
  CUSTOM: 'Tùy chỉnh',
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa lên lịch';
}

export function InterviewProcessManager({
  token,
  applicationId,
  candidateName,
  jobTitle,
  currentStage,
  onCreated,
}: InterviewProcessManagerProps) {
  const passedScreeningStages = [
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED',
    'OFFERED',
    'HIRED',
  ];

  if (!currentStage || !passedScreeningStages.includes(currentStage)) {
    return null;
  }

  const [open, setOpen] = useState(false);
  const [process, setProcess] = useState<InterviewProcessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reviewingAiSession, setReviewingAiSession] = useState<AiInterviewSession | null>(null);
  const [pendingDecision, setPendingDecision] = useState<InterviewDecisionAction | null>(null);

  const [title, setTitle] = useState('Sơ tuyển với AI');
  const [description, setDescription] = useState('');
  const [conductedBy, setConductedBy] = useState<InterviewConductedBy>('AI');
  const [mode, setMode] = useState<InterviewMode>('ASYNC_WEB');
  const [purpose, setPurpose] = useState<InterviewPurpose>('SCREENING');
  const [scheduledAt, setScheduledAt] = useState('');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [question1, setQuestion1] = useState(
    'Bạn hãy giới thiệu ngắn gọn về bản thân và kinh nghiệm phù hợp nhất với vị trí này.',
  );
  const [question2, setQuestion2] = useState('Điều gì khiến bạn quan tâm đến vị trí này?');
  const [competencies, setCompetencies] = useState(
    'technical_experience, problem_solving, collaboration',
  );
  const [maxQuestions, setMaxQuestions] = useState(6);
  const [expiryDays, setExpiryDays] = useState(3);
  const [score, setScore] = useState(80);
  const [note, setNote] = useState('');

  const [quickTitle, setQuickTitle] = useState('Phỏng vấn Chuyên môn');
  const [quickMode, setQuickMode] = useState<InterviewMode>('VIDEO_CALL');
  const [quickScheduledAt, setQuickScheduledAt] = useState('');
  const [quickLocationOrLink, setQuickLocationOrLink] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const currentRound = useMemo(
    () => process?.rounds.find((round) => round.order === process.currentRoundOrder),
    [process],
  );
  const nextRound = useMemo(
    () =>
      currentRound
        ? process?.rounds.find(
            (round) => round.order > currentRound.order && round.status !== 'CANCELLED',
          )
        : undefined,
    [currentRound, process],
  );
  const reviewingRound = useMemo(
    () =>
      reviewingAiSession
        ? process?.rounds.find((round) =>
            round.aiInterviewSessions.some((session) => session.id === reviewingAiSession.id),
          )
        : undefined,
    [process, reviewingAiSession],
  );
  const reviewingNextRound = useMemo(
    () =>
      reviewingRound
        ? process?.rounds.find(
            (round) => round.order > reviewingRound.order && round.status !== 'CANCELLED',
          )
        : undefined,
    [process, reviewingRound],
  );

  const loadProcess = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProcess(await getInterviewProcess(token, applicationId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải quy trình.');
    } finally {
      setLoading(false);
    }
  }, [applicationId, token]);

  function reportError(requestError: unknown) {
    const message =
      requestError instanceof Error ? requestError.message : 'Không thể thực hiện thao tác.';
    setError(message);
    toast.error(message);
  }

  async function handleCreateProcess() {
    setSaving(true);
    setError('');
    try {
      setProcess(await createInterviewProcess(token, applicationId));
      toast.success('Đã tạo kế hoạch phỏng vấn.');
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickSchedule() {
    if (!quickTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề buổi phỏng vấn');
      return;
    }
    if (!quickScheduledAt) {
      toast.error('Vui lòng chọn thời gian phỏng vấn');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let currentProcess = process;
      if (!currentProcess) {
        currentProcess = await createInterviewProcess(token, applicationId);
      }
      const newRound = await addInterviewRound(token, currentProcess.id, {
        title: quickTitle.trim(),
        description: quickNotes.trim() || undefined,
        conductedBy: 'HUMAN',
        mode: quickMode,
        purpose: 'TECHNICAL',
        scheduledAt: new Date(quickScheduledAt).toISOString(),
        locationOrLink: quickLocationOrLink.trim() || undefined,
        durationMinutes: 60,
      });
      await activateInterviewProcess(token, currentProcess.id);
      await createInterview(token, {
        applicationId,
        roundId: newRound.id,
        title: quickTitle.trim(),
        type: quickMode === 'IN_PERSON' ? 'OFFLINE' : 'ONLINE',
        scheduledAt: new Date(quickScheduledAt).toISOString(),
        durationMinutes: 60,
        locationOrLink: quickLocationOrLink.trim() || undefined,
        interviewerNotes: quickNotes.trim() || undefined,
      });
      setProcess(await getInterviewProcess(token, applicationId));
      toast.success('Đã lên lịch phỏng vấn và kích hoạt quy trình thành công!');
      onCreated?.();
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendOffer() {
    setSaving(true);
    try {
      await updateApplicationStage(token, applicationId, {
        targetStage: 'OFFERED',
        expectedStage: 'INTERVIEWED',
        note: 'Ứng viên đã hoàn tất xuất sắc các vòng phỏng vấn và được đề nghị nhận việc.',
      });
      toast.success('Đã chuyển trạng thái hồ sơ sang “Đã gửi đề nghị (Offer)” thành công!');
      onCreated?.();
      setOpen(false);
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddRound() {
    if (!process || !title.trim()) return;
    const openingQuestions = [question1.trim(), question2.trim()].filter(Boolean);
    const competencyList = competencies
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (conductedBy === 'AI' && (!openingQuestions.length || !competencyList.length)) {
      setError('Vòng AI cần ít nhất một câu hỏi mở đầu và một năng lực đánh giá.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addInterviewRound(token, process.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        conductedBy,
        mode,
        purpose,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        locationOrLink: locationOrLink.trim() || undefined,
        durationMinutes: 60,
        evaluationCriteria:
          conductedBy === 'AI'
            ? {
                openingQuestions,
                competencies: competencyList,
                maxQuestions,
                expiresInHours: expiryDays * 24,
              }
            : undefined,
      });
      await loadProcess();
      setTitle('');
      setDescription('');
      toast.success('Đã thêm vòng phỏng vấn.');
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function moveRound(index: number, direction: -1 | 1) {
    if (!process) return;
    const target = index + direction;
    if (target < 0 || target >= process.rounds.length) return;
    const ids = process.rounds.map((round) => round.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setSaving(true);
    try {
      setProcess(await reorderInterviewRounds(token, process.id, ids));
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function removeRound(roundId: string) {
    setSaving(true);
    try {
      await deleteInterviewRound(token, roundId);
      await loadProcess();
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function activateProcess() {
    if (!process) return;
    setSaving(true);
    setError('');
    try {
      setProcess(await activateInterviewProcess(token, process.id));
      toast.success('Đã kích hoạt quy trình. Vòng đầu tiên đã sẵn sàng.');
      onCreated?.();
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function startReadyRound(round: InterviewRoundData) {
    setSaving(true);
    setError('');
    try {
      if (round.conductedBy === 'AI') {
        const criteria = round.evaluationCriteria ?? {};
        await createAiInterview(token, {
          applicationId,
          roundId: round.id,
          openingQuestions: criteria.openingQuestions?.length
            ? criteria.openingQuestions
            : ['Bạn hãy giới thiệu ngắn gọn về kinh nghiệm phù hợp với vị trí này.'],
          competencies: criteria.competencies?.length
            ? criteria.competencies
            : ['technical_experience'],
          maxQuestions: criteria.maxQuestions ?? 6,
          expiresInHours: criteria.expiresInHours ?? 72,
        });
        toast.success('Đã tạo link AI và thông báo ứng viên.');
      } else {
        const dateValue = scheduledAt || (round.scheduledAt ? round.scheduledAt.slice(0, 16) : '');
        const placeValue = locationOrLink.trim() || round.locationOrLink || '';
        if (!dateValue) throw new Error('Vui lòng chọn thời gian phỏng vấn.');
        if (!placeValue) throw new Error('Vui lòng nhập địa điểm hoặc meeting link.');
        await createInterview(token, {
          applicationId,
          roundId: round.id,
          title: round.title,
          type: round.mode === 'IN_PERSON' ? 'OFFLINE' : 'ONLINE',
          scheduledAt: new Date(dateValue).toISOString(),
          durationMinutes: round.durationMinutes,
          locationOrLink: placeValue,
          interviewerNotes: round.description || undefined,
        });
        toast.success('Đã lên lịch và thông báo ứng viên.');
      }
      await loadProcess();
      onCreated?.();
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function syncAiRound(sessionId: string) {
    setSaving(true);
    try {
      const res = await syncAiInterviewSession(token, sessionId);
      await loadProcess();
      if (res.status === 'COMPLETED') {
        toast.success('Đã đồng bộ xong kết quả phỏng vấn AI và video!');
        onCreated?.();
      } else {
        toast.info('Đã kiểm tra. Ứng viên vẫn đang làm bài hoặc chưa hoàn thành.');
      }
    } catch (err) {
      reportError(err);
    } finally {
      setSaving(false);
    }
  }

  async function submitHumanFeedback(round: InterviewRoundData) {
    const interview = round.interviews[0];
    if (!interview) return;
    if (!note.trim()) {
      setError('Vui lòng nhập nhận xét trước khi nộp feedback.');
      return;
    }
    setSaving(true);
    try {
      await submitInterviewFeedback(token, interview.id, {
        score,
        interviewerNotes: note.trim(),
      });
      await loadProcess();
      setNote('');
      toast.success('Đã lưu feedback. Vòng đang chờ quyết định của HR.');
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function decide(roundId: string, decision: 'PASSED' | 'FAILED') {
    setSaving(true);
    try {
      const updatedProcess = await decideInterviewRound(token, roundId, {
        decision,
        score,
        note: note.trim() || undefined,
      });
      setProcess(updatedProcess);
      setNote('');
      setPendingDecision(null);
      toast.success(
        decision === 'PASSED'
          ? updatedProcess.status === 'COMPLETED'
            ? 'Đã hoàn tất quy trình phỏng vấn.'
            : 'Đã mở vòng phỏng vấn tiếp theo.'
          : 'Đã từ chối ứng viên và kết thúc quy trình phỏng vấn.',
      );
      onCreated?.();
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function retry(roundId: string) {
    setSaving(true);
    try {
      setProcess(await retryInterviewRound(token, roundId));
      setPendingDecision(null);
      toast.success('Vòng đã được mở lại để thực hiện.');
      onCreated?.();
      return true;
    } catch (requestError) {
      reportError(requestError);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function requestDecision(action: InterviewDecisionAction) {
    if ((action === 'PASS' || action === 'REJECT') && !note.trim()) {
      const message = 'Vui lòng nhập nhận xét tổng kết trước khi đưa ra quyết định.';
      setError(message);
      toast.error(message);
      return;
    }
    setError('');
    setPendingDecision(action);
  }

  function confirmDecision() {
    if (!currentRound || !pendingDecision) return;
    if (pendingDecision === 'RETRY') {
      void retry(currentRound.id);
      return;
    }
    void decide(currentRound.id, pendingDecision === 'PASS' ? 'PASSED' : 'FAILED');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void loadProcess();
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-3 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 cursor-pointer"
      >
        <ClipboardCheck className="h-4 w-4" strokeWidth={2} />
        Quy trình phỏng vấn
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm">
          <div className="max-h-[94dvh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
              <div>
                <h2 className="text-xl font-black text-slate-950">Quy trình phỏng vấn</h2>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {candidateName} · {jobTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 active:translate-y-px"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {error && (
              <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid gap-3 p-5 md:grid-cols-2">
                <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : !process ? (
              <div className="p-6 max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <div className="size-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center mx-auto shadow-2xs">
                    <ClipboardCheck className="size-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Bắt đầu Kế hoạch Phỏng vấn
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Chọn lên lịch nhanh 1 buổi phỏng vấn (phổ biến) hoặc thiết lập quy trình phỏng vấn nhiều vòng linh hoạt.
                  </p>
                </div>

                {/* Chế độ 1: Lên lịch nhanh 1 vòng */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase tracking-wider">
                    <Zap className="size-4 text-[#2563EB]" />
                    Lên lịch nhanh 1 vòng (Phỏng vấn trực tiếp / Online)
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tiêu đề phỏng vấn <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        placeholder="VD: Phỏng vấn Chuyên môn / Technical"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Hình thức phỏng vấn
                        </label>
                        <select
                          value={quickMode}
                          onChange={(e) => setQuickMode(e.target.value as InterviewMode)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#2563EB]"
                        >
                          <option value="VIDEO_CALL">Online (Google Meet / Zoom)</option>
                          <option value="IN_PERSON">Trực tiếp tại văn phòng</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Thời gian phỏng vấn <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={quickScheduledAt}
                          onChange={(e) => setQuickScheduledAt(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {quickMode === 'IN_PERSON' ? 'Địa chỉ văn phòng' : 'Link Google Meet / Zoom'}
                      </label>
                      <input
                        type="text"
                        value={quickLocationOrLink}
                        onChange={(e) => setQuickLocationOrLink(e.target.value)}
                        placeholder={quickMode === 'IN_PERSON' ? 'VD: Tầng 5, Tòa nhà Keangnam, Hà Nội' : 'VD: https://meet.google.com/abc-defg-hij'}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ghi chú dặn dò ứng viên (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={quickNotes}
                        onChange={(e) => setQuickNotes(e.target.value)}
                        placeholder="VD: Ứng viên mang theo laptop và chuẩn bị portfolio"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickSchedule}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] p-3 text-xs font-black text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Zap className="size-4" />
                    )}
                    Tạo &amp; Chốt lịch phỏng vấn ngay
                  </button>
                </div>

                {/* Hoặc tạo quy trình tùy chỉnh */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-500">
                    Cần quy trình nhiều vòng (AI Test + Phỏng vấn)?
                  </span>
                  <button
                    type="button"
                    onClick={handleCreateProcess}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                  >
                    <Plus className="size-3.5" />
                    Tạo kế hoạch nhiều vòng
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 p-5 lg:grid-cols-[0.85fr_1.15fr]">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-950">Thiết lập vòng</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Trạng thái kế hoạch: {process.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadProcess()}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                      aria-label="Làm mới"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  {process.status === 'DRAFT' ? (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <label className="block text-xs font-bold text-slate-700">
                        Tên vòng
                        <input
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-950 outline-none focus:border-blue-600"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-bold text-slate-700">
                          Người thực hiện
                          <select
                            value={conductedBy}
                            onChange={(event) => {
                              const value = event.target.value as InterviewConductedBy;
                              setConductedBy(value);
                              setMode(value === 'AI' ? 'ASYNC_WEB' : 'VIDEO_CALL');
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                          >
                            <option value="AI">AI</option>
                            <option value="HUMAN">Người phỏng vấn</option>
                          </select>
                        </label>
                        <label className="text-xs font-bold text-slate-700">
                          Mục đích
                          <select
                            value={purpose}
                            onChange={(event) => setPurpose(event.target.value as InterviewPurpose)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                          >
                            {Object.entries(purposeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {conductedBy === 'HUMAN' && (
                        <div className="grid grid-cols-2 gap-3">
                          <label className="text-xs font-bold text-slate-700">
                            Hình thức
                            <select
                              value={mode}
                              onChange={(event) => setMode(event.target.value as InterviewMode)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            >
                              <option value="VIDEO_CALL">Online</option>
                              <option value="IN_PERSON">Trực tiếp</option>
                            </select>
                          </label>
                          <label className="text-xs font-bold text-slate-700">
                            Thời gian dự kiến
                            <input
                              type="datetime-local"
                              value={scheduledAt}
                              onChange={(event) => setScheduledAt(event.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            />
                          </label>
                        </div>
                      )}
                      {conductedBy === 'HUMAN' && (
                        <label className="block text-xs font-bold text-slate-700">
                          {mode === 'IN_PERSON' ? 'Địa điểm' : 'Meeting link'}
                          <input
                            value={locationOrLink}
                            onChange={(event) => setLocationOrLink(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                          />
                        </label>
                      )}
                      {conductedBy === 'AI' && (
                        <div className="space-y-3 border-t border-slate-200 pt-3">
                          <label className="block text-xs font-bold text-slate-700">
                            Câu hỏi mở đầu 1
                            <textarea
                              rows={2}
                              value={question1}
                              onChange={(event) => setQuestion1(event.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-bold text-slate-700">
                            Câu hỏi mở đầu 2
                            <textarea
                              rows={2}
                              value={question2}
                              onChange={(event) => setQuestion2(event.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-bold text-slate-700">
                            Năng lực đánh giá
                            <input
                              value={competencies}
                              onChange={(event) => setCompetencies(event.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
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
                        </div>
                      )}
                      <label className="block text-xs font-bold text-slate-700">
                        Ghi chú
                        <textarea
                          rows={2}
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleAddRound}
                        disabled={saving || !title.trim()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
                      >
                        <Plus className="h-4 w-4" /> Thêm vòng
                      </button>
                    </div>
                  ) : currentRound ? (
                    <RoundActionPanel
                      round={currentRound}
                      scheduledAt={scheduledAt}
                      setScheduledAt={setScheduledAt}
                      locationOrLink={locationOrLink}
                      setLocationOrLink={setLocationOrLink}
                      score={score}
                      setScore={setScore}
                      note={note}
                      setNote={setNote}
                      saving={saving}
                      onStart={() => void startReadyRound(currentRound)}
                      onSubmitFeedback={() => void submitHumanFeedback(currentRound)}
                      nextRoundTitle={nextRound?.title}
                      onDecide={(decision) =>
                        requestDecision(decision === 'PASSED' ? 'PASS' : 'REJECT')
                      }
                      onRetry={() => requestDecision('RETRY')}
                      onReviewAiSession={setReviewingAiSession}
                      onSyncAiSession={(sessionId) => void syncAiRound(sessionId)}
                    />
                  ) : process.status === 'CANCELLED' ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                      <ShieldAlert className="h-6 w-6 text-rose-700" />
                      <p className="mt-2 font-black text-rose-950">Quy trình đã kết thúc</p>
                      <p className="mt-1 text-sm text-rose-800">
                        Ứng viên đã được chuyển sang trạng thái Chưa phù hợp.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-emerald-950 text-sm">🎉 Ứng viên đã đạt toàn bộ các vòng phỏng vấn!</p>
                          <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                            Quy trình phỏng vấn đã hoàn tất thành công. Ứng viên đã vượt qua đầy đủ các tiêu chí tuyển dụng. Bạn có thể tiến hành gửi Offer ngay.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setShowOfferModal(true)}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-xs font-black text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                        >
                          <Sparkles className="size-3.5" />
                          Phát Hành Thư Mời Nhận Việc (Offer) Ngay
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="font-black text-slate-950">Các vòng phỏng vấn</h3>
                  {process.rounds.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500">
                      Hãy thêm vòng đầu tiên.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {process.rounds.map((round, index) => (
                        <RoundRow
                          key={round.id}
                          round={round}
                          draft={process.status === 'DRAFT'}
                          first={index === 0}
                          last={index === process.rounds.length - 1}
                          saving={saving}
                          token={token}
                          onMove={(direction) => void moveRound(index, direction)}
                          onRemove={() => void removeRound(round.id)}
                          onReviewAiSession={setReviewingAiSession}
                        />
                      ))}
                    </div>
                  )}
                  {process.status === 'DRAFT' && process.rounds.length > 0 && (
                    <button
                      type="button"
                      onClick={activateProcess}
                      disabled={saving}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Kích hoạt kế hoạch
                    </button>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {reviewingAiSession && (
        <AiInterviewReviewModal
          isOpen={!!reviewingAiSession}
          session={reviewingAiSession}
          token={token}
          candidateName={candidateName}
          jobTitle={jobTitle}
          roundTitle={reviewingRound?.title}
          nextRoundTitle={reviewingNextRound?.title}
          isFinalRound={!reviewingNextRound}
          canDecide={!reviewingRound || reviewingRound.status === 'AWAITING_REVIEW'}
          onRequestRetry={
            reviewingRound?.status === 'AWAITING_REVIEW'
              ? async () => {
                  const succeeded = await retry(reviewingRound.id);
                  if (succeeded) setReviewingAiSession(null);
                  return succeeded;
                }
              : undefined
          }
          onClose={() => setReviewingAiSession(null)}
          onEvaluated={() => {
            setReviewingAiSession(null);
            void loadProcess();
            onCreated?.();
          }}
        />
      )}

      <InterviewDecisionDialog
        open={!!pendingDecision}
        action={pendingDecision}
        roundTitle={currentRound?.title || 'vòng hiện tại'}
        nextRoundTitle={nextRound?.title}
        isFinalRound={!nextRound}
        submitting={saving}
        onClose={() => setPendingDecision(null)}
        onConfirm={confirmDecision}
      />

      <CreateOrEditOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        token={token}
        applicationId={applicationId}
        candidateName={candidateName}
        jobTitle={jobTitle}
        onSuccess={async () => {
          onCreated?.();
          setShowOfferModal(false);
          setOpen(false);
        }}
      />
    </>
  );
}

function RoundActionPanel({
  round,
  scheduledAt,
  setScheduledAt,
  locationOrLink,
  setLocationOrLink,
  score,
  setScore,
  note,
  setNote,
  saving,
  onStart,
  onSubmitFeedback,
  nextRoundTitle,
  onDecide,
  onRetry,
  onReviewAiSession,
  onSyncAiSession,
}: {
  round: InterviewRoundData;
  scheduledAt: string;
  setScheduledAt: (value: string) => void;
  locationOrLink: string;
  setLocationOrLink: (value: string) => void;
  score: number;
  setScore: (value: number) => void;
  note: string;
  setNote: (value: string) => void;
  saving: boolean;
  onStart: () => void;
  onSubmitFeedback: () => void;
  nextRoundTitle?: string;
  onDecide: (decision: 'PASSED' | 'FAILED') => void;
  onRetry: () => void;
  onReviewAiSession?: (session: AiInterviewSession) => void;
  onSyncAiSession?: (sessionId: string) => void;
}) {
  const latestInterview = round.interviews[0];
  const canRetry = ['FAILED', 'EXPIRED', 'NO_SHOW'].includes(round.status);
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-xs font-black text-blue-800">Vòng hiện tại</p>
      <h4 className="mt-1 text-base font-black text-slate-950">{round.title}</h4>
      <p className="mt-1 text-sm text-slate-600">{statusLabels[round.status]}</p>

      {round.conductedBy === 'AI' && round.aiInterviewSessions?.[0] && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3 shadow-xs">
          <p className="text-xs font-black text-slate-900">Video & Câu trả lời của ứng viên</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {round.aiInterviewSessions[0].videos?.length || 0} video câu trả lời lưu trên Supabase.
          </p>
          <button
            type="button"
            onClick={() => onReviewAiSession?.(round.aiInterviewSessions[0])}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Video className="h-4 w-4" /> Xem video & Đánh giá từng câu hỏi
          </button>
        </div>
      )}

      {round.status === 'READY' && round.conductedBy === 'HUMAN' && (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Thời gian
            <input
              type="datetime-local"
              value={scheduledAt || round.scheduledAt?.slice(0, 16) || ''}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            {round.mode === 'IN_PERSON' ? 'Địa điểm' : 'Meeting link'}
            <input
              value={locationOrLink || round.locationOrLink || ''}
              onChange={(event) => setLocationOrLink(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
            />
          </label>
        </div>
      )}

      {round.status === 'READY' && (
        <button
          type="button"
          onClick={onStart}
          disabled={saving}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {round.conductedBy === 'AI' ? (
            <Bot className="h-4 w-4" />
          ) : (
            <CalendarClock className="h-4 w-4" />
          )}
          {round.conductedBy === 'AI' ? 'Tạo link AI' : 'Lên lịch vòng này'}
        </button>
      )}

      {round.status === 'SCHEDULED' && round.conductedBy === 'HUMAN' && latestInterview && (
        <div className="mt-4 space-y-3 border-t border-blue-200 pt-4">
          <p className="text-xs font-bold text-slate-700">
            Nộp feedback sau khi buổi phỏng vấn kết thúc
          </p>
          <ScoreFields score={score} setScore={setScore} note={note} setNote={setNote} />
          <button
            type="button"
            onClick={onSubmitFeedback}
            disabled={saving}
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
          >
            Lưu feedback
          </button>
        </div>
      )}

      {round.status === 'SCHEDULED' && round.conductedBy === 'AI' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white p-3.5 shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-800">
              Đã gửi lời mời phỏng vấn AI
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Hệ thống đang chờ ứng viên hoàn thành hoặc phản hồi từ AI.
            </p>
          </div>
          {round.aiInterviewSessions?.[0]?.id && (
            <button
              type="button"
              onClick={() => onSyncAiSession?.(round.aiInterviewSessions[0].id)}
              disabled={saving}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-[#EFF6FF] px-3 py-1.5 text-xs font-bold text-[#2563EB] shadow-xs hover:bg-blue-100 active:scale-95 disabled:opacity-60 cursor-pointer transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${saving ? 'animate-spin text-[#2563EB]' : ''}`} />
              {saving ? 'Đang kiểm tra...' : 'Đồng bộ kết quả'}
            </button>
          )}
        </div>
      )}

      {round.status === 'AWAITING_REVIEW' && (
        <div className="mt-4 space-y-3 border-t border-blue-200 pt-4">
          <ScoreFields score={score} setScore={setScore} note={note} setNote={setNote} />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={onRetry}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm font-black text-amber-800 transition hover:bg-amber-50 active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" /> Làm lại
            </button>
            <button
              type="button"
              onClick={() => onDecide('FAILED')}
              disabled={saving}
              className="rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-sm font-black text-rose-700 transition hover:bg-rose-50 active:scale-[0.98] disabled:opacity-60"
            >
              Từ chối
            </button>
            <button
              type="button"
              onClick={() => onDecide('PASSED')}
              disabled={saving}
              className="rounded-xl bg-blue-700 px-3 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 active:scale-[0.98] disabled:opacity-60"
            >
              {nextRoundTitle ? 'Qua vòng' : 'Hoàn tất'}
            </button>
          </div>
        </div>
      )}

      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={saving}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-black text-blue-800 hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" /> Thực hiện lại vòng
        </button>
      )}
    </div>
  );
}

function ScoreFields({
  score,
  setScore,
  note,
  setNote,
}: {
  score: number;
  setScore: (value: number) => void;
  note: string;
  setNote: (value: string) => void;
}) {
  return (
    <>
      <label className="block text-xs font-bold text-slate-700">
        Điểm đánh giá
        <input
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
        />
      </label>
      <label className="block text-xs font-bold text-slate-700">
        Nhận xét
        <textarea
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
        />
      </label>
    </>
  );
}

function RoundRow({
  round,
  draft,
  first,
  last,
  saving,
  token,
  onMove,
  onRemove,
  onReviewAiSession,
}: {
  round: InterviewRoundData;
  draft: boolean;
  first: boolean;
  last: boolean;
  saving: boolean;
  token: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onReviewAiSession?: (session: AiInterviewSession) => void;
}) {
  const latestAi = round.aiInterviewSessions[0];
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-800">
          {round.order}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="font-black text-slate-950">{round.title}</h4>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  {round.conductedBy === 'AI' ? (
                    <Bot className="h-3.5 w-3.5" />
                  ) : (
                    <UserRound className="h-3.5 w-3.5" />
                  )}
                  {round.conductedBy === 'AI'
                    ? 'AI'
                    : round.mode === 'IN_PERSON'
                      ? 'Trực tiếp'
                      : 'Online'}
                </span>
                <span>{purposeLabels[round.purpose]}</span>
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusStyles[round.status]}`}
            >
              {statusLabels[round.status]}
            </span>
          </div>
          {round.description && <p className="mt-2 text-xs text-slate-600">{round.description}</p>}
          {round.conductedBy === 'HUMAN' && (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> {formatDate(round.scheduledAt)}
              {round.locationOrLink ? ` · ${round.locationOrLink}` : ''}
            </p>
          )}
        </div>
        {draft && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              aria-label="Di chuyển lên"
              onClick={() => onMove(-1)}
              disabled={first || saving}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Di chuyển xuống"
              onClick={() => onMove(1)}
              disabled={last || saving}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Xóa vòng"
              onClick={onRemove}
              disabled={saving}
              className="rounded-lg border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {latestAi && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-500">
            {latestAi.status === 'COMPLETED' ? 'Đã nộp bài phỏng vấn AI' : 'Phiên phỏng vấn AI'}
          </span>
          <button
            type="button"
            onClick={() => onReviewAiSession?.(latestAi)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Video className="h-3.5 w-3.5 text-blue-600" /> Xem video & Đánh giá từng câu
          </button>
        </div>
      )}

      {latestAi?.transcript?.length ? (
        <details className="mt-3 border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-xs font-black text-blue-800">
            Xem nhanh transcript và video
          </summary>
          <div className="mt-3 space-y-2">
            {latestAi.transcript.map((turn) => (
              <div key={turn.question.number} className="rounded-lg bg-slate-50 p-3 text-xs">
                <p className="font-black text-slate-800">
                  Câu {turn.question.number}: {turn.question.text}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-600">
                  {turn.transcript || 'Không nhận diện được câu trả lời.'}
                </p>
              </div>
            ))}
            {!!latestAi.videos?.length && (
              <div className="flex flex-wrap gap-2 pt-1">
                {latestAi.videos.map((videoItem) => (
                  <button
                    key={videoItem.id}
                    type="button"
                    onClick={() => void downloadAiInterviewVideo(token, latestAi.id, videoItem.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-800"
                  >
                    <Video className="h-3.5 w-3.5" /> Câu {videoItem.question_number}
                    <Download className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </details>
      ) : null}
    </article>
  );
}
