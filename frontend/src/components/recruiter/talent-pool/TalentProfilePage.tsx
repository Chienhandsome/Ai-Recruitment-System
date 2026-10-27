'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import {
  accessTalentResume,
  getMyEntitlement,
  getTalentProfile,
  unlockTalentProfile,
  type TalentPoolCard,
  type TalentResumeAccess,
} from '@/lib/billing-api';
import type { RecruiterProfileData } from '@/lib/recruiter-api';
import { RecruiterHeader } from '../RecruiterHeader';
import { RecruiterProfileModal } from '../RecruiterProfileModal';
import { TalentSkills } from './TalentCandidateCard';
import { InviteTalentModal } from './InviteTalentModal';

function webLink(value: string | null | undefined) {
  try {
    const url = new URL(value ?? '');
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function date(value: string | null | undefined) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <h2 className="mb-5 text-base font-extrabold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
function WebLink({ value, children }: { value: string | null | undefined; children: ReactNode }) {
  const href = webLink(value);
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 break-all text-sm font-semibold text-blue-700 hover:underline"
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" />
    </a>
  ) : null;
}
function Preview({ access, onClose }: { access: TalentResumeAccess; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(
      () => setExpired(true),
      Math.max(0, new Date(access.expiresAt).getTime() - Date.now()),
    );
    return () => {
      clearTimeout(timer);
      node?.close();
      document.body.style.overflow = previous;
    };
  }, [access]);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="resume-title"
      className="fixed inset-0 m-auto h-[90dvh] max-h-[90dvh] w-[96vw] max-w-5xl rounded-2xl border-0 bg-white p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 p-4">
          <h2 id="resume-title" className="truncate text-sm font-bold">
            {access.fileName}
          </h2>
          <button
            autoFocus
            onClick={onClose}
            aria-label="Đóng CV"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </header>
        {expired ? (
          <p role="status" className="p-6 text-sm text-slate-600">
            Phiên xem đã hết hạn. Đóng cửa sổ và bấm Xem CV để cấp lại quyền.
          </p>
        ) : (
          <>
            <p className="px-4 py-2 text-xs text-slate-500">
              Nếu trình duyệt không hiển thị PDF,{' '}
              <a
                href={access.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                mở PDF ở tab mới
              </a>{' '}
              hoặc đóng cửa sổ và chọn Tải CV gốc.
            </p>
            <iframe
              title="Nội dung CV gốc"
              src={access.url}
              referrerPolicy="no-referrer"
              className="min-h-0 flex-1 border-0"
            />
          </>
        )}
      </div>
    </dialog>
  );
}

