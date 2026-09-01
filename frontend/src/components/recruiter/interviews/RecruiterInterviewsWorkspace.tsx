'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronRight,
  ExternalLink,
  RotateCw,
  Plus,
  User,
  Briefcase,
  Mail,
  Phone,
  Sparkles,
  Loader2,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';
import { format, isToday, isFuture, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  type InterviewData,
  type InterviewStatus,
  type InterviewType,
  getInterviews,
  updateInterview,
  interviewTypeLabels,
  interviewStatusLabels,
  candidateResponseLabels,
} from '@/lib/interview-api';
import { getRecruiterJobs, type JobPostingData } from '@/lib/recruiter-api';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { InterviewFeedbackModal } from './InterviewFeedbackModal';

interface RecruiterInterviewsWorkspaceProps {
  token: string;
}

type FilterTab = 'ALL' | 'TODAY' | 'UPCOMING' | 'RESCHEDULE_REQUESTED' | 'COMPLETED' | 'CANCELLED';

export function RecruiterInterviewsWorkspace({ token }: RecruiterInterviewsWorkspaceProps) {
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [jobsList, setJobsList] = useState<JobPostingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('ALL');

  // Modals state
  const [selectedInterviewForEdit, setSelectedInterviewForEdit] = useState<InterviewData | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<InterviewData | null>(null);
  const [acceptingSlotId, setAcceptingSlotId] = useState<string | null>(null);

  const fetchInterviewsData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [interviewsRes, jobsRes] = await Promise.all([
        getInterviews(token, { limit: 100 }),
        jobsList.length === 0 ? getRecruiterJobs(token, { limit: 50 }) : Promise.resolve({ data: jobsList }),
      ]);
      setInterviews(interviewsRes.data || []);
      if (jobsRes?.data && jobsList.length === 0) {
        setJobsList(jobsRes.data);
      }
    } catch (err) {
      console.error('Failed to load recruiter interviews:', err);
      toast.error('Không thể tải danh sách phỏng vấn');
    } finally {
      setLoading(false);
    }
  }, [token, jobsList.length]);

  useEffect(() => {
    fetchInterviewsData();
  }, [fetchInterviewsData]);

  // Handle 1-click acceptance of candidate proposed slot
  const handleAcceptProposedSlot = async (interview: InterviewData, slotIso: string) => {
    const slotKey = `${interview.id}-${slotIso}`;
    setAcceptingSlotId(slotKey);
    try {
      await updateInterview(token, interview.id, {
        scheduledAt: slotIso,
        status: 'SCHEDULED',
        candidateResponse: 'ACCEPTED',
      });
      toast.success(
        `Đã chấp nhận khung giờ ${format(new Date(slotIso), 'HH:mm dd/MM/yyyy')} và chốt lịch phỏng vấn!`,
      );
      await fetchInterviewsData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể cập nhật lịch phỏng vấn',
      );
    } finally {
      setAcceptingSlotId(null);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let rescheduleRequestedCount = 0;
    let completedCount = 0;

    interviews.forEach((item) => {
      const date = parseISO(item.scheduledAt);
      if (item.status === 'COMPLETED') {
        completedCount++;
      } else if (item.candidateResponse === 'RESCHEDULE_REQUESTED') {
        rescheduleRequestedCount++;
      }

      if (isToday(date) && item.status !== 'CANCELLED') {
        todayCount++;
      } else if (isFuture(date) && item.status !== 'CANCELLED' && item.status !== 'COMPLETED') {
        upcomingCount++;
      }
    });

    return { todayCount, upcomingCount, rescheduleRequestedCount, completedCount };
  }, [interviews]);

  // Filtered & sorted interviews
  const filteredInterviews = useMemo(() => {
    return interviews
      .filter((item) => {
        // Job filter
        if (selectedJobId && item.application?.job?.id !== selectedJobId) {
          return false;
        }

        // Type filter
        if (selectedType !== 'ALL' && item.type !== selectedType) {
          return false;
        }

        // Tab filter
        const date = parseISO(item.scheduledAt);
        if (activeFilterTab === 'TODAY') {
          if (!isToday(date) || item.status === 'CANCELLED') return false;
        } else if (activeFilterTab === 'UPCOMING') {
          if (!isFuture(date) || item.status === 'CANCELLED' || item.status === 'COMPLETED') return false;
        } else if (activeFilterTab === 'RESCHEDULE_REQUESTED') {
          if (item.candidateResponse !== 'RESCHEDULE_REQUESTED') return false;
        } else if (activeFilterTab === 'COMPLETED') {
          if (item.status !== 'COMPLETED') return false;
        } else if (activeFilterTab === 'CANCELLED') {
          if (item.status !== 'CANCELLED') return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const candidateName = item.application?.candidate?.fullName?.toLowerCase() || '';
          const candidateEmail = item.application?.candidate?.email?.toLowerCase() || '';
          const jobTitle = item.application?.job?.title?.toLowerCase() || '';
          const title = item.title?.toLowerCase() || '';
          return (
            candidateName.includes(q) ||
            candidateEmail.includes(q) ||
            jobTitle.includes(q) ||
            title.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Priority: Reschedule requests first, then today's interviews, then upcoming by date
        const isRescheduleA = a.candidateResponse === 'RESCHEDULE_REQUESTED';
        const isRescheduleB = b.candidateResponse === 'RESCHEDULE_REQUESTED';
        if (isRescheduleA && !isRescheduleB) return -1;
        if (!isRescheduleA && isRescheduleB) return 1;

        const dateA = new Date(a.scheduledAt).getTime();
        const dateB = new Date(b.scheduledAt).getTime();
        return dateA - dateB;
      });
  }, [interviews, selectedJobId, selectedType, activeFilterTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Overview Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#1F2937] tracking-tight">
                Quản Lý Lịch Phỏng Vấn Tuyển Dụng
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Theo dõi, xử lý dời lịch, vào phòng họp Online và chấm điểm đánh giá ứng viên
              </p>
            </div>
          </div>
        </div>

        {/* Quick Refresh Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchInterviewsData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* 2. Stats Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today */}
        <div
          onClick={() => setActiveFilterTab('TODAY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeFilterTab === 'TODAY'
              ? 'bg-blue-50/90 border-[#2563EB] ring-2 ring-[#2563EB]/20'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase tracking-wider">Hôm nay</span>
            <div className="p-1.5 rounded-lg bg-blue-100 text-[#2563EB]">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#2563EB]">
              {stats.todayCount}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Buổi phỏng vấn</span>
          </div>
        </div>

        {/* Card 2: Upcoming */}
        <div
          onClick={() => setActiveFilterTab('UPCOMING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeFilterTab === 'UPCOMING'
              ? 'bg-purple-50/90 border-purple-600 ring-2 ring-purple-600/20'
              : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase tracking-wider">Sắp diễn ra</span>
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-700">
              {stats.upcomingCount}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Buổi phỏng vấn</span>
          </div>
        </div>

        {/* Card 3: Reschedule Requested */}
        <div
          onClick={() => setActiveFilterTab('RESCHEDULE_REQUESTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeFilterTab === 'RESCHEDULE_REQUESTED'
              ? 'bg-orange-50/90 border-orange-500 ring-2 ring-orange-500/20'
              : stats.rescheduleRequestedCount > 0
              ? 'bg-orange-50/40 border-orange-200 hover:border-orange-300'
              : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase tracking-wider text-orange-900">Ứng viên xin dời lịch</span>
            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-orange-600">
              {stats.rescheduleRequestedCount}
            </span>
            <span className="text-[11px] font-bold text-orange-700">Cần phê duyệt</span>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div
          onClick={() => setActiveFilterTab('COMPLETED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeFilterTab === 'COMPLETED'
              ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase tracking-wider">Đã hoàn thành</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">
              {stats.completedCount}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Đã xong</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveFilterTab('ALL')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilterTab === 'ALL'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({interviews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('TODAY')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeFilterTab === 'TODAY'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Hôm nay</span>
            {stats.todayCount > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px]">
                {stats.todayCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('UPCOMING')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilterTab === 'UPCOMING'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sắp diễn ra ({stats.upcomingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('RESCHEDULE_REQUESTED')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeFilterTab === 'RESCHEDULE_REQUESTED'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-orange-700 bg-orange-50/80 hover:bg-orange-100'
            }`}
          >
            <span>Xin dời lịch</span>
            {stats.rescheduleRequestedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-orange-700 text-white rounded-full text-[10px] animate-pulse">
                {stats.rescheduleRequestedCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('COMPLETED')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilterTab === 'COMPLETED'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đã hoàn thành ({stats.completedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('CANCELLED')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilterTab === 'CANCELLED'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đã hủy
          </button>
        </div>

        {/* Search & Selectors */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên ứng viên, email, vị trí..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Job Filter */}
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="text-xs bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-[#1F2937] font-semibold outline-none focus:border-[#2563EB] cursor-pointer max-w-[200px]"
              >
                <option value="">Tất cả bài đăng ({jobsList.length})</option>
                {jobsList.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-[#1F2937] font-semibold outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="ALL">Mọi hình thức</option>
                <option value="ONLINE">Trực tuyến (Online)</option>
                <option value="OFFLINE">Trực tiếp (Offline)</option>
                <option value="TECHNICAL">Kỹ thuật (Technical)</option>
                <option value="BEHAVIORAL">Hành vi (Behavioral)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interviews List View */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-xs font-bold text-slate-500">Đang tải lịch phỏng vấn...</p>
        </div>
      ) : filteredInterviews.length > 0 ? (
        <div className="space-y-4">
          {filteredInterviews.map((item) => {
            const date = parseISO(item.scheduledAt);
            const isSessionToday = isToday(date);
            const cand = item.application?.candidate;
            const job = item.application?.job;
            const isRescheduleRequested = item.candidateResponse === 'RESCHEDULE_REQUESTED';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 shadow-sm ${
                  isRescheduleRequested
                    ? 'bg-orange-50/30 border-orange-300 ring-1 ring-orange-300'
                    : isSessionToday
                    ? 'bg-gradient-to-r from-blue-50/50 to-white border-[#2563EB] ring-1 ring-blue-200'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Top Row: Time Badge + Job Title + Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Today Badge */}
                    {isSessionToday && (
                      <span className="px-2.5 py-0.5 text-xs font-black bg-[#2563EB] text-white rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" /> HÔM NAY
                      </span>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F2937]">
                      <Clock className="w-4 h-4 text-[#2563EB]" />
                      <span>{format(date, 'HH:mm - EEEE, dd/MM/yyyy')}</span>
                      <span className="text-slate-400 font-normal">({item.durationMinutes} phút)</span>
                    </div>

                    {/* Type Badge */}
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200">
                      {interviewTypeLabels[item.type] || item.type}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {interviewStatusLabels[item.status] || item.status}
                    </span>
                  </div>

                  {/* Candidate Response Status */}
                  <div className="flex items-center gap-2">
                    {item.candidateResponse && (
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                          item.candidateResponse === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : item.candidateResponse === 'RESCHEDULE_REQUESTED'
                            ? 'bg-orange-100 text-orange-900 border-orange-300 animate-pulse'
                            : item.candidateResponse === 'DECLINED'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {item.candidateResponse === 'ACCEPTED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                        {item.candidateResponse === 'RESCHEDULE_REQUESTED' && <AlertTriangle className="w-3.5 h-3.5 text-orange-700" />}
                        {candidateResponseLabels[item.candidateResponse] || item.candidateResponse}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Candidate Details & Job Info */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Candidate Profile (6 cols) */}
                  <div className="lg:col-span-6 flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white font-bold text-base flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {cand?.avatarUrl ? (
                        <img src={cand.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        cand?.fullName?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-[#1F2937] truncate">
                          {cand?.fullName || 'Ứng viên'}
                        </h4>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#2563EB] font-bold truncate">
                        Vị trí ứng tuyển: {job?.title || 'Công việc'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {cand?.email}
                        </span>
                        {cand?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {cand?.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location or Room Link (3 cols) */}
                  <div className="lg:col-span-3 text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">
                      Địa điểm / Phòng họp
                    </span>
                    {item.locationOrLink ? (
                      item.locationOrLink.startsWith('http') ? (
                        <a
                          href={item.locationOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#2563EB] font-bold hover:underline truncate max-w-full"
                        >
                          <Video className="w-4 h-4 text-[#2563EB] shrink-0" />
                          <span className="truncate">{item.locationOrLink}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                          <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                          <span className="truncate">{item.locationOrLink}</span>
                        </div>
                      )
                    ) : (
                      <span className="text-slate-400 italic">Chưa cung cấp link hoặc địa điểm</span>
                    )}
                  </div>

                  {/* Action Buttons & Score (3 cols) */}
                  <div className="lg:col-span-3 flex flex-wrap lg:flex-col items-end justify-center gap-2">
                    {item.locationOrLink?.startsWith('http') && (
                      <a
                        href={item.locationOrLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-all w-full sm:w-auto justify-center"
                      >
                        <Video className="w-3.5 h-3.5" /> Vào phòng họp Online
                      </a>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInterviewForEdit(item);
                          setIsScheduleModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-xs font-bold text-slate-700 transition-all"
                      >
                        Đổi lịch
                      </button>

                      {item.score !== undefined && item.score !== null ? (
                        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-right">
                          <span className="text-[10px] font-bold text-emerald-700 block uppercase">Điểm đánh giá</span>
                          <span className="text-sm font-black text-emerald-800">{Number(item.score)}/100</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedInterviewForFeedback(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                        >
                          <Award className="w-3.5 h-3.5" /> Chấm điểm
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reschedule Requested Alert Box */}
                {isRescheduleRequested && (
                  <div className="rounded-xl bg-orange-50 p-4 border border-orange-200 text-xs text-orange-950 space-y-3">
                    <div className="font-bold flex items-center justify-between text-orange-900">
                      <span className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-600" /> Ứng viên xin dời lịch phỏng vấn
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInterviewForEdit(item);
                          setIsScheduleModalOpen(true);
                        }}
                        className="text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        Tùy chỉnh lịch khác ↗
                      </button>
                    </div>

                    {item.candidateNotes && (
                      <p className="text-xs text-orange-800 bg-white/80 p-2.5 rounded-lg border border-orange-100 italic">
                        <span className="font-semibold not-italic">Lý do từ ứng viên:</span> &ldquo;{item.candidateNotes}&rdquo;
                      </p>
                    )}

                    {item.proposedSlots && Array.isArray(item.proposedSlots) && item.proposedSlots.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-orange-900 block">
                          Khung giờ ứng viên rảnh (Duyệt nhanh 1 slot):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.proposedSlots.map((slotIso: string) => {
                            const isAccepting = acceptingSlotId === `${item.id}-${slotIso}`;
                            return (
                              <div
                                key={slotIso}
                                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-orange-200 shadow-2xs"
                              >
                                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                                  {format(new Date(slotIso), 'HH:mm - EEEE, dd/MM/yyyy')}
                                </span>
                                <button
                                  type="button"
                                  disabled={acceptingSlotId !== null}
                                  onClick={() => handleAcceptProposedSlot(item, slotIso)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-2xs active:scale-95 transition disabled:opacity-50"
                                >
                                  {isAccepting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  Chấp nhận
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Interviewer Notes if any */}
                {item.interviewerNotes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-500 block uppercase text-[10px] mb-0.5">Nhận xét của HR:</span>
                    <p className="italic">{item.interviewerNotes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
          <h4 className="text-sm font-bold text-[#1F2937]">Không tìm thấy buổi phỏng vấn nào</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedJobId || activeFilterTab !== 'ALL'
              ? 'Không có kết quả khớp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc bộ lọc.'
              : 'Chưa có buổi phỏng vấn nào được lên lịch cho các bài tuyển dụng của bạn.'}
          </p>
        </div>
      )}

      {/* Schedule / Edit Interview Modal */}
      {isScheduleModalOpen && selectedInterviewForEdit && (
        <ScheduleInterviewModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedInterviewForEdit(null);
          }}
          token={token}
          applicationId={selectedInterviewForEdit.applicationId}
          candidateName={selectedInterviewForEdit.application?.candidate?.fullName || 'Ứng viên'}
          jobTitle={selectedInterviewForEdit.application?.job?.title || 'Công việc'}
          interviewToEdit={selectedInterviewForEdit}
          onSuccess={fetchInterviewsData}
        />
      )}

      {/* Feedback Modal */}
      {selectedInterviewForFeedback && (
        <InterviewFeedbackModal
          isOpen={!!selectedInterviewForFeedback}
          onClose={() => setSelectedInterviewForFeedback(null)}
          token={token}
          interview={selectedInterviewForFeedback}
          candidateName={selectedInterviewForFeedback.application?.candidate?.fullName || 'Ứng viên'}
          onSuccess={fetchInterviewsData}
        />
      )}
    </div>
  );
}
