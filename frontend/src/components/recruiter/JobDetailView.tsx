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
          className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "info"
              ? "bg-[#2563EB] text-white shadow-md"
              : "text-[#1F2937] hover:text-[#2563EB]"
          }`}
        >
          1. Thông tin Chi tiết JD (Job Information)
        </button>
        <button
          onClick={() => setActiveTab("candidates")}
          className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "candidates"
              ? "bg-[#2563EB] text-white shadow-md"
              : "text-[#1F2937] hover:text-[#2563EB]"
          }`}
        >
          2. Đánh giá Ứng viên AI (AI Candidate Evaluation)
          <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${activeTab === "candidates" ? "bg-white text-[#2563EB]" : "bg-blue-100 text-[#2563EB]"}`}>
            {job._count?.applications || 0}
          </span>
        </button>
      </div>

      {/* TAB 1: Job Information */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-[#1F2937] border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563EB]" /> Mô tả công việc
              </h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#1F2937] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB]" /> Yêu cầu công việc
                </h3>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Benefits */}
            {(job as any).benefits && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#1F2937] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" /> Quyền lợi & Phúc lợi
                </h3>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {(job as any).benefits}
                </div>
              </div>
            )}

            {/* Required Skills Section */}
            {job.jobSkills && job.jobSkills.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#1F2937] border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#2563EB]" /> Kỹ năng Yêu cầu Đính kèm ({job.jobSkills.length})
                  </span>
                  <span className="text-xs font-normal text-slate-500">Đã mã hóa cho AI chấm điểm</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.jobSkills.map((sk, idx) => (
                    <div key={idx} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                      sk.requirementType === 'MANDATORY' 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
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
            {/* Overview Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-[#1F2937] border-b border-slate-100 pb-3">Tổng quan Yêu cầu</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ngành nghề tuyển dụng:</span>
                  <span className="font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {job.category?.name || "Chưa phân loại"}
                  </span>
                </div>


                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mức lương:</span>
                  <span className="font-bold text-emerald-600">
                    {job.minSalary || job.maxSalary 
                      ? `${job.minSalary ? Number(job.minSalary).toLocaleString() : '0'} ${job.maxSalary ? '- ' + Number(job.maxSalary).toLocaleString() : ''} ${job.currency || 'VND'}`
                      : "Thỏa thuận"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Cấp bậc (Level):</span>
                  <span className="font-bold text-[#1F2937]">{(job as any).experienceLevel || "Không yêu cầu"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mô hình làm việc:</span>
                  <span className="font-bold text-[#1F2937]">
                    {job.workingModel === "ON_SITE" ? "Tại văn phòng (On-site)" :
                     job.workingModel === "HYBRID" ? "Kết hợp (Hybrid)" :
                     job.workingModel === "REMOTE" ? "Làm từ xa (Remote)" : job.workingModel || "On-site"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hình thức tuyển:</span>
                  <span className="font-bold text-[#1F2937]">
                    {job.employmentType === "FULL_TIME" ? "Toàn thời gian" :
                     job.employmentType === "PART_TIME" ? "Bán thời gian" :
                     job.employmentType === "CONTRACT" ? "Hợp đồng" :
                     job.employmentType === "INTERNSHIP" ? "Thực tập" : job.employmentType}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kinh nghiệm tối thiểu:</span>
                  <span className="font-bold text-[#1F2937]">
                    {job.requiredExperienceYears ? `${job.requiredExperienceYears} năm` : "Chưa yêu cầu"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hạn nộp hồ sơ:</span>
                  <span className="font-bold text-rose-600">
                    {job.expiryDate ? format(new Date(job.expiryDate), "dd/MM/yyyy") : "Vô thời hạn"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Bằng chứng năng lực:</span>
                  <span className="font-bold text-[#2563EB]">
                    {job.requiresProofOfWork ? `Có (${job.proofOfWorkType || 'PORTFOLIO'})` : "Không"}
                  </span>
                </div>
              </div>
            </div>

            {/* Required Certificates */}
            {job.jobCertificates && job.jobCertificates.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#2563EB]" /> Chứng chỉ Yêu cầu ({job.jobCertificates.length})
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.jobCertificates.map((c: { certificateName: string }, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 text-xs rounded-lg bg-[#EFF6FF] text-[#2563EB] font-bold border border-blue-200">
                      📜 {c.certificateName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Configuration Box */}
            <div className="bg-[#EFF6FF] p-6 rounded-2xl border border-blue-200 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2 border-b border-blue-100 pb-2">
                <Bot className="w-4 h-4 text-[#2563EB]" /> Cấu hình Trợ lý AI Chấm điểm
              </h3>
              
              <div className="space-y-2.5 text-xs text-[#1F2937]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ngưỡng Tự động Đạt:</span>
                  <span className="font-extrabold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-blue-200">
                    ≥ {job.autoShortlistThreshold || 85} / 100 điểm
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ngưỡng Tự động Loại:</span>
                  <span className="font-extrabold text-rose-600 bg-white px-2 py-0.5 rounded border border-rose-200">
                    &lt; {job.autoRejectThreshold || 40} điểm
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Loại khi thiếu Kỹ năng bắt buộc:</span>
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
                    <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                      <span className="text-slate-500">Khác:</span>
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
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#3B82F6]" />
              <input
                type="text"
                placeholder="Tìm kiếm ứng viên..."
                value={searchCandidate}
                onChange={(e) => setSearchCandidate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#EFF6FF] border border-blue-200 rounded-lg outline-none text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">Hệ thống xếp hạng ứng viên dựa trên dữ liệu Hồ sơ được ứng viên cập nhật.</span>
          </div>

          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <User className="w-10 h-10 mx-auto text-[#2563EB]/60" />
            <h4 className="text-base font-bold text-[#1F2937]">Chưa có hồ sơ ứng viên nộp vào bài đăng này</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
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
