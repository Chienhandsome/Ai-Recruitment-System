"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Edit, Trash2, CheckCircle2, Bot, MapPin, Briefcase, 
  DollarSign, Clock, FileText, Award, HelpCircle, User, Sparkles, Filter, Search,
  GraduationCap, Code, AlertTriangle, ExternalLink, ThumbsUp, ThumbsDown, ChevronRight,
  Phone, Mail, FolderGit2, ShieldCheck
} from "lucide-react";
import { JobPostingData, getRecruiterJobDetail, deleteRecruiterJob, updateRecruiterJob } from "@/lib/recruiter-api";
import { format } from "date-fns";

interface JobDetailViewProps {
  jobId: string;
  token: string;
  onBack: () => void;
  onEdit: (job: JobPostingData) => void;
  onJobDeleted: () => void;
}

export function JobDetailView({
  jobId,
  token,
  onBack,
  onEdit,
  onJobDeleted,
}: JobDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"info" | "candidates">("info");
  const [job, setJob] = useState<JobPostingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [searchCandidate, setSearchCandidate] = useState("");

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const data = await getRecruiterJobDetail(token, jobId);
      setJob(data);

      if (data?.applications && data.applications.length > 0) {
        const sorted = [...data.applications].sort((a: any, b: any) => {
          const scoreA = a.aiMatchingResults?.[0] ? Number(a.aiMatchingResults[0].overallScore) : 0;
          const scoreB = b.aiMatchingResults?.[0] ? Number(b.aiMatchingResults[0].overallScore) : 0;
          return scoreB - scoreA;
        });
        setSelectedAppId(sorted[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng nháp này?")) return;
    try {
      await deleteRecruiterJob(token, jobId);
      onJobDeleted();
    } catch (err: any) {
      alert(`Xóa thất bại: ${err?.message || "Lỗi không xác định"}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateRecruiterJob(token, jobId, { status: newStatus });
      fetchJobDetail();
    } catch (err: any) {
      alert(`Cập nhật trạng thái thất bại: ${err?.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-slate-500">
        Không tìm thấy thông tin bài tuyển dụng.
        <button onClick={onBack} className="block mx-auto mt-4 text-[#2563EB] font-medium underline">Quay lại danh sách</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2563EB] mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại Danh sách Bài tuyển dụng
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#1F2937]">{job.title}</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-bold border border-blue-200">
              {job.jobCode}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              job.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              job.status === "DRAFT" ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-slate-100 text-slate-700 border-slate-300"
            }`}>
              {job.status === "PUBLISHED" ? "ĐANG TUYỂN" : job.status === "DRAFT" ? "BẢN NHÁP" : job.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Tạo ngày: {new Date(job.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2">
          {job.status === "DRAFT" && (
            <button 
              onClick={() => handleStatusChange("PUBLISHED")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Xuất bản (Publish)
            </button>
          )}
          {job.status === "PUBLISHED" && (
            <button 
              onClick={() => handleStatusChange("CLOSED")}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
            >
              Đóng tuyển dụng
            </button>
          )}
          <button 
            onClick={() => onEdit(job)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl border border-blue-200 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa JD
          </button>
          {job.status === "DRAFT" && (
            <button 
              onClick={handleDelete}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              title="Xóa bài nháp"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1 bg-[#EFF6FF] rounded-xl border border-blue-100">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "info"
              ? "bg-[#2563EB] text-white shadow-md"
              : "text-slate-600 hover:text-[#2563EB]"
          }`}
        >
          <FileText className="w-4 h-4" /> Thông tin Chi tiết JD
        </button>
        <button
          onClick={() => setActiveTab("candidates")}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "candidates"
              ? "bg-[#2563EB] text-white shadow-md"
              : "text-slate-600 hover:text-[#2563EB]"
          }`}
        >
          <Bot className="w-4 h-4" /> Đánh giá Ứng viên AI ({job.applications?.length || 0})
        </button>
      </div>

      {/* TAB 1: Job Description Info */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Địa điểm</span>
                  <span className="text-xs font-bold text-slate-700">{job.location || "Chưa cập nhật"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Hình thức</span>
                  <span className="text-xs font-bold text-slate-700">{job.employmentType || "Toàn thời gian"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Mức lương</span>
                  <span className="text-xs font-bold text-slate-700">
                    {job.minSalary ? `${job.minSalary.toLocaleString()} - ${job.maxSalary?.toLocaleString()} ${job.currency || 'VND'}` : "Thỏa thuận"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Kinh nghiệm</span>
                  <span className="text-xs font-bold text-slate-700">{job.requiredExperienceYears || 0} năm</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-base font-extrabold text-[#1F2937] flex items-center gap-2 border-b pb-2">
                <FileText className="w-5 h-5 text-[#2563EB]" /> Mô tả Công việc (Job Description)
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-base font-extrabold text-[#1F2937] flex items-center gap-2 border-b pb-2">
                <CheckCircle2 className="w-5 h-5 text-[#2563EB]" /> Yêu cầu ứng viên (Requirements)
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                {job.requirements || "Không có yêu cầu chi tiết."}
              </div>
            </div>
          </div>

          {/* Sidebar Info: Job Skills & Criteria */}
          <div className="space-y-6">
            
            {/* Skills Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-extrabold text-[#1F2937] flex items-center gap-2 border-b pb-2">
                <Award className="w-4 h-4 text-[#2563EB]" /> Kỹ năng Yêu cầu
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-[#2563EB] block mb-1.5">Bắt buộc (Mandatory):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.jobSkills?.filter(s => s.requirementType === "MANDATORY").map((s) => (
                      <span key={s.id} className="px-2.5 py-1 bg-blue-50 text-[#2563EB] text-xs font-bold rounded-lg border border-blue-200">
                        {s.skill.name}
                      </span>
                    ))}
                    {(!job.jobSkills || job.jobSkills.filter(s => s.requirementType === "MANDATORY").length === 0) && (
                      <span className="text-xs text-slate-400 italic">Chưa quy định</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1.5">Ưu tiên / Điểm cộng (Preferred):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.jobSkills?.filter(s => s.requirementType !== "MANDATORY").map((s) => (
                      <span key={s.id} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
                        {s.skill.name}
                      </span>
                    ))}
                    {(!job.jobSkills || job.jobSkills.filter(s => s.requirementType !== "MANDATORY").length === 0) && (
                      <span className="text-xs text-slate-400 italic">Không có</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Screening Settings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-extrabold text-[#1F2937] flex items-center gap-2 border-b pb-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" /> Cấu hình Chấm điểm AI
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-[#EFF6FF] p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-600 font-medium">Ngưỡng Tự động Duyệt:</span>
                  <span className="font-extrabold text-emerald-600">{job.autoShortlistThreshold || 80} Điểm</span>
                </div>

                <div className="flex justify-between items-center bg-[#EFF6FF] p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-600 font-medium">Ngưỡng Tự động Loại:</span>
                  <span className="font-extrabold text-rose-600">{job.autoRejectThreshold || 40} Điểm</span>
                </div>

                <div className="flex justify-between items-center bg-[#EFF6FF] p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-600 font-medium">Loại nếu thiếu Skill bắt buộc:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    job.rejectOnMissingMandatory !== false ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700"
                  }`}>
                    {job.rejectOnMissingMandatory !== false ? "Bật (Auto-Reject)" : "Tắt"}
                  </span>
                </div>

                <div className="pt-2 border-t border-blue-200/60 space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Phân bổ Trọng số Chấm điểm:</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                      <span className="text-slate-500">Kỹ năng:</span>
                      <span className="font-bold text-[#2563EB]">{job.skillWeight || 40}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                      <span className="text-slate-500">Kinh nghiệm:</span>
                      <span className="font-bold text-[#2563EB]">{job.experienceWeight || 30}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                      <span className="text-slate-500">Học vấn:</span>
                      <span className="font-bold text-[#2563EB]">{job.educationWeight || 15}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold">Ngoại ngữ / Chứng chỉ</span>
                      <span className="font-bold text-[#2563EB]">{job.otherWeight || 15}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: AI Candidate Evaluation */}
      {activeTab === "candidates" && (
        <div className="space-y-6">
          {/* Top Bar: Search & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#2563EB]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email ứng viên..."
                  value={searchCandidate}
                  onChange={(e) => setSearchCandidate(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#EFF6FF] border border-blue-200 rounded-lg outline-none text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-[#2563EB] rounded-lg border border-blue-200">
                {job.applications?.length || 0} Ứng viên
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              💡 Danh sách được sắp xếp <strong>từ cao xuống thấp theo Điểm AI</strong>. Bấm vào ứng viên để xem Hồ sơ &amp; Giải thích chi tiết phía dưới.
            </p>
          </div>

          {job.applications && job.applications.length > 0 ? (
            (() => {
              // 1. Sort applications descending by AI overallScore
              const sortedApplications = [...job.applications]
                .filter((app: any) => {
                  if (!searchCandidate) return true;
                  const name = app.candidate?.user?.fullName?.toLowerCase() || "";
                  const email = app.candidate?.user?.email?.toLowerCase() || "";
                  const term = searchCandidate.toLowerCase();
                  return name.includes(term) || email.includes(term);
                })
                .sort((a: any, b: any) => {
                  const scoreA = a.aiMatchingResults?.[0] ? Number(a.aiMatchingResults[0].overallScore) : 0;
                  const scoreB = b.aiMatchingResults?.[0] ? Number(b.aiMatchingResults[0].overallScore) : 0;
                  return scoreB - scoreA;
                });

              const activeApp = sortedApplications.find((app: any) => app.id === selectedAppId) || sortedApplications[0];

              return (
                <div className="space-y-6">
                  {/* VERTICAL CANDIDATE LIST (1 HÀNG DỌC TỪ CAO XUỐNG THẤP) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#2563EB]" /> Bảng Xếp Hạng Ứng Viên AI (Hàng Dọc - Từ Cao đến Thấp)
                    </h3>
                    
                    <div className="flex flex-col space-y-2.5">
                      {sortedApplications.map((app: any, idx: number) => {
                        const aiResult = app.aiMatchingResults?.[0];
                        const candidateData = app.candidate;
                        const user = candidateData?.user;
                        const score = aiResult ? Math.round(Number(aiResult.overallScore)) : 0;
                        const isSelected = activeApp?.id === app.id;
                        const matchedCount = aiResult?.matchedSkills?.length || 0;

                        return (
                          <div
                            key={app.id}
                            onClick={() => setSelectedAppId(app.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isSelected
                                ? "bg-[#EFF6FF] border-[#2563EB] shadow-md ring-1 ring-[#2563EB]"
                                : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80"
                            }`}
                          >
                            {/* Left Info: Rank + Avatar + Name + Email */}
                            <div className="flex items-center gap-4 min-w-0">
                              {/* Rank badge */}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                idx === 1 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                                idx === 2 ? "bg-orange-100 text-orange-800 border border-orange-300" :
                                "bg-slate-100 text-slate-500"
                              }`}>
                                #{idx + 1}
                              </div>

                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0 shadow-sm">
                                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (user?.fullName?.charAt(0) || "U")}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-sm text-[#1F2937] truncate">{user?.fullName || "Ứng viên"}</h4>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#2563EB] text-white rounded-full">ĐANG XEM</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                                  <span>{user?.email}</span>
                                  {candidateData?.desiredTitle && (
                                    <>
                                      <span>•</span>
                                      <span className="font-semibold text-slate-700">{candidateData.desiredTitle}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Middle Info: Skills Matched Badge & Stage */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ {matchedCount} Kỹ năng khớp
                              </span>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                app.currentStage === 'SHORTLISTED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                app.currentStage === 'REJECTED' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                'bg-[#EFF6FF] text-[#2563EB] border-blue-200'
                              }`}>
                                {app.currentStage || "APPLIED"}
                              </span>
                            </div>

                            {/* Right Info: Large AI Score */}
                            <div className="flex items-center gap-3 shrink-0">
                              {app.processingStatus === 'MATCHING' ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-xs font-bold text-[#2563EB]">Đang phân tích AI...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Điểm AI</span>
                                    <span className={`text-xl font-black ${
                                      score >= (job.autoShortlistThreshold || 80) ? "text-emerald-600" :
                                      score < (job.autoRejectThreshold || 40) ? "text-rose-600" : "text-amber-500"
                                    }`}>
                                      {score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                                    </span>
                                  </div>
                                  <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? "rotate-90 text-[#2563EB]" : "text-slate-400"}`} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* INLINE SPLIT DETAIL VIEW (BÊN TRÁI: HỒ SƠ ỨNG VIÊN | BÊN PHẢI: GIẢI THÍCH AI) */}
                  {activeApp && (() => {
                    const aiResult = activeApp.aiMatchingResults?.[0];
                    const cand = activeApp.candidate;
                    const user = cand?.user;
                    const score = aiResult ? Math.round(Number(aiResult.overallScore)) : 0;
                    const workExps = cand?.workExperiences || [];
                    const educations = cand?.educations || [];
                    const projects = cand?.projects || [];
                    const skills = cand?.candidateSkills || [];

                    return (
                      <div className="space-y-4 pt-2">
                        {/* Section Header */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#1F2937] to-slate-800 text-white p-4 rounded-2xl shadow-md">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-[#3B82F6]" />
                            <div>
                              <h3 className="font-extrabold text-base">
                                Chi tiết Hồ sơ &amp; Đánh giá AI cho: <span className="text-[#60A5FA]">{user?.fullName || "Ứng viên"}</span>
                              </h3>
                              <p className="text-xs text-slate-300">
                                Ứng tuyển ngày: {new Date(activeApp.appliedAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300">Trạng thái:</span>
                            <span className="px-3 py-1 text-xs font-bold bg-[#2563EB] text-white rounded-lg">
                              {activeApp.currentStage || "APPLIED"}
                            </span>
                          </div>
                        </div>

                        {/* 2 COLUMNS INLINE SPLIT LAYOUT */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* ==================== CỘT BÊN TRÁI: HỒ SƠ ỨNG VIÊN (CANDIDATE PROFILE) ==================== */}
                          <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-[#1F2937]">
                              <User className="w-5 h-5 text-[#2563EB]" />
                              <h4 className="font-extrabold text-base">I. Thông tin Hồ sơ Ứng viên (Candidate Profile)</h4>
                            </div>

                            {/* 1. Header Info */}
                            <div className="p-4 bg-[#EFF6FF]/50 border border-blue-100 rounded-xl space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-md">
                                  {user?.fullName?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-[#1F2937] text-base">{user?.fullName || "Ứng viên"}</h4>
                                  <p className="text-xs text-[#2563EB] font-bold">{cand?.desiredTitle || "Ứng viên Frontend"}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-blue-100">
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{user?.phone || "Chưa cập nhật SĐT"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Lương kỳ vọng: <strong>{cand?.expectedMinSalary ? `${cand.expectedMinSalary} - ${cand.expectedMaxSalary} VNĐ` : "Thỏa thuận"}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Mô hình: <strong>{cand?.preferredModel || "On-site / Hybrid"}</strong></span>
                                </div>
                              </div>

                              {cand?.professionalSummary && (
                                <div className="pt-2 border-t border-blue-100 text-xs">
                                  <span className="font-bold text-slate-700 block mb-1">Tóm tắt bản thân:</span>
                                  <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-blue-100">{cand.professionalSummary}</p>
                                </div>
                              )}
                            </div>

                            {/* 2. Kinh nghiệm làm việc (Work Experience) */}
                            <div className="space-y-3">
                              <h5 className="text-xs font-extrabold text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-[#2563EB]" /> Kinh nghiệm làm việc ({workExps.length})
                              </h5>
                              {workExps.length > 0 ? (
                                <div className="space-y-3">
                                  {workExps.map((exp: any, i: number) => (
                                    <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <h6 className="font-bold text-xs text-[#1F2937]">{exp.positionTitle}</h6>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2563EB]">
                                          {exp.startDate ? format(new Date(exp.startDate), "MM/yyyy") : ""} - {exp.isCurrent ? "Hiện tại" : (exp.endDate ? format(new Date(exp.endDate), "MM/yyyy") : "")}
                                        </span>
                                      </div>
                                      <p className="text-xs font-semibold text-[#2563EB]">{exp.companyName}</p>
                                      {exp.description && (
                                        <p className="text-xs text-slate-600 leading-relaxed pt-1">{exp.description}</p>
                                      )}
                                      {exp.achievements && (
                                        <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                          🏆 Thành tựu: {exp.achievements}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa khai báo kinh nghiệm làm việc.</p>
                              )}
                            </div>

                            {/* 3. Dự án thực tế (Projects) */}
                            <div className="space-y-3">
                              <h5 className="text-xs font-extrabold text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                                <FolderGit2 className="w-4 h-4 text-[#2563EB]" /> Dự án nổi bật ({projects.length})
                              </h5>
                              {projects.length > 0 ? (
                                <div className="space-y-3">
                                  {projects.map((proj: any, i: number) => (
                                    <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h6 className="font-bold text-xs text-[#1F2937]">{proj.projectName}</h6>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">{proj.projectRole}</span>
                                      </div>
                                      {proj.description && (
                                        <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                                      )}
                                      {proj.technologies && proj.technologies.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {proj.technologies.map((tech: string, tIdx: number) => (
                                            <span key={tIdx} className="px-2 py-0.5 text-[10px] font-bold bg-white text-slate-700 rounded border border-slate-200">
                                              {tech}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa khai báo dự án.</p>
                              )}
                            </div>

                            {/* 4. Học vấn & Chứng chỉ */}
                            <div className="space-y-3">
                              <h5 className="text-xs font-extrabold text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-[#2563EB]" /> Học vấn &amp; Trình độ ({educations.length})
                              </h5>
                              {educations.length > 0 ? (
                                <div className="space-y-2">
                                  {educations.map((edu: any, i: number) => (
                                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                      <div className="flex justify-between font-bold text-[#1F2937]">
                                        <span>🎓 {edu.schoolName}</span>
                                        <span className="text-slate-500 font-normal text-[10px]">{edu.degree}</span>
                                      </div>
                                      <p className="text-slate-600">Chuyên ngành: <strong>{edu.major}</strong></p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa khai báo học vấn.</p>
                              )}
                            </div>

                            {/* 5. Kỹ năng ứng viên tự khai báo */}
                            <div className="space-y-3">
                              <h5 className="text-xs font-extrabold text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                                <Code className="w-4 h-4 text-[#2563EB]" /> Danh sách Kỹ năng khai báo ({skills.length})
                              </h5>
                              {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                  {skills.map((sk: any, i: number) => (
                                    <span key={i} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white text-slate-800 border border-slate-300 shadow-2xs">
                                      {sk.skill?.name || "Kỹ năng"} <span className="text-[10px] text-[#2563EB] font-mono">({sk.proficiencyLevel})</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa khai báo kỹ năng.</p>
                              )}
                            </div>
                          </div>

                          {/* ==================== CỘT BÊN PHẢI: GIẢI THÍCH & ĐÁNH GIÁ AI (AI EXPLANATION) ==================== */}
                          <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-[#1F2937]">
                              <Sparkles className="w-5 h-5 text-[#2563EB]" />
                              <h4 className="font-extrabold text-base">II. Đánh giá &amp; Giải thích Chi tiết từ AI Engine</h4>
                            </div>

                            {/* 1. Score Header Card */}
                            <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Tổng Điểm AI Matching</span>
                                <div className="flex items-baseline gap-2 mt-1">
                                  <span className={`text-3xl font-black ${
                                    score >= (job.autoShortlistThreshold || 80) ? "text-emerald-600" :
                                    score < (job.autoRejectThreshold || 40) ? "text-rose-600" : "text-amber-500"
                                  }`}>
                                    {score}
                                  </span>
                                  <span className="text-sm font-bold text-slate-400">/ 100 ĐIỂM</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5">
                                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                                  aiResult?.matchLevel === "HIGH" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                                  aiResult?.matchLevel === "MEDIUM" ? "bg-amber-100 text-amber-800 border-amber-300" :
                                  "bg-rose-100 text-rose-800 border-rose-300"
                                }`}>
                                  Mức độ: {aiResult?.matchLevel || "UNDETERMINED"}
                                </span>

                                {aiResult?.confidenceScore !== undefined && (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    Độ tin cậy AI: {Math.round(Number(aiResult.confidenceScore) * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 2. Score Breakdown 4 Pillars */}
                            <div className="space-y-2">
                              <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Phân rã Trọng số (Score Breakdown)</h5>
                              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                <div className="p-3 bg-white border border-blue-200 rounded-xl shadow-2xs">
                                  <span className="text-[10px] text-slate-500 block font-bold">Kỹ năng ({job.skillWeight || 40}%)</span>
                                  <span className="text-base font-black text-[#2563EB]">{aiResult ? Math.round(Number(aiResult.skillScore)) : 0}%</span>
                                </div>
                                <div className="p-3 bg-white border border-blue-200 rounded-xl shadow-2xs">
                                  <span className="text-[10px] text-slate-500 block font-bold">Kinh nghiệm ({job.experienceWeight || 30}%)</span>
                                  <span className="text-base font-black text-[#2563EB]">{aiResult ? Math.round(Number(aiResult.experienceScore)) : 0}%</span>
                                </div>
                                <div className="p-3 bg-white border border-blue-200 rounded-xl shadow-2xs">
                                  <span className="text-[10px] text-slate-500 block font-bold">Học vấn ({job.educationWeight || 15}%)</span>
                                  <span className="text-base font-black text-[#2563EB]">{aiResult ? Math.round(Number(aiResult.educationScore)) : 0}%</span>
                                </div>
                                <div className="p-3 bg-white border border-blue-200 rounded-xl shadow-2xs">
                                  <span className="text-[10px] text-slate-500 block font-bold">Ngoại ngữ / Chứng chỉ ({job.otherWeight || 15}%)</span>
                                  <span className="text-base font-black text-[#2563EB]">{aiResult ? Math.round(Number(aiResult.projectScore)) : 0}%</span>
                                </div>
                              </div>
                            </div>

                            {/* 3. Skill Matching & Evidence Tooltips */}
                            <div className="space-y-3">
                              <h5 className="text-xs font-extrabold text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                                <Code className="w-4 h-4 text-[#2563EB]" /> Đối chiếu Kỹ năng thực tế (Skill Matching)
                              </h5>
                              
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                {/* Matched Skills with Hover Evidence */}
                                <div>
                                  <span className="text-xs font-bold text-emerald-800 block mb-1.5">✓ Kỹ năng đáp ứng thành công (Matched):</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(aiResult?.matchedSkills || []).map((sk: any, i: number) => {
                                      const ev = (aiResult?.evidence || []).find((e: any) => e.skillName === sk.name);
                                      return (
                                        <div key={i} className="group relative inline-block">
                                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-help flex items-center gap-1 shadow-2xs">
                                            ✓ {sk.name}
                                          </span>
                                          {ev && (
                                            <div className="absolute z-50 left-0 bottom-full mb-1.5 hidden group-hover:block w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none">
                                              <p className="font-bold text-blue-400 mb-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Bằng chứng từ: {ev.source}
                                              </p>
                                              <p className="italic text-slate-300 leading-relaxed">"...{ev.evidenceText}..."</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Missing Skills */}
                                {(aiResult?.missingSkills || []).length > 0 && (
                                  <div className="pt-2 border-t border-slate-200">
                                    <span className="text-xs font-bold text-rose-700 block mb-1.5">✕ Kỹ năng còn thiếu (Missing):</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(aiResult?.missingSkills || []).map((sk: any, i: number) => (
                                        <span key={i} className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                                          sk.isMandatory
                                            ? "bg-rose-100 text-rose-800 border-rose-300"
                                            : "bg-amber-100 text-amber-800 border-amber-300"
                                        }`}>
                                          ✕ {sk.name} {sk.isMandatory ? "(Bắt buộc)" : "(Tùy chọn)"}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 4. Strengths & Gaps Analysis */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Strengths */}
                              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                                <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                                  <ThumbsUp className="w-4 h-4 text-emerald-600" /> Điểm mạnh nổi bật (Strengths)
                                </span>
                                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-medium">
                                  {(aiResult?.strengths || []).map((str: string, i: number) => (
                                    <li key={i}>{str}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Gaps */}
                              <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2">
                                <span className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                                  <ThumbsDown className="w-4 h-4 text-rose-600" /> Điểm hạn chế (Gaps)
                                </span>
                                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-medium">
                                  {(aiResult?.gaps || []).map((gap: string, i: number) => (
                                    <li key={i}>{gap}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* 5. AI Reasoning Summary */}
                            <div className="space-y-2">
                              <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Lý giải Chi tiết của AI Engine</h5>
                              <p className="text-xs text-slate-700 leading-relaxed p-4 bg-[#EFF6FF] border border-blue-200 rounded-xl font-medium">
                                💬 {aiResult?.reasoningSummary || "AI đã đánh giá tổng quan dựa trên các trọng số kỹ năng và tiêu chí công việc."}
                              </p>
                            </div>

                          </div>

                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <User className="w-10 h-10 mx-auto text-[#2563EB]/60" />
              <h4 className="text-base font-bold text-[#1F2937]">Chưa có hồ sơ ứng viên nộp vào bài đăng này</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Khi ứng viên ứng tuyển, AI sẽ tự động đọc hồ sơ đã được cập nhật của ứng viên để tính điểm và hiển thị danh sách xếp hạng tại đây.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
