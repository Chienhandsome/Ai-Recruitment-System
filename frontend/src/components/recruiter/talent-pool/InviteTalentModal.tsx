'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  getInvitationJobs,
  sendTalentInvitation,
  type InvitationJob,
} from '@/lib/talent-invitation-api';

export function InviteTalentModal({
  token,
  candidate,
  onClose,
}: {
  token: string;
  candidate: { id: string; displayName: string };
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [jobs, setJobs] = useState<InvitationJob[]>([]);
  const [jobId, setJobId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
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
    getInvitationJobs(token, candidate.id)
      .then(({ data }) => {
        if (cancelled) return;
        setJobs(data);
        setJobId(data[0]?.id || '');
        setError(null);
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
  }, [token, candidate.id, attempt]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!jobId || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await sendTalentInvitation(token, {
        candidateId: candidate.id,
        jobId,
        message: message.trim() || undefined,
      });
      if (result.alreadyApplied && result.applicationId) {
        setApplicationId(result.applicationId);
        return;
      }
      toast.success('Đã gửi lời mời. Ứng viên có 7 ngày để phản hồi.');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi được lời mời.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="invite-talent-title"
      onCancel={(event) => {
        if (submitting.current) event.preventDefault();
        else onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-700 shadow-xl backdrop:bg-slate-900/40"
    >
      <form onSubmit={send} className="p-5 sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id="invite-talent-title" className="text-base font-extrabold text-slate-900">
              Mời ứng tuyển
            </h2>
            <p className="mt-1 text-xs leading-6 text-slate-500">
              Gửi lời mời tới <strong>{candidate.displayName}</strong>
            </p>
          </div>
          <button
            type="button"
            autoFocus
            disabled={saving}
            onClick={onClose}
            aria-label="Đóng lời mời"
            className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </header>
        {loading ? (
          <p role="status" className="my-6 flex items-center gap-2 text-xs">
            <Loader2 className="size-4 animate-spin" />
            Đang tải tin tuyển dụng...
          </p>
        ) : applicationId ? (
          <div className="my-5 rounded-xl bg-blue-50 p-4 text-sm leading-6">
            Ứng viên đã có hồ sơ cho tin này.
            <Link
              href={`/recruiter/dashboard?applicationId=${encodeURIComponent(applicationId)}`}
              className="mt-2 block font-bold text-blue-700 underline"
            >
              Mở hồ sơ ứng tuyển
            </Link>
          </div>
        ) : (
          <>
            {jobs.length ? (
              <>
                <label className="mt-5 block text-xs font-bold">
                  Tin tuyển dụng
                  <select
                    value={jobId}
                    onChange={(event) => setJobId(event.target.value)}
                    disabled={saving}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-normal focus:outline-blue-600"
                  >
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.jobCode} · {job.title}
                        {job.existingApplicationId ? ' · Đã ứng tuyển' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-xs font-bold">
                  Lời nhắn <span className="font-normal text-slate-500">(không bắt buộc)</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={2000}
                    disabled={saving}
                    rows={4}
                    placeholder="Giới thiệu ngắn về vị trí và lý do bạn muốn kết nối..."
                    className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm font-normal focus:outline-blue-600"
                  />
                </label>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Lời mời có hiệu lực 7 ngày, không trừ thêm lượt. Hồ sơ ứng tuyển chỉ được tạo khi
                  ứng viên chọn CV và xác nhận.
                </p>
              </>
            ) : (
              !error && (
                <p className="my-5 rounded-xl bg-slate-50 p-4 text-sm leading-6">
                  Bạn chưa có tin đang nhận hồ sơ.{' '}
                  <Link href="/recruiter/jobs" className="font-bold text-blue-700 underline">
                    Quản lý bài đăng
                  </Link>
                </p>
              )
            )}
          </>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700"
          >
            {error}
            {!jobs.length && (
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
        <footer className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/recruiter/talent-invitations"
            className="mr-auto self-center text-xs font-semibold text-blue-700 hover:underline"
          >
            Lời mời đã gửi
          </Link>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold disabled:opacity-50"
          >
            Đóng
          </button>
          {!applicationId && (
            <button
              type="submit"
              disabled={loading || saving || !jobId}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {saving
                ? 'Đang xử lý...'
                : jobs.find((job) => job.id === jobId)?.existingApplicationId
                  ? 'Mở hồ sơ đã ứng tuyển'
                  : 'Gửi lời mời'}
            </button>
          )}
        </footer>
      </form>
    </dialog>
  );
}
