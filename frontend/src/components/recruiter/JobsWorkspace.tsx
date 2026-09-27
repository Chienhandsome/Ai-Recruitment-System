'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Filter, Eye, Pencil, ChevronLeft, ChevronRight, TrendingUp, Calendar, Clock, AlertTriangle, Users } from 'lucide-react';
import type { JobsResponse, JobPostingData } from '@/lib/recruiter-api';
import { updateRecruiterJob, getRecruiterJobs } from '@/lib/recruiter-api';
import { CreateJobWizard } from './CreateJobWizard';
import { JobDetailView } from './JobDetailView';
import { AdjustJobQuotaModal } from './jobs/AdjustJobQuotaModal';
import { ExtendJobDeadlineModal } from './jobs/ExtendJobDeadlineModal';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

interface JobsWorkspaceProps {
  initialData: JobsResponse | null;
  token: string;
  selectedJobId?: string | null;
  initialJobTab?: "info" | "candidates";
  selectedApplicationId?: string | null;
  onClearSelectedJob?: () => void;
}

export function JobsWorkspace({
  initialData,
  token,
  selectedJobId: externalJobId,
  initialJobTab = "info",
  selectedApplicationId,
  onClearSelectedJob,
}: JobsWorkspaceProps) {
  const [data, setData] = useState<JobsResponse | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(initialData?.meta.page ?? 1);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(externalJobId || null);
  const [jobDetailTab, setJobDetailTab] = useState<"info" | "candidates">(initialJobTab);
  const [editingJob, setEditingJob] = useState<JobPostingData | null>(null);
  const [adjustQuotaJob, setAdjustQuotaJob] = useState<JobPostingData | null>(null);
  const [extendExpiryJob, setExtendExpiryJob] = useState<JobPostingData | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (externalJobId !== undefined) {
      setSelectedJobId(externalJobId);
      if (initialJobTab) {
        setJobDetailTab(initialJobTab);
      }
    }
  }, [externalJobId, initialJobTab]);

  const handleBackFromDetail = () => {
    setSelectedJobId(null);
    if (onClearSelectedJob) {
      onClearSelectedJob();
    }
  };

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'DRAFT', label: 'Bản nháp' },
    { id: 'PUBLISHED', label: 'Đang mở' },
    { id: 'PAUSED', label: 'Tạm dừng' },
    { id: 'CLOSED', label: 'Đã đóng' },
  ];

  const loadJobs = useCallback(
    async (status: string, searchQuery: string, targetPage: number) => {
      if (!token) return;
      setLoading(true);
      try {
        const result = await getRecruiterJobs(token, {
          page: targetPage,
          limit: 10,
          status: status === 'ALL' ? undefined : status,
          search: searchQuery.trim() || undefined,
        });
        setData(result);
      } catch (err) {
        console.error('Failed to load recruiter jobs:', err);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (!initialData) {
        loadJobs(activeTab, search, page);
      }
      return;
    }
    const timer = setTimeout(() => {
      loadJobs(activeTab, search, page);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, search, page, loadJobs]);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await updateRecruiterJob(token, jobId, { status: newStatus });
      // Reload jobs
      loadJobs(activeTab, search, page);
    } catch (err) {
      console.error('Failed to change status', err);
      alert('Cập nhật trạng thái thất bại');
    }
  };

  // If a job is selected, render the JobDetailView!
  if (selectedJobId) {
    return (
      <>
        <JobDetailView
          jobId={selectedJobId}
          token={token}
          defaultTab={jobDetailTab}
          initialSelectedAppId={selectedApplicationId}
          onBack={handleBackFromDetail}
          onEdit={(job) => {
            setEditingJob(job);
            setIsWizardOpen(true);
          }}
          onJobDeleted={() => {
            handleBackFromDetail();
            loadJobs(activeTab, search, page);
          }}
        />

        {isWizardOpen && (
          <CreateJobWizard
            isOpen={isWizardOpen}
            onClose={() => {
              setIsWizardOpen(false);
              setEditingJob(null);
            }}
            token={token}
            initialJobData={editingJob}
            onSuccess={() => {
              setIsWizardOpen(false);
              setEditingJob(null);
              loadJobs(activeTab, search, page);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Quản lý Bài đăng</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tạo mới và theo dõi các chiến dịch tuyển dụng của bạn.
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tạo bài tuyển dụng mới
        </button>
      </div>

      {/* Filters and Tabs */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex p-1.5 bg-[#EFF6FF] rounded-xl border border-blue-100 w-full md:w-auto overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm bài đăng, mã Job..."
              className="block w-full pl-9 pr-3 py-2 border border-blue-200 rounded-xl text-xs bg-[#EFF6FF] text-[#1F2937] placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
            />
          </div>
          <button className="inline-flex items-center justify-center p-2 border border-blue-200 rounded-xl text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-[#EFF6FF] border-b border-blue-100">
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider"
                  >
                    Vị trí / Mã Job
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider"
                  >
                    Phòng ban
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider"
                  >
                    Chỉ tiêu tuyển dụng
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider"
                  >
                    Hạn nộp hồ sơ
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-bold text-[#1F2937] uppercase tracking-wider"
                  >
                    Ứng viên
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider"
                  >
                    Trạng thái
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right text-xs font-bold text-[#1F2937] uppercase tracking-wider"
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {data.data.map((job) => {
                  const hired = job.hiredCount ?? 0;
                  const target = job.targetHires ?? 1;
                  const isQuotaReached = hired >= target;
                  const expiry = job.expiryDate ? new Date(job.expiryDate) : null;
                  const isExpired = expiry ? isPast(expiry) && !isToday(expiry) : false;
                  const daysLeft = expiry ? differenceInDays(expiry, new Date()) : null;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
                            {job.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded font-mono font-bold border border-blue-200">
                              {job.jobCode}
                            </span>
                            {job.workingModel && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {job.workingModel === 'ON_SITE'
                                  ? 'On-site'
                                  : job.workingModel === 'HYBRID'
                                    ? 'Hybrid'
                                    : job.workingModel === 'REMOTE'
                                      ? 'Remote'
                                      : 'Shift'}
                              </span>
                            )}
                            {job.requiresProofOfWork && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                                Req Proof
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-600">
                          {job.department?.name || 'Chưa xếp'}
                        </span>
                      </td>
                      {/* Headcount column */}
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                              isQuotaReached
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-[#EFF6FF] text-[#2563EB] border-blue-200'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            {hired}/{target} {isQuotaReached ? '(Đã đủ)' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAdjustQuotaJob(job)}
                            title="Điều chỉnh chỉ tiêu tuyển dụng"
                            className="p-1 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      {/* Expiry Date Column */}
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {expiry ? format(expiry, 'dd/MM/yyyy') : 'Không giới hạn'}
                            </span>
                            {isExpired && (
                              <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 w-fit mt-0.5">
                                Đã hết hạn
                              </span>
                            )}
                            {!isExpired && daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && (
                              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit mt-0.5">
                                Còn {daysLeft === 0 ? 'hôm nay' : `${daysLeft} ngày`}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setExtendExpiryJob(job)}
                            title="Gia hạn thời hạn tuyển dụng"
                            className="p-1 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      {/* Applications count */}
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-blue-200">
                          {job._count?.applications || 0}
                        </div>
                      </td>
                      {/* Status Column */}
                      <td
                        className="px-4 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col gap-1">
                          <select
                            value={job.status}
                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                            className={`text-xs font-bold rounded-full px-3 py-1 outline-none cursor-pointer border ${
                              job.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : job.status === 'DRAFT'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : job.status === 'PAUSED'
                                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                                    : 'bg-red-50 text-red-700 border-red-300'
                            }`}
                          >
                            <option value="DRAFT">Nháp</option>
                            <option value="PUBLISHED">Đang mở</option>
                            <option value="PAUSED">Tạm dừng</option>
                            <option value="CLOSED">Đóng</option>
                          </select>
                          {job.status === 'CLOSED' && job.closeReason && (
                            <span className="text-[10px] font-bold text-slate-500">
                              {job.closeReason === 'QUOTA_REACHED'
                                ? '• Đủ chỉ tiêu'
                                : job.closeReason === 'EXPIRED'
                                  ? '• Hết hạn'
                                  : '• Đóng thủ công'}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Actions */}
                      <td
                        className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedJobId(job.id)}
                            title="Xem chi tiết & ứng viên"
                            className="p-1.5 text-slate-400 hover:text-[#2563EB] rounded-md hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingJob(job);
                              setIsWizardOpen(true);
                            }}
                            title="Sửa JD"
                            className="p-1.5 text-slate-400 hover:text-[#2563EB] rounded-md hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAdjustQuotaJob(job)}
                            title="Tăng chỉ tiêu"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExtendExpiryJob(job)}
                            title="Gia hạn JD"
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.meta.totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-slate-500">
                  Hiển thị {(data.meta.page - 1) * data.meta.limit + 1}–
                  {Math.min(data.meta.page * data.meta.limit, data.meta.total)} trong tổng số{' '}
                  {data.meta.total} tin tuyển dụng
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={loading || data.meta.page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </button>
                  <span className="min-w-20 text-center text-xs font-bold text-slate-600">
                    Trang {data.meta.page}/{data.meta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(data.meta.totalPages, current + 1))
                    }
                    disabled={loading || data.meta.page >= data.meta.totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-4 border border-blue-200 shadow-sm">
              <Search className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-bold text-[#1F2937]">Không tìm thấy bài đăng nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Bạn chưa có bài đăng nào{' '}
              {activeTab !== 'ALL'
                ? `ở trạng thái ${tabs.find((t) => t.id === activeTab)?.label}`
                : ''}
              . Bắt đầu bằng cách tạo một bài tuyển dụng mới nhé!
            </p>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#2563EB] hover:underline"
            >
              <Plus className="w-4 h-4" /> Tạo bài đăng ngay
            </button>
          </div>
        )}
      </div>

      {isWizardOpen && (
        <CreateJobWizard
          isOpen={isWizardOpen}
          onClose={() => {
            setIsWizardOpen(false);
            setEditingJob(null);
          }}
          token={token}
          initialJobData={editingJob}
          onSuccess={() => {
            setIsWizardOpen(false);
            setEditingJob(null);
            setPage(1);
            loadJobs(activeTab, search, 1);
          }}
        />
      )}

      {adjustQuotaJob && (
        <AdjustJobQuotaModal
          isOpen={!!adjustQuotaJob}
          onClose={() => setAdjustQuotaJob(null)}
          job={adjustQuotaJob}
          token={token}
          onSuccess={() => {
            loadJobs(activeTab, search, page);
          }}
        />
      )}

      {extendExpiryJob && (
        <ExtendJobDeadlineModal
          isOpen={!!extendExpiryJob}
          onClose={() => setExtendExpiryJob(null)}
          job={extendExpiryJob}
          token={token}
          onSuccess={() => {
            loadJobs(activeTab, search, page);
          }}
        />
      )}
    </div>
  );
}
