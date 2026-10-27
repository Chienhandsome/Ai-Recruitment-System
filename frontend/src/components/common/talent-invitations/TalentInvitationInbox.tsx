'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  RotateCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  acceptTalentInvitation,
  getInvitationResumes,
  invitationStatusLabels,
  listTalentInvitations,
  respondTalentInvitation,
  type InvitationPage,
  type InvitationResume,
  type TalentInvitation,
} from '@/lib/talent-invitation-api';

function salary(job: TalentInvitation['job']) {
  if (job.minSalary == null && job.maxSalary == null) return 'Lương thỏa thuận';
  const format = (value: string | number) => Number(value).toLocaleString('vi-VN');
  return `${job.minSalary != null ? format(job.minSalary) : 'Đến'}${job.minSalary != null && job.maxSalary != null ? ' – ' : ' '}${job.maxSalary != null ? format(job.maxSalary) : ' trở lên'} ${job.currency}`;
}
const when = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
const statusStyle = {
  PENDING: 'bg-amber-50 text-amber-800',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  DECLINED: 'bg-slate-100 text-slate-600',
  EXPIRED: 'bg-slate-100 text-slate-600',
  WITHDRAWN: 'bg-rose-50 text-rose-700',
};

function AcceptInvitationDialog({
  token,
  invitation,
  onClose,
  onAccepted,
}: {
  token: string;
  invitation: TalentInvitation;
  onClose: () => void;
  onAccepted: (applicationId: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const [resumes, setResumes] = useState<InvitationResume[]>([]);
  const [resumeId, setResumeId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    getInvitationResumes(token)
      .then(({ data }) => {
        if (!cancelled) {
          setResumes(data);
          setResumeId(data[0]?.id || '');
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resumeId || !confirmed || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await acceptTalentInvitation(token, invitation.id, resumeId);
      toast.success(result.message || 'Đã xác nhận ứng tuyển.');
      onAccepted(result.applicationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể xác nhận ứng tuyển.');
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby="accept-invitation-title"
      onCancel={(event) => {
        if (inFlight.current) event.preventDefault();
        else onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-700 shadow-xl backdrop:bg-slate-900/40"
    >
      <form onSubmit={submit} className="p-5 sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id="accept-invitation-title" className="text-base font-extrabold text-slate-900">
              Xác nhận ứng tuyển
            </h2>
            <p className="mt-2 text-sm font-semibold text-blue-700">{invitation.job.title}</p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng xác nhận ứng tuyển"
            className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </header>
        {loading ? (
          <p role="status" className="my-6 flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Đang tải CV của bạn...
          </p>
        ) : resumes.length ? (
          <>
            <label className="mt-5 block text-xs font-bold">
              CV dùng để ứng tuyển
              <select
                value={resumeId}
                onChange={(event) => setResumeId(event.target.value)}
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-normal focus:outline-blue-600"
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.originalFileName}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Chỉ hiển thị CV đã xử lý xong. Bạn có thể cập nhật CV trong trang Hồ sơ trước khi ứng
              tuyển.
            </p>
            <label className="mt-5 flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={saving}
                className="mt-1 size-4 shrink-0 accent-blue-600"
              />
              Tôi xác nhận sử dụng CV đã chọn để ứng tuyển và chia sẻ hồ sơ với HR của tin này.
            </label>
          </>
        ) : (
          !error && (
            <p className="my-5 rounded-xl bg-amber-50 p-4 text-sm leading-6">
              Bạn chưa có CV xử lý xong.{' '}
              <Link href="/candidate/profile" className="font-bold text-blue-700 underline">
                Tải CV trong Hồ sơ
              </Link>{' '}
              rồi quay lại lời mời.
            </p>
          )
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700"
          >
            {error}
            {!resumes.length && (
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setAttempt((v) => v + 1);
                }}
                className="ml-2 font-bold underline"
              >
                Thử lại
              </button>
            )}
          </p>
        )}
        <footer className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold disabled:opacity-50"
          >
            Để sau
          </button>
          <button
            type="submit"
            disabled={loading || saving || !resumeId || !confirmed}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Xác nhận ứng tuyển
          </button>
        </footer>
      </form>
    </dialog>
  );
}

export function TalentInvitationInbox({
  token,
  role,
  invitationId,
}: {
  token: string;
  role: 'candidate' | 'recruiter';
  invitationId?: string;
}) {
  const [result, setResult] = useState<InvitationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<TalentInvitation | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const action = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    listTalentInvitations(token, role, page, invitationId)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, role, page, revision, invitationId]);
  const refresh = () => {
    setLoading(true);
    setConfirmAction(null);
    setRevision((value) => value + 1);
  };
  const finish = async (invitation: TalentInvitation) => {
    if (action.current) return;
    action.current = true;
    setBusy(invitation.id);
    setError(null);
    try {
      await respondTalentInvitation(token, role, invitation.id);
      toast.success(role === 'candidate' ? 'Đã từ chối lời mời.' : 'Đã thu hồi lời mời.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không xử lý được lời mời.');
    } finally {
      action.current = false;
      setBusy(null);
      refresh();
    }
  };
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Mail className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">
              {role === 'candidate' ? 'Lời mời ứng tuyển' : 'Lời mời đã gửi'}
            </h1>
            <p className="mt-1 max-w-xl text-xs leading-6 text-slate-500">
              {role === 'candidate'
                ? 'Khám phá lời mời từ HR. Chọn CV và xác nhận khi tìm thấy vị trí phù hợp.'
                : 'Theo dõi phản hồi của ứng viên và mở hồ sơ khi họ xác nhận ứng tuyển.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading || !!busy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RotateCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </header>
      {invitationId && (
        <Link
          href={role === 'candidate' ? '/candidate/invitations' : '/recruiter/talent-invitations'}
          className="inline-flex text-xs font-bold text-blue-700 hover:underline"
        >
          Xem tất cả lời mời
        </Link>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
          <button type="button" onClick={refresh} className="ml-3 font-bold underline">
            Thử lại
          </button>
        </div>
      )}
      {loading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500"
        >
          <Loader2 className="size-5 animate-spin" />
          Đang tải lời mời...
        </div>
      ) : !error && !result?.data.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <Mail className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-4 text-sm font-bold text-slate-800">
            {invitationId ? 'Không tìm thấy lời mời' : 'Chưa có lời mời'}
          </h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            {role === 'candidate'
              ? 'Lời mời từ HR sẽ xuất hiện tại đây. Bạn vẫn có thể chủ động tìm việc và ứng tuyển.'
              : 'Mở hồ sơ ứng viên trong Talent Pool để gửi lời mời cho tin tuyển dụng của bạn.'}
          </p>
          <Link
            href={role === 'candidate' ? '/candidate' : '/recruiter/talent-pool'}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            {role === 'candidate' ? 'Khám phá việc làm' : 'Đến kho ứng viên'}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        !error && (
          <div className="space-y-4">
            {result?.data.map((invitation) => {
              const applicationId = invitation.applicationId || invitation.existingApplicationId;
              const status =
                invitation.status === 'PENDING' && new Date(invitation.expiresAt).getTime() <= now
                  ? 'EXPIRED'
                  : invitation.status;
              const jobOpen =
                invitation.job.status === 'PUBLISHED' &&
                (!invitation.job.expiryDate || new Date(invitation.job.expiryDate).getTime() > now);
              return (
                <article
                  key={invitation.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {role === 'candidate'
                          ? `HR gửi lời mời: ${invitation.recruiterUser.fullName}`
                          : `Ứng viên: ${invitation.candidate.fullName}`}
                      </p>
                      <h2 className="mt-1 text-base font-extrabold text-slate-900">
                        {invitation.job.title}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-blue-700">
                        {salary(invitation.job)}
                      </p>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${statusStyle[status]}`}
                    >
                      {invitationStatusLabels[status]}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    {invitation.job.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {invitation.job.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Hạn phản hồi: {when(invitation.expiresAt)}
                    </span>
                    <span>Gửi lúc: {when(invitation.createdAt)}</span>
                  </div>
                  {invitation.message && (
                    <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-blue-50/60 p-4 text-sm leading-6 text-slate-600">
                      {invitation.message}
                    </p>
                  )}
                  <details className="mt-4 rounded-xl border border-slate-100 p-3 text-xs">
                    <summary className="cursor-pointer font-bold text-slate-700">
                      Xem mô tả và yêu cầu công việc
                    </summary>
                    <div className="mt-3 space-y-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      <p>{invitation.job.description}</p>
                      {invitation.job.requirements && <p>{invitation.job.requirements}</p>}
                    </div>
                  </details>
                  <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    {applicationId ? (
                      <>
                        <p className="text-xs text-slate-500">
                          Đã có hồ sơ ứng tuyển. CV và thông tin đã gửi được giữ nguyên.
                        </p>
                        <Link
                          href={
                            role === 'candidate'
                              ? `/candidate/applications?applicationId=${encodeURIComponent(applicationId)}`
                              : `/recruiter/dashboard?applicationId=${encodeURIComponent(applicationId)}`
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"
                        >
                          <FileText className="size-4" />
                          Mở hồ sơ ứng tuyển
                        </Link>
                      </>
                    ) : status === 'PENDING' ? (
                      <>
                        <div className="text-xs text-slate-500">
                          {role === 'candidate'
                            ? jobOpen
                              ? 'Bạn chủ động quyết định có ứng tuyển hay không.'
                              : 'Tin tuyển dụng hiện không còn nhận hồ sơ.'
                            : 'Đang chờ ứng viên xác nhận.'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {confirmAction === invitation.id ? (
                            <>
                              <span className="text-xs text-slate-600">
                                {role === 'candidate' ? 'Xác nhận từ chối?' : 'Xác nhận thu hồi?'}
                              </span>
                              <button
                                type="button"
                                onClick={() => void finish(invitation)}
                                disabled={!!busy}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"
                              >
                                {busy === invitation.id ? 'Đang xử lý...' : 'Xác nhận'}
                              </button>
                              <button
                                type="button"
                                disabled={!!busy}
                                onClick={() => setConfirmAction(null)}
                                className="px-3 py-2 text-xs font-semibold text-slate-600"
                              >
                                Hủy
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmAction(invitation.id)}
                              disabled={!!busy}
                              className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {role === 'candidate' ? 'Từ chối' : 'Thu hồi'}
                            </button>
                          )}
                          {role === 'candidate' && (
                            <button
                              type="button"
                              disabled={!jobOpen || !!busy}
                              onClick={() => setSelected(invitation)}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="size-4" />
                              Chọn CV để ứng tuyển
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Lời mời đã đóng, không còn nhận phản hồi.
                      </span>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )
      )}
      {!loading && !error && result && result.meta.totalPages > 1 && (
        <nav
          aria-label="Phân trang lời mời"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600"
        >
          <span>
            Trang {page} / {result.meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Trang lời mời trước"
              disabled={page <= 1 || !!busy}
              onClick={() => {
                setLoading(true);
                setPage((v) => v - 1);
              }}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Trang lời mời sau"
              disabled={page >= result.meta.totalPages || !!busy}
              onClick={() => {
                setLoading(true);
                setPage((v) => v + 1);
              }}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </nav>
      )}
      {selected && (
        <AcceptInvitationDialog
          token={token}
          invitation={selected}
          onClose={() => {
            setSelected(null);
            refresh();
          }}
          onAccepted={(applicationId) => {
            setResult((prev) =>
              prev
                ? {
                    ...prev,
                    data: prev.data.map((item) =>
                      item.id === selected.id
                        ? { ...item, status: 'ACCEPTED', applicationId }
                        : item,
                    ),
                  }
                : prev,
            );
            setSelected(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
