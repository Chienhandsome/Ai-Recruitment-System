'use client';

import { ArrowLeft, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, FileText, Loader2, RefreshCw, ShieldAlert, Video, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AiInterviewSession, AiInterviewTurn } from '@/lib/interview-api';
import type { InterviewDecisionAction } from './InterviewDecisionDialog';
import type { InterviewReviewDraft } from './interview-review-state';

interface Props {
  candidateName: string;
  jobTitle: string;
  roundTitle: string;
  session: AiInterviewSession;
  turns: AiInterviewTurn[];
  activeIdx: number;
  draft: InterviewReviewDraft;
  overallScore: number | null;
  saved: boolean;
  ready: boolean;
  canDecide: boolean;
  submitting: boolean;
  summary: boolean;
  transcriptExpanded: boolean;
  player: ReactNode;
  onClose: () => void;
  onSelect: (index: number) => void;
  onSummary: (value: boolean) => void;
  onToggleTranscript: () => void;
  onCopy: () => void;
  onScore: (score: number) => void;
  onComment: (comment: string) => void;
  onOverallScore: (value: number | null) => void;
  onOverallNote: (value: string) => void;
  onDecision: (action: InterviewDecisionAction) => void;
  canRetry: boolean;
  isFinalRound: boolean;
}

const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40';
const secondary = `${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const primary = `${button} bg-blue-600 text-white hover:bg-blue-700`;

export function AiInterviewReviewWorkspace(props: Props) {
  const { candidateName, jobTitle, roundTitle, session, turns, activeIdx, draft, overallScore, saved, ready,
    canDecide, submitting, summary, transcriptExpanded, player, onClose, onSelect, onSummary,
    onToggleTranscript, onCopy, onScore, onComment, onOverallScore, onOverallNote, onDecision, canRetry, isFinalRound } = props;
  const current = turns[activeIdx];
  const rating = current ? draft.ratings[current.question.number] : undefined;
  const rated = turns.filter(turn => draft.ratings[turn.question.number]?.score != null).length;
  const progress = turns.length ? Math.round(rated / turns.length * 100) : 0;
  const editable = canDecide && ready && !submitting;
  const scoreHint = rating?.score == null ? 'Chọn mức điểm phù hợp với câu trả lời.'
    : rating.score <= 4 ? 'Cần cải thiện: chưa đáp ứng trọng tâm hoặc thiếu kiến thức nền.'
    : rating.score <= 6 ? 'Cơ bản: hiểu vấn đề, cần thêm chi tiết và dẫn chứng.'
    : rating.score <= 8 ? 'Tốt: trả lời rõ ràng, đúng trọng tâm, có dẫn chứng.'
    : 'Xuất sắc: phân tích sâu, dẫn chứng thuyết phục và có góc nhìn riêng.';

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-slate-50 text-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 md:gap-5">
            <button type="button" onClick={onClose} disabled={submitting} aria-label="Quay lại hồ sơ ứng viên" className={`${secondary} shrink-0 px-3`}>
              <ArrowLeft className="size-4" /><span className="hidden sm:inline">Quay lại</span>
            </button>
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium text-slate-500">Đánh giá phỏng vấn <span className="mx-1 text-slate-300">/</span> {roundTitle}</p>
              <h1 id="interview-review-title" className="text-lg font-semibold tracking-tight md:text-xl">{candidateName}</h1>
              <p className="mt-1 text-sm text-slate-500">{jobTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{canDecide ? `${rated}/${turns.length} câu đã chấm` : 'Xem lại phỏng vấn'}</p>
              <p role="status" className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                {saved && canDecide && <Check className="size-3.5 text-emerald-600" />}
                {canDecide ? !ready ? 'Đang khôi phục bản nháp…' : saved ? 'Đã lưu nháp trên trình duyệt này' : 'Bản nháp chỉ giữ khi đang mở' : 'Vòng này không thể chỉnh sửa'}
              </p>
            </div>
            <div className="hidden size-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 sm:flex" aria-hidden="true">
              {candidateName.trim().split(/\s+/).slice(-2).map(word => word[0]).join('')}
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto" id="interview-review-scroll">
        <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-8 md:py-7">
          <nav aria-label="Các bước đánh giá" className="mb-6 flex items-center gap-1 border-b border-slate-200">
            <button type="button" onClick={() => onSummary(false)} aria-current={!summary ? 'step' : undefined}
              className={`border-b-2 px-3 pb-3 text-sm font-medium ${!summary ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              1. Xem câu trả lời
            </button>
            <button type="button" onClick={() => onSummary(true)} aria-current={summary ? 'step' : undefined}
              className={`border-b-2 px-3 pb-3 text-sm font-medium ${summary ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              2. Tổng kết & quyết định
            </button>
          </nav>

          {!summary && turns.length > 0 && (
            <nav aria-label="Danh sách câu hỏi" className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {turns.map((turn, index) => {
                const score = draft.ratings[turn.question.number]?.score;
                const viewed = draft.viewed.includes(turn.question.number);
                return (
                  <button key={turn.question.number} type="button" onClick={() => onSelect(index)} aria-current={index === activeIdx ? 'step' : undefined}
                    className={`min-w-36 shrink-0 rounded-lg border px-3.5 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${index === activeIdx ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                    <span className="flex items-center justify-between gap-4 text-sm font-semibold">
                      Câu {turn.question.number}{score != null ? <span className="text-blue-700">{score}/10</span> : <Video className="size-3.5 text-slate-400" />}
                    </span>
                    <span className="mt-1 block max-w-48 truncate text-xs text-slate-600">{turn.question.competency || 'Năng lực tổng quát'}</span>
                    <span className={`mt-2 flex items-center gap-1 text-xs ${score != null ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {score != null && <Check className="size-3" />}{score != null ? 'Đã chấm' : viewed ? canDecide ? 'Đã mở · Chưa chấm' : 'Đã mở' : 'Chưa xem'}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          {summary ? (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] lg:gap-8">
              <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-7" aria-labelledby="review-summary-heading">
                <p className="text-sm font-medium text-blue-700">Bước 2 / 2</p>
                <h2 id="review-summary-heading" className="mt-2 text-2xl font-semibold tracking-tight">Tổng kết buổi phỏng vấn</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Đối chiếu đánh giá từng câu trước khi đưa ra quyết định cho {candidateName}.</p>
                <div className="mt-6 divide-y divide-slate-100">
                  {turns.map((turn, index) => {
                    const evaluation = draft.ratings[turn.question.number];
                    return (
                      <button key={turn.question.number} onClick={() => onSelect(index)} type="button" className="flex w-full items-start gap-3 py-4 text-left hover:bg-slate-50">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-medium">{turn.question.number}</span>
                        <span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-6">{turn.question.text}</span>
                          <span className="mt-1 block text-xs text-slate-500">{turn.question.competency}</span>
                          {evaluation?.comment && <span className="mt-2 block whitespace-pre-wrap text-sm leading-6 text-slate-600">{evaluation.comment}</span>}
                        </span>
                        <span className={`shrink-0 text-sm font-medium ${evaluation?.score != null ? 'text-blue-700' : 'text-slate-400'}`}>{!canDecide ? 'Xem lại' : evaluation?.score != null ? `${evaluation.score}/10` : 'Chưa chấm'}</span>
                        <ChevronRight className="mt-1 size-4 shrink-0 text-slate-400" />
                      </button>
                    );
                  })}
                  {!turns.length && <p className="py-6 text-sm text-slate-500">Phiên phỏng vấn chưa có câu trả lời để đánh giá.</p>}
                </div>
              </section>
              <aside className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 lg:sticky lg:top-6" aria-labelledby="review-decision-heading">
                <h2 id="review-decision-heading" className="text-lg font-semibold">Đánh giá tổng quát</h2>
                {!canDecide ? (
                  <div className="mt-4 space-y-4">
                    {session.round?.resultScore != null && <p className="text-sm text-slate-600">Điểm đã lưu: <strong className="text-xl text-slate-900">{session.round.resultScore}/100</strong></p>}
                    <p className="text-sm leading-6 text-slate-600">Vòng này đã khóa đánh giá. Quay lại hồ sơ ứng viên để xem nhận xét đã lưu.</p>
                    <button type="button" className={secondary} onClick={onClose}>Về hồ sơ ứng viên<ChevronRight className="size-4" /></button>
                  </div>
                ) : (
                  <>
                    {rated < turns.length && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">Còn {turns.length - rated} câu chưa chấm. Bạn có thể quay lại bổ sung trước khi quyết định.</p>}
                    <label htmlFor="review-overall-score" className="mt-6 block text-sm font-medium">Điểm tổng kết</label>
                    <div className="mt-2 flex items-center gap-3">
                      <input id="review-overall-score" type="number" min={0} max={100} step={1} placeholder="—" value={overallScore ?? ''} disabled={!editable}
                        onChange={e => onOverallScore(e.target.value === '' ? null : Number(e.target.value))}
                        className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-xl font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
                      <span className="text-sm text-slate-500">/ 100 điểm</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{overallScore === null ? 'Chưa đánh giá. Chấm từng câu hoặc nhập điểm tổng kết.' : draft.overallScore === null ? `Trung bình của ${rated} câu đã chấm. Bạn có thể điều chỉnh.` : 'Điểm tổng kết do bạn nhập.'}</p>
                    <label htmlFor="review-overall-note" className="mt-6 block text-sm font-medium">Nhận xét tổng quát <span className="text-rose-600">*</span></label>
                    <textarea id="review-overall-note" rows={5} value={draft.overallNote} required disabled={!editable} onChange={e => onOverallNote(e.target.value)}
                      placeholder="Điểm mạnh, điểm cần cải thiện và lý do cho quyết định của bạn…"
                      className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                      {canRetry && <button className={secondary} type="button" disabled={!editable} onClick={() => onDecision('RETRY')}><RefreshCw className="size-4" />Yêu cầu làm lại</button>}
                      <button className={`${secondary} text-rose-700`} type="button" disabled={!editable || overallScore === null || !draft.overallNote.trim()} onClick={() => onDecision('REJECT')}><XCircle className="size-4" />Không đạt</button>
                      <button className={primary} type="button" disabled={!editable || overallScore === null || !draft.overallNote.trim()} onClick={() => onDecision('PASS')}>
                        {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{isFinalRound ? 'Hoàn tất phỏng vấn' : 'Cho qua vòng'}
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">Quyết định chỉ được gửi sau bước xác nhận.</p>
                  </>
                )}
              </aside>
            </div>
          ) : current ? (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)] lg:gap-8">
              <section className="min-w-0 space-y-5" aria-label="Câu hỏi và câu trả lời">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm"><span className="font-medium text-blue-700">Câu {current.question.number} / {turns.length}</span><span className="text-slate-300">·</span><span className="text-slate-500">{current.question.competency}</span></div>
                  <h2 className="text-lg font-semibold leading-8 tracking-tight md:text-xl">{current.question.text}</h2>
                </div>
                {player}
                <section className="rounded-xl border border-slate-200 bg-white" aria-labelledby="review-transcript-heading">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                    <h3 id="review-transcript-heading" className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-slate-500" />Bản chép lời</h3>
                    <div className="flex items-center gap-4">
                      <button type="button" disabled={!current.transcript} onClick={onCopy} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700 disabled:opacity-40"><Copy className="size-3.5" />Sao chép</button>
                      <button type="button" aria-expanded={transcriptExpanded} aria-controls="review-transcript" onClick={onToggleTranscript} className="text-sm font-medium text-blue-700">{transcriptExpanded ? 'Thu gọn' : 'Mở rộng'}</button>
                    </div>
                  </div>
                  <div id="review-transcript" hidden={!transcriptExpanded} className="border-t border-slate-100 px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 md:text-base">{current.transcript || 'Chưa có bản chép lời cho câu trả lời này.'}</p>
                    {current.answered_at && <p className="mt-4 text-xs text-slate-400">Trả lời lúc {new Date(current.answered_at).toLocaleString('vi-VN')}</p>}
                  </div>
                </section>
                {!!session.securityEvents?.length && (
                  <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <h3 className="flex items-center gap-2 font-medium"><ShieldAlert className="size-4" />Sự kiện trong buổi phỏng vấn</h3>
                    <ul className="mt-2 space-y-1">{session.securityEvents.map((event, index) => <li key={index}>{event.type} · {new Date(event.happened_at).toLocaleString('vi-VN')}</li>)}</ul>
                  </section>
                )}
              </section>
              <aside className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 lg:sticky lg:top-6" aria-labelledby="review-rating-heading">
                <div className="flex items-center justify-between gap-3"><h2 id="review-rating-heading" className="text-lg font-semibold">{canDecide ? 'Đánh giá' : 'Xem lại'} câu {current.question.number}</h2><span className="text-sm font-medium text-blue-700">{!canDecide ? 'Chỉ xem' : rating?.score != null ? `${rating.score}/10` : 'Chưa chấm'}</span></div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{canDecide ? 'Đánh giá dựa trên nội dung và dẫn chứng trong câu trả lời.' : 'Vòng này không thể chỉnh sửa đánh giá.'}</p>
                {canDecide ? <><fieldset disabled={!editable} className="mt-6">
                  <legend className="text-sm font-medium">Điểm câu trả lời</legend>
                  <div className="mt-3 grid grid-cols-5 gap-2">{Array.from({ length: 10 }, (_, index) => index + 1).map(score => (
                    <button key={score} type="button" aria-label={`${score} trên 10 điểm`} aria-pressed={rating?.score === score} onClick={() => onScore(score)}
                      className={`min-h-11 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${rating?.score === score ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50'}`}>{score}</button>
                  ))}</div>
                  <p className="mt-3 min-h-12 text-xs leading-5 text-slate-500" aria-live="polite">{scoreHint}</p>
                  <details className="mt-2 border-b border-slate-100 pb-5 text-xs leading-6 text-slate-500"><summary className="cursor-pointer font-medium text-slate-600">Hướng dẫn thang điểm</summary><p className="mt-2">1–4: Cần cải thiện<br />5–6: Cơ bản<br />7–8: Tốt<br />9–10: Xuất sắc</p><p className="mt-1">Đối chiếu với yêu cầu của vị trí và tiêu chí của vòng phỏng vấn.</p></details>
                  <label htmlFor="review-question-note" className="mt-5 block text-sm font-medium">Nhận xét cho câu này</label>
                  <textarea id="review-question-note" rows={5} value={rating?.comment ?? ''} onChange={e => onComment(e.target.value)} placeholder="Ghi lại dẫn chứng, điểm mạnh hoặc nội dung cần làm rõ…"
                    className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
                </fieldset>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm"><span className="text-slate-500">Tiến độ chấm</span><span className="font-medium">{rated}/{turns.length} câu</span></div>
                <div role="progressbar" aria-label="Tiến độ chấm điểm" aria-valuemin={0} aria-valuemax={turns.length || 1} aria-valuenow={rated} className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${progress}%` }} /></div>
                </> : <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                  {session.round?.resultScore != null && <p className="text-sm text-slate-600">Điểm vòng phỏng vấn: <strong className="text-slate-900">{session.round.resultScore}/100</strong></p>}
                  <p className="text-sm leading-6 text-slate-500">Bạn có thể xem lại từng video và đối chiếu bản chép lời. Nhận xét đã lưu nằm trong hồ sơ ứng viên.</p>
                  <button type="button" className={secondary} onClick={onClose}>Về hồ sơ ứng viên<ChevronRight className="size-4" /></button>
                </div>}
              </aside>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 text-center"><FileText className="size-8 text-slate-400" /><h2 className="text-lg font-semibold">Chưa có câu trả lời</h2><p className="max-w-md px-4 text-sm leading-6 text-slate-500">Phiên phỏng vấn chưa có transcript để hiển thị. Quay lại hồ sơ và tải lại khi dữ liệu đã sẵn sàng.</p></div>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <p className="hidden text-sm text-slate-500 sm:block">{summary ? 'Tổng kết đánh giá' : turns.length ? `Đang xem câu ${activeIdx + 1} trong ${turns.length}` : 'Chưa có câu trả lời'}</p>
          <div className="flex w-full justify-between gap-2 sm:w-auto sm:justify-end">
            <button type="button" className={secondary} disabled={submitting || (!summary && activeIdx === 0)} onClick={() => summary ? onSummary(false) : onSelect(activeIdx - 1)}><ChevronLeft className="size-4" />{summary ? 'Xem câu trả lời' : 'Câu trước'}</button>
            {!summary && (activeIdx < turns.length - 1
              ? <button type="button" className={primary} onClick={() => onSelect(activeIdx + 1)}>Câu tiếp<ChevronRight className="size-4" /></button>
              : <button type="button" className={primary} onClick={() => onSummary(true)}>Tổng kết<ChevronRight className="size-4" /></button>)}
          </div>
        </div>
      </footer>
    </div>
  );
}