export function TalentProfilePage({
  token,
  candidateId,
  initialProfile,
}: {
  token: string;
  candidateId: string;
  initialProfile: RecruiterProfileData | null;
}) {
  const [recruiter, setRecruiter] = useState(initialProfile);
  const [showProfile, setShowProfile] = useState(false);
  const [candidate, setCandidate] = useState<TalentPoolCard | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [invite, setInvite] = useState(false);
  const [preview, setPreview] = useState<TalentResumeAccess | null>(null);
  const acting = useRef(false);
  useEffect(() => {
    let cancelled = false;
    Promise.all([getTalentProfile(token, candidateId), getMyEntitlement(token, 'EMPLOYER')])
      .then(([data, entitlement]) => {
        if (!cancelled) {
          setCandidate(data);
          setRemaining(entitlement.cvUnlockRemaining);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setCandidate(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, candidateId, revision]);
  const reload = () => {
    setLoading(true);
    setPreview(null);
    setInvite(false);
    setActionError(null);
    setRevision((value) => value + 1);
  };
  const unlock = async () => {
    if (acting.current) return;
    acting.current = true;
    setBusy('unlock');
    setActionError(null);
    try {
      const data = await unlockTalentProfile(token, candidateId);
      setCandidate(data);
      setRemaining(null);
      const entitlement = await getMyEntitlement(token, 'EMPLOYER');
      setRemaining(entitlement.cvUnlockRemaining);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Không mở khóa được hồ sơ.');
    } finally {
      acting.current = false;
      setBusy(null);
    }
  };
  const openResume = async (mode: 'preview' | 'download') => {
    if (acting.current) return;
    acting.current = true;
    setBusy(mode);
    setActionError(null);
    setPreview(null);
    try {
      const access = await accessTalentResume(token, candidateId, mode);
      if (mode === 'preview') setPreview(access);
      else {
        const anchor = document.createElement('a');
        anchor.href = access.url;
        anchor.download = access.fileName;
        anchor.referrerPolicy = 'no-referrer';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Không truy cập được CV.');
    } finally {
      acting.current = false;
      setBusy(null);
    }
  };
  const button =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50';
  const resume = candidate?.resume;
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-700">
      <RecruiterHeader
        token={token}
        profile={recruiter}
        activeSection="talent-pool"
        onOpenProfile={() => setShowProfile(true)}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/recruiter/talent-pool"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft className="size-4" />
            Kho ứng viên
          </Link>
          <button
            onClick={reload}
            disabled={!!busy || loading}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>
        {loading ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8"
          >
            <Loader2 className="size-5 animate-spin text-blue-600" />
            Đang tải hồ sơ...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-8">
            <h1 className="text-xl font-bold text-slate-900">Không thể mở hồ sơ</h1>
            <p className="mt-3 text-sm">{error}</p>
            <p className="mt-2 text-sm text-slate-500">
              Hồ sơ có thể đã ngừng chia sẻ hoặc quyền truy cập của bạn đã thay đổi.
            </p>
            <Link
              href="/recruiter/billing"
              className="mt-4 inline-block text-sm font-bold text-blue-700"
            >
              Kiểm tra gói dịch vụ
            </Link>
          </div>
        ) : (
          candidate && (
            <>
              <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
                <p className="mb-3 inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  Đang tìm việc
                </p>
                <h1 className="break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {candidate.displayName}
                </h1>
                <p className="mt-2 break-words text-base text-slate-600">
                  {candidate.desiredTitle || 'Chưa bổ sung vị trí mong muốn'}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  {candidate.locationHint && <span>{candidate.locationHint}</span>}
                  {candidate.preferredModel && (
                    <span>
                      {(
                        { ONSITE: 'Tại văn phòng', REMOTE: 'Từ xa', HYBRID: 'Kết hợp' } as Record<
                          string,
                          string
                        >
                      )[candidate.preferredModel] ?? candidate.preferredModel}
                    </span>
                  )}
                  {(candidate.expectedMinSalary || candidate.expectedMaxSalary) && (
                    <span>
                      Mức lương mong muốn:{' '}
                      {candidate.expectedMinSalary
                        ? Number(candidate.expectedMinSalary).toLocaleString('vi-VN')
                        : 'Thỏa thuận'}{' '}
                      –{' '}
                      {candidate.expectedMaxSalary
                        ? Number(candidate.expectedMaxSalary).toLocaleString('vi-VN')
                        : 'Thỏa thuận'}{' '}
                      VND
                    </span>
                  )}
                </div>
              </header>
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-6">
                  <Section title="Giới thiệu">
                    <p className="whitespace-pre-wrap break-words text-sm leading-7">
                      {candidate.professionalSummary || 'Chưa bổ sung giới thiệu.'}
                    </p>
                  </Section>
                  {!!candidate.skills.length && (
                    <Section title="Kỹ năng chuyên môn">
                      <TalentSkills skills={candidate.skills} />
                    </Section>
                  )}
                  {!!candidate.workExperiences?.length && (
                    <Section title="Kinh nghiệm làm việc">
                      <div className="space-y-6">
                        {candidate.workExperiences.map((item, index) => (
                          <article
                            key={index}
                            className="break-words border-l-2 border-blue-100 pl-4"
                          >
                            <h3 className="font-bold text-slate-900">{item.positionTitle}</h3>
                            <p className="mt-1 text-sm">{item.companyName}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {date(item.startDate)} –{' '}
                              {item.isCurrent ? 'Hiện tại' : date(item.endDate)}
                            </p>
                            {item.description && (
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                                {item.description}
                              </p>
                            )}
                          </article>
                        ))}
                      </div>
                    </Section>
                  )}
                  {!!candidate.educations?.length && (
                    <Section title="Học vấn">
                      <div className="space-y-5">
                        {candidate.educations.map((item, index) => (
                          <article key={index} className="break-words">
                            <h3 className="font-bold text-slate-900">{item.schoolName}</h3>
                            <p className="mt-1 text-sm">
                              {[item.degree, item.major].filter(Boolean).join(' · ')}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {[date(item.startDate), date(item.endDate)]
                                .filter(Boolean)
                                .join(' – ')}
                            </p>
                          </article>
                        ))}
                      </div>
                    </Section>
                  )}
                  {!!candidate.projects?.length && (
                    <Section title="Dự án">
                      <div className="space-y-6">
                        {candidate.projects.map((item, index) => (
                          <article key={index} className="break-words">
                            <h3 className="font-bold text-slate-900">{item.projectName}</h3>
                            {item.projectRole && <p className="mt-1 text-sm">{item.projectRole}</p>}
                            <p className="mt-1 text-xs text-slate-500">
                              {[date(item.startDate), date(item.endDate)]
                                .filter(Boolean)
                                .join(' – ')}
                            </p>
                            {item.description && (
                              <p className="my-3 whitespace-pre-wrap text-sm leading-7">
                                {item.description}
                              </p>
                            )}
                            {Array.isArray(item.technologies) && (
                              <p className="mb-2 text-xs text-slate-500">
                                {item.technologies
                                  .filter((value): value is string => typeof value === 'string')
                                  .join(' · ')}
                              </p>
                            )}
                            <WebLink value={item.projectUrl}>Xem dự án</WebLink>
                          </article>
                        ))}
                      </div>
                    </Section>
                  )}
                  {!!candidate.certificates?.length && (
                    <Section title="Chứng chỉ">
                      <div className="space-y-5">
                        {candidate.certificates.map((item, index) => (
                          <article key={index} className="break-words">
                            <h3 className="font-bold text-slate-900">{item.certificateName}</h3>
                            <p className="my-1 text-sm">{item.issuingOrganization}</p>
                            <p className="mb-2 text-xs text-slate-500">
                              {date(item.issueDate)}
                              {item.expiryDate && ` · Hết hạn ${date(item.expiryDate)}`}
                            </p>
                            <WebLink value={item.credentialUrl}>Xem chứng chỉ</WebLink>
                          </article>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
                <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">
                  <Section title="Thông tin liên hệ">
                    {candidate.contactUnlocked && candidate.contact ? (
                      <div className="space-y-3 break-words text-sm">
                        <p>{candidate.contact.email}</p>
                        {candidate.contact.phone && <p>{candidate.contact.phone}</p>}
                        {candidate.contact.address && <p>{candidate.contact.address}</p>}
                        <div className="flex flex-col items-start gap-3">
                          <WebLink value={candidate.contact.linkedinUrl}>LinkedIn</WebLink>
                          <WebLink value={candidate.contact.githubUrl}>GitHub</WebLink>
                          <WebLink value={candidate.contact.portfolioUrl}>Portfolio</WebLink>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-4 text-sm leading-6">
                          Mở khóa để xem thông tin liên hệ và CV gốc. Xem lại không mất thêm lượt.
                        </p>
                        <button
                          onClick={() => void unlock()}
                          disabled={!!busy || remaining === null || remaining <= 0}
                          className={`${button} w-full bg-blue-600 text-white hover:bg-blue-700`}
                        >
                          <LockKeyhole className="size-4" />
                          {busy === 'unlock' ? 'Đang mở khóa...' : 'Mở khóa · 1 lượt'}
                        </button>
                        <p className="mt-3 text-xs text-slate-500">
                          {remaining === null
                            ? 'Chưa xác định hạn mức.'
                            : `Còn ${remaining} lượt mở khóa.`}{' '}
                          <Link
                            href="/recruiter/billing"
                            className="font-semibold text-blue-700 underline"
                          >
                            Xem gói
                          </Link>
                        </p>
                      </div>
                    )}
                  </Section>
                  <Section title="CV gốc">
                    {!candidate.contactUnlocked ? (
                      <p className="text-sm leading-6 text-slate-500">
                        CV khả dụng sau khi mở khóa hồ sơ.
                      </p>
                    ) : !resume ? (
                      <p className="text-sm text-slate-500">Ứng viên chưa có CV chính khả dụng.</p>
                    ) : (
                      <>
                        <p className="break-words text-sm font-semibold text-slate-900">
                          {resume.fileName}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {(resume.sizeBytes / 1024).toFixed(0)} KB · Cập nhật{' '}
                          {date(resume.updatedAt)}
                        </p>
                        {resume.status !== 'PARSED' ? (
                          <p className="mt-4 text-sm leading-6 text-amber-800">
                            CV chính chưa xử lý xong hoặc xử lý thất bại. Vui lòng quay lại sau.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-2">
                            {resume.mimeType === 'application/pdf' && (
                              <button
                                onClick={() => void openResume('preview')}
                                disabled={!!busy}
                                className={`${button} w-full border border-slate-200 hover:bg-slate-50`}
                              >
                                <FileText className="size-4" />
                                {busy === 'preview' ? 'Đang mở...' : 'Xem CV'}
                              </button>
                            )}
                            <button
                              onClick={() => void openResume('download')}
                              disabled={!!busy}
                              className={`${button} w-full border border-slate-200 hover:bg-slate-50`}
                            >
                              <Download className="size-4" />
                              {busy === 'download' ? 'Đang chuẩn bị...' : 'Tải CV gốc'}
                            </button>
                            {resume.mimeType !== 'application/pdf' && (
                              <p className="text-xs text-slate-500">
                                Định dạng này hỗ trợ tải bản gốc.
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      CV chính hiện tại do ứng viên chia sẻ. CV đã nộp cho từng tin tuyển dụng được
                      giữ riêng trong hồ sơ ứng tuyển.
                    </p>
                  </Section>
                  {candidate.contactUnlocked && (
                    <button
                      onClick={() => setInvite(true)}
                      disabled={!!busy}
                      className={`${button} w-full bg-blue-600 text-white hover:bg-blue-700`}
                    >
                      <Send className="size-4" />
                      Mời ứng tuyển
                    </button>
                  )}
                  {actionError && (
                    <p
                      role="alert"
                      className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
                    >
                      {actionError}{' '}
                      <button onClick={reload} className="font-bold underline">
                        Tải lại hồ sơ
                      </button>
                    </p>
                  )}
                </aside>
              </div>
            </>
          )
        )}
      </main>
      {preview && <Preview access={preview} onClose={() => setPreview(null)} />}
      {invite && candidate?.contactUnlocked && (
        <InviteTalentModal token={token} candidate={candidate} onClose={() => setInvite(false)} />
      )}
      <RecruiterProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        profile={recruiter}
        onProfileUpdated={setRecruiter}
      />
    </div>
  );
}
