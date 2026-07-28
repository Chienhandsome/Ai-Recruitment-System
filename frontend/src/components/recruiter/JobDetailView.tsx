"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Edit, Trash2, CheckCircle2, Bot, MapPin, Briefcase, 
  DollarSign, Clock, FileText, Award, HelpCircle, User, Sparkles, Filter, Search 
} from "lucide-react";
import { JobPostingData, getRecruiterJobDetail, deleteRecruiterJob, updateRecruiterJob } from "@/lib/recruiter-api";
import { CandidateDetailModal, CandidateEvaluationData } from "./CandidateDetailModal";
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
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateEvaluationData | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [searchCandidate, setSearchCandidate] = useState("");

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const data = await getRecruiterJobDetail(token, jobId);
      setJob(data);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-slate-500">
        Không tìm thấy thông tin bài tuyển dụng.
        <button onClick={onBack} className="block mx-auto mt-4 text-indigo-600 font-medium underline">Quay lại danh sách</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121620] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại Danh sách Bài tuyển dụng
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Phòng ban: <strong>{job.department?.name || "Chưa xếp"}</strong> • Tạo ngày: {new Date(job.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2">
          {job.status === "DRAFT" && (
            <button 
              onClick={() => handleStatusChange("PUBLISHED")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              Xuất bản (Publish)
            </button>
          )}
          {job.status === "PUBLISHED" && (
            <button 
              onClick={() => handleStatusChange("CLOSED")}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
            >
              Đóng tuyển dụng
            </button>
          )}
          <button 
            onClick={() => onEdit(job)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-500/20 transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa JD
          </button>
          {job.status === "DRAFT" && (
            <button 
              onClick={handleDelete}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Xóa bài nháp"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "info"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          1. Thông tin Chi tiết JD (Job Information)
        </button>
        <button
          onClick={() => setActiveTab("candidates")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "candidates"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          2. Đánh giá Ứng viên AI (AI Candidate Evaluation)
          <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
            {job._count?.applications || 0}
          </span>
        </button>
      </div>

      {/* TAB 1: Job Information */}
      {activeTab === "info" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Description & Requirements */}
            <div className="bg-white dark:bg-[#121620] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 pb-3">Mô tả công việc</h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>

            {job.requirements && (
              <div className="bg-white dark:bg-[#121620] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 pb-3">Yêu cầu công việc</h3>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Required Skills Section */}
            {job.jobSkills && job.jobSkills.length > 0 && (
              <div className="bg-white dark:bg-[#121620] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 pb-3 flex items-center justify-between">
                  <span>Kỹ năng Yêu cầu Đính kèm ({job.jobSkills.length})</span>
                  <span className="text-xs font-normal text-slate-500">Được mã hóa để AI So khớp Chấm điểm</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.jobSkills.map((sk, idx) => (
                    <div key={idx} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                      sk.requirementType === 'MANDATORY' 
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/50' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50'
                    }`}>
                      <span>{sk.skill?.name || "Kỹ năng"}</span>
                      <span className="text-[10px] opacity-75 uppercase">({sk.requirementType === 'MANDATORY' ? 'Bắt buộc' : 'Ưu tiên'})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Meta & AI Configurations */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#121620] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 pb-3">Tổng quan Yêu cầu</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ngành nghề:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {job.category?.name || "Chưa phân loại"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mức lương:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {job.minSalary && job.maxSalary ? `${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()} ${job.currency}` : "Thỏa thuận"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mô hình làm việc:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{job.workingModel || "On-site"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hình thức tuyển:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{job.employmentType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kinh nghiệm yêu cầu:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {job.requiredExperienceYears ? `${job.requiredExperienceYears} năm` : "Không yêu cầu"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hạn nộp hồ sơ:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {job.expiryDate ? format(new Date(job.expiryDate), "dd/MM/yyyy") : "Vô thời hạn"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Yêu cầu Bằng chứng:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{job.requiresProofOfWork ? `Có (${job.proofOfWorkType})` : "Không"}</span>
                </div>
              </div>
            </div>

            {/* Required Certificates */}
            {job.jobCertificates && job.jobCertificates.length > 0 && (
              <div className="bg-white dark:bg-[#121620] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" /> Chứng chỉ Yêu cầu
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.jobCertificates.map((c: { certificateName: string }, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/20">
                      📜 {c.certificateName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Configuration */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/5 dark:to-purple-500/5 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600" /> Cấu hình Trợ lý AI
              </h3>
              <div className="space-y-2 text-xs text-indigo-800 dark:text-indigo-300">
                <div className="flex justify-between">
                  <span>Ngưỡng Đạt tiêu chuẩn:</span>
                  <span className="font-bold">{job.autoShortlistThreshold || 85} / 100 điểm</span>
                </div>
                <div className="flex justify-between">
                  <span>Trọng số Kỹ năng:</span>
                  <span className="font-bold">{job.skillWeight || 40}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Trọng số Kinh nghiệm:</span>
                  <span className="font-bold">{job.experienceWeight || 30}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI Candidate Evaluation */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-[#121620] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm ứng viên..."
                value={searchCandidate}
                onChange={(e) => setSearchCandidate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500">Hệ thống xếp hạng ứng viên dựa trên dữ liệu Hồ sơ được ứng viên cập nhật.</span>
          </div>

          <div className="p-12 text-center bg-white dark:bg-[#121620] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
            <User className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Chưa có hồ sơ ứng viên nộp vào bài đăng này</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Khi ứng viên ứng tuyển, AI sẽ tự động đọc hồ sơ đã được cập nhật của ứng viên để tính điểm và hiển thị danh sách xếp hạng tại đây.
            </p>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        candidate={selectedCandidate}
      />
    </div>
  );
}
