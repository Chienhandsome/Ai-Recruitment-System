"use client";

import React, { useState } from "react";
import { X, ChevronRight, ChevronLeft, Bot, CheckCircle2, Settings2, Plus, Trash2 } from "lucide-react";
import { createRecruiterJob } from "@/lib/recruiter-api";

interface CreateJobWizardProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

export function CreateJobWizard({ isOpen, onClose, token, onSuccess }: CreateJobWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    departmentId: "",
    employmentType: "FULL_TIME",
    experienceLevel: "JUNIOR",
    minSalary: "",
    maxSalary: "",
    currency: "VND",
    location: "",
    description: "",
    requirements: "",
    benefits: "",
    certificates: [] as { certificateName: string; requirementType: string }[],
    workingModel: "ON_SITE",
    requiresProofOfWork: false,
    proofOfWorkType: "PORTFOLIO",
    screeningQuestions: [] as { questionText: string; isRequired: boolean }[],
    autoShortlistThreshold: 85,
    autoRejectThreshold: 40,
    rejectOnMissingMandatory: true,
    skillWeight: 40,
    experienceWeight: 30,
    educationWeight: 15,
    otherWeight: 15,
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addCertificate = () => {
    setFormData(prev => ({
      ...prev,
      certificates: [...prev.certificates, { certificateName: "", requirementType: "MANDATORY" }]
    }));
  };

  const updateCertificate = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newCerts = [...prev.certificates];
      newCerts[index] = { ...newCerts[index], [field]: value };
      return { ...prev, certificates: newCerts };
    });
  };

  const removeCertificate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      screeningQuestions: [...prev.screeningQuestions, { questionText: "", isRequired: true }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newQs = [...prev.screeningQuestions];
      newQs[index] = { ...newQs[index], [field]: value };
      return { ...prev, screeningQuestions: newQs };
    });
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        departmentId: formData.departmentId?.trim() ? formData.departmentId : undefined,
        minSalary: formData.minSalary ? Number(formData.minSalary) : undefined,
        maxSalary: formData.maxSalary ? Number(formData.maxSalary) : undefined,
        autoShortlistThreshold: Number(formData.autoShortlistThreshold),
        autoRejectThreshold: formData.autoRejectThreshold ? Number(formData.autoRejectThreshold) : undefined,
        skillWeight: Number(formData.skillWeight),
        experienceWeight: Number(formData.experienceWeight),
        educationWeight: Number(formData.educationWeight),
        otherWeight: Number(formData.otherWeight),
        certificates: formData.certificates.filter(c => c.certificateName.trim().length > 0),
        screeningQuestions: formData.screeningQuestions.filter(q => q.questionText.trim().length > 0),
      };
      await createRecruiterJob(token, payload);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(`Tạo Job thất bại: ${err?.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
      <div className="bg-white dark:bg-[#121620] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/60">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tạo Bài tuyển dụng mới</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step >= 1 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-500'}`}>1. Cơ bản</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step >= 2 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-500'}`}>2. Chi tiết</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step >= 3 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-500'}`}>3. AI & Kỹ năng</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vị trí tuyển dụng <span className="text-red-500">*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="VD: Senior Frontend Engineer" className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hình thức</label>
                  <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white">
                    <option value="FULL_TIME">Toàn thời gian</option>
                    <option value="PART_TIME">Bán thời gian</option>
                    <option value="CONTRACT">Hợp đồng</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="INTERNSHIP">Thực tập</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cấp bậc</label>
                  <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white">
                    <option value="INTERN">Intern</option>
                    <option value="FRESHER">Fresher</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="MID">Mid-level</option>
                    <option value="SENIOR">Senior</option>
                    <option value="LEAD">Lead</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lương tối thiểu</label>
                  <input type="number" name="minSalary" value={formData.minSalary} onChange={handleChange} placeholder="VD: 10000000" className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lương tối đa</label>
                  <input type="number" name="maxSalary" value={formData.maxSalary} onChange={handleChange} placeholder="VD: 25000000" className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiền tệ</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white">
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Địa điểm làm việc</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="VD: Hà Nội, Hồ Chí Minh..." className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mô hình làm việc (Working Model)</label>
                  <select name="workingModel" value={formData.workingModel} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white">
                    <option value="ON_SITE">Tập trung (On-site)</option>
                    <option value="HYBRID">Kết hợp (Hybrid)</option>
                    <option value="REMOTE">Từ xa (Remote)</option>
                    <option value="SHIFT">Theo ca (Shift Work)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả công việc <span className="text-red-500">*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none" placeholder="Nhập mô tả tổng quan công việc..."></textarea>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Yêu cầu công việc</label>
                <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={5} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none" placeholder="- Kinh nghiệm X năm...&#10;- Bằng cấp..."></textarea>
              </div>
              {/* Proof of work section */}
              <div className="p-4 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">Yêu cầu Bằng chứng năng lực / Portfolio (Proof of Work)</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Bắt buộc ứng viên nộp Link sản phẩm/Portfolio/GitHub/Báo cáo khi ứng tuyển</span>
                  </div>
                  <input type="checkbox" name="requiresProofOfWork" checked={formData.requiresProofOfWork} onChange={handleChange} className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                </label>
                
                {formData.requiresProofOfWork && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Loại sản phẩm bắt buộc:</label>
                    <select name="proofOfWorkType" value={formData.proofOfWorkType} onChange={handleChange} className="px-3 py-1.5 text-sm bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white">
                      <option value="PORTFOLIO">Portfolio / Showreel (ArtStation, Behance, Vimeo...)</option>
                      <option value="CODE_REPOSITORY">Code Repository (GitHub, GitLab...)</option>
                      <option value="CASE_STUDY">Case Study / Chiến dịch (Marketing, Sales...)</option>
                      <option value="SALES_RECORD">Báo cáo Doanh số / KPI thành tích</option>
                      <option value="PUBLICATION">Bài báo / Văn bản pháp lý / Nghiên cứu</option>
                      <option value="CERTIFICATE_DOC">File Giấy phép hành nghề / Bằng cấp</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Required Certificates section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Chứng chỉ / Giấy phép yêu cầu (Certificates & Licenses)</label>
                  <button type="button" onClick={addCertificate} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Thêm chứng chỉ
                  </button>
                </div>
                {formData.certificates.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input 
                      type="text" 
                      placeholder="Tên chứng chỉ (VD: AWS Certified, CPA, Bằng lái FC...)" 
                      value={cert.certificateName}
                      onChange={(e) => updateCertificate(index, 'certificateName', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                    <select
                      value={cert.requirementType}
                      onChange={(e) => updateCertificate(index, 'requirementType', e.target.value)}
                      className="w-32 px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                      <option value="MANDATORY">Bắt buộc</option>
                      <option value="PREFERRED">Ưu tiên</option>
                      <option value="NICE_TO_HAVE">Điểm cộng</option>
                    </select>
                    <button type="button" onClick={() => removeCertificate(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Screening Questions section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Câu hỏi sàng lọc ứng viên (Screening Questions)</label>
                    <span className="text-xs text-slate-500">Tạo các câu hỏi điều kiện để ứng viên trả lời khi nộp CV</span>
                  </div>
                  <button type="button" onClick={addQuestion} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Thêm câu hỏi
                  </button>
                </div>
                {formData.screeningQuestions.map((q, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input 
                      type="text" 
                      placeholder="VD: Bạn đã có giấy phép hành nghề / kinh nghiệm quản lý chưa?" 
                      value={q.questionText}
                      onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={q.isRequired}
                        onChange={(e) => updateQuestion(index, 'isRequired', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      Bắt buộc
                    </label>
                    <button type="button" onClick={() => removeQuestion(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex gap-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Cấu hình Trợ lý AI Chấm điểm</h4>
                  <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mt-1">
                    AI sẽ phân tích CV, tính điểm và gợi ý danh sách <strong>Ứng viên Đạt tiêu chuẩn</strong>. Quyết định loại hay mời phỏng vấn hoàn toàn do Nhà tuyển dụng phê duyệt.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Threshold */}
                <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Ngưỡng điểm Đạt tiêu chuẩn</h5>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ứng viên có điểm AI $\ge$ mức này sẽ được tự động xếp vào danh sách <strong>"Ứng viên Tiềm năng (Shortlisted)"</strong> để Nhà tuyển dụng ưu tiên xem xét trước.
                  </p>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ngưỡng điểm Đạt (Passing Score)</label>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formData.autoShortlistThreshold} / 100 điểm</span>
                    </div>
                    <input 
                      type="range" 
                      name="autoShortlistThreshold" 
                      min="50" 
                      max="95" 
                      value={formData.autoShortlistThreshold} 
                      onChange={handleChange} 
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600" 
                    />
                  </div>
                  
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                    💡 <strong>Nguyên tắc An toàn:</strong> AI không bao giờ tự động gửi thư từ chối hay tự loại ứng viên. Mọi CV nộp vào đều được lưu trữ để Nhà tuyển dụng đánh giá thủ công nếu muốn.
                  </div>
                </div>

                {/* Weights */}
                <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <h5 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Trọng số chấm điểm (%)</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Kỹ năng</label>
                      <input type="number" name="skillWeight" value={formData.skillWeight} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Kinh nghiệm</label>
                      <input type="number" name="experienceWeight" value={formData.experienceWeight} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Học vấn & Bằng cấp</label>
                      <input type="number" name="educationWeight" value={formData.educationWeight} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Tiêu chí khác</label>
                      <input type="number" name="otherWeight" value={formData.otherWeight} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  {(Number(formData.skillWeight) + Number(formData.experienceWeight) + Number(formData.educationWeight) + Number(formData.otherWeight)) !== 100 && (
                    <p className="text-xs text-rose-500 font-medium">Tổng trọng số phải bằng 100% (Hiện tại: {Number(formData.skillWeight) + Number(formData.experienceWeight) + Number(formData.educationWeight) + Number(formData.otherWeight)}%)</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
          {step > 1 ? (
            <button onClick={handlePrev} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Quay lại
            </button>
          ) : <div></div>}

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Hủy
            </button>
            {step < 3 ? (
              <button 
                onClick={handleNext}
                disabled={step === 1 && !formData.title}
                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp tục
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading && <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
                Lưu thành bản nháp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
