'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getJobSeekingStatus,
  updateJobSeekingStatus,
  type JobSeekingStatus,
} from '@/lib/candidate-api';

async function getToken() {
  const {
    data: { session },
  } = await createClient().auth.getSession();
  if (!session?.access_token) throw new Error('Vui lòng đăng nhập lại.');
  return session.access_token;
}

export function JobSeekingCard({ onEditProfile }: { onEditProfile: () => void }) {
  const [status, setStatus] = useState<JobSeekingStatus | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const mutationPending = useRef(false);

  const load = useCallback(async () => {
    if (mutationPending.current) return;
    const version = ++requestVersion.current;
    try {
      const nextStatus = await getJobSeekingStatus(await getToken());
      if (version !== requestVersion.current) return;
      setStatus(nextStatus);
      setError(null);
    } catch (e) {
      if (version === requestVersion.current) {
        setError(e instanceof Error ? e.message : 'Không tải được trạng thái tìm việc.');
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requests = requestVersion;
    const initialLoad = setTimeout(() => {
      void load();
    }, 0);
    const refresh = () => {
      void load();
    };
    window.addEventListener('focus', refresh);
    return () => {
      clearTimeout(initialLoad);
      window.removeEventListener('focus', refresh);
      requests.current++;
    };
  }, [load]);

  useEffect(() => {
    if (!status?.visible || !status.visibleUntil) return;
    // Recheck at expiry while the page stays open (timers have a 32-bit limit).
    const delay = Math.min(
      Math.max(0, new Date(status.visibleUntil).getTime() - Date.now()) + 100,
      2147483647,
    );
    const timer = setTimeout(() => {
      void load();
    }, delay);
    return () => clearTimeout(timer);
  }, [status, load]);

  const update = async (enabled: boolean) => {
    if (mutationPending.current) return;
    mutationPending.current = true;
    // Invalidate reads started before the mutation and pause new background reads.
    const version = ++requestVersion.current;
    setSaving(true);
    setError(null);
    try {
      const nextStatus = await updateJobSeekingStatus(await getToken(), enabled, consent);
      if (version !== requestVersion.current) return;
      setStatus(nextStatus);
      setConsent(false);
    } catch (e) {
      if (version === requestVersion.current) {
        setError(e instanceof Error ? e.message : 'Không cập nhật được trạng thái tìm việc.');
      }
    } finally {
      mutationPending.current = false;
      if (version === requestVersion.current) {
        setSaving(false);
        setLoading(false);
      }
    }
  };

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-labelledby="job-seeking-title"
      aria-busy={loading || saving}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="job-seeking-title"
            className="flex items-center gap-2 text-lg font-semibold text-slate-900"
          >
            <BriefcaseBusiness className="size-5 text-blue-600" /> Tìm việc chủ động
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Cho phép nhà tuyển dụng có gói dịch vụ tìm thấy hồ sơ của bạn.
          </p>
        </div>
        {status && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${status.visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
            role="status"
          >
            {status.visible
              ? 'Đang tìm việc · Đang hiển thị'
              : status.enabled
                ? 'Đã ngừng hiển thị · Cần xác nhận lại'
                : 'Đang tắt'}
          </span>
        )}
      </div>
      {loading && <p className="mt-4 text-sm text-slate-500">Đang tải trạng thái...</p>}
      {error && (
        <div role="alert" className="mt-4 text-sm text-red-700">
          {error}{' '}
          <button type="button" onClick={() => void load()} className="ml-2 underline">
            Tải lại
          </button>
        </div>
      )}
      {status && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">
            HR thấy chức danh, giới thiệu, kỹ năng và khu vực của bạn. Tên được rút gọn, liên hệ bị
            ẩn cho đến khi HR mở khóa bằng hạn mức gói. HR đã mở khóa được xem hồ sơ đầy đủ và
            xem/tải CV chính của bạn trong thời gian chia sẻ. Khi tắt, hồ sơ ngừng xuất hiện trong
            kho ứng viên; các hồ sơ bạn đã ứng tuyển vẫn được xử lý bình thường.
          </p>
          {status.visible && status.visibleUntil && (
            <p className="text-sm font-medium text-emerald-700">
              Hiển thị đến {new Date(status.visibleUntil).toLocaleString('vi-VN')}. Bạn có thể tắt
              bất kỳ lúc nào.
            </p>
          )}
          {!status.visible && !status.canEnable && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <span>
                Gói hiện tại: {status.packageName}. Cần Pro hoặc Premium còn hiệu lực để bật tìm
                việc.
              </span>
              <Link href="/candidate/billing" className="font-semibold underline">
                Xem gói dịch vụ
              </Link>
            </div>
          )}
          {!status.profileReady && (
            <p className="text-sm text-amber-800">
              Tải CV để phân tích hồ sơ, bổ sung vị trí mong muốn và giới thiệu nghề nghiệp trước
              khi bật.
              <button type="button" onClick={onEditProfile} className="ml-2 font-medium underline">
                Chỉnh sửa hồ sơ
              </button>
            </p>
          )}
          {!status.visible && status.canEnable && (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={consent}
                disabled={saving}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 size-4 accent-blue-600"
              />
              <span>
                Tôi đồng ý hiển thị hồ sơ và cho phép HR mở khóa thông tin liên hệ, xem và tải CV
                chính trong thời hạn gói. Gia hạn hoặc mua gói không tự bật chia sẻ.
              </span>
            </label>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={status.visible}
              aria-label="Đang tìm việc"
              onClick={() => void update(!status.visible)}
              disabled={
                saving ||
                (!status.visible && (!status.canEnable || !status.profileReady || !consent))
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {status.visible ? 'Tắt tìm việc' : 'Bật tìm việc'}
            </button>
            {status.enabled && !status.visible && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void update(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Tắt chia sẻ hồ sơ
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
