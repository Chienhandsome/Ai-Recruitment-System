"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Bot, CheckCircle2, Settings2, Plus, Trash2, Tag, Sparkles } from "lucide-react";
import { 
  createRecruiterJob, updateRecruiterJob, JobPostingData, 
  getJobCategories, getSkillsByCategory, createCustomSkill, 
  JobCategoryData, SkillItemData 
} from "@/lib/recruiter-api";

interface CreateJobWizardProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
  initialJobData?: JobPostingData | null;
}

const LEVEL_YEAR_GUIDANCE: Record<string, [number, number | null]> = {
  INTERN: [0, 1],
  FRESHER: [0, 1],
  JUNIOR: [1, 3],
  MIDDLE: [2, 5],
  SENIOR: [4, null],
  LEAD: [6, null],
  MANAGER: [5, null],
  DIRECTOR: [8, null],
};

export function CreateJobWizard({ isOpen, onClose, token, onSuccess, initialJobData }: CreateJobWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    status: "DRAFT",
    departmentId: "",
    employmentType: "FULL_TIME",
    experienceLevel: "JUNIOR",
    levelRequirementMode: "ADVISORY",
    minSalary: "",
    maxSalary: "",
    currency: "VND",
    location: "",
    description: "",
    requirements: "",
    benefits: "",
    categoryId: "",
    certificates: [] as { certificateName: string; requirementType: string }[],
    selectedSkills: [] as { skillId: string; skillName: string; requirementType: string }[],
    workingModel: "ON_SITE",
    requiresProofOfWork: false,
    proofOfWorkType: "PORTFOLIO",
    requiredExperienceYears: "",
    expiryDate: "",
    autoShortlistThreshold: 85,
    autoRejectThreshold: 40,
    rejectOnMissingMandatory: true,
    skillWeight: 40,
    experienceWeight: 30,
    educationWeight: 15,
    otherWeight: 15,
  });

  const [categories, setCategories] = useState<JobCategoryData[]>([]);
  const [availableSkills, setAvailableSkills] = useState<SkillItemData[]>([]);
  const [customSkillName, setCustomSkillName] = useState("");
  const [creatingSkill, setCreatingSkill] = useState(false);

  useEffect(() => {
    getJobCategories().then(cats => {
      setCategories(cats);
      if (!initialJobData && cats.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    });
  }, []);

  useEffect(() => {
    if (formData.categoryId) {
      getSkillsByCategory(formData.categoryId).then(skills => setAvailableSkills(skills));
    }
  }, [formData.categoryId]);

  useEffect(() => {
    if (initialJobData) {
      setFormData({
        title: initialJobData.title || "",
        status: initialJobData.status || "DRAFT",
        departmentId: initialJobData.departmentId || "",
        categoryId: initialJobData.categoryId || "",
        employmentType: initialJobData.employmentType || "FULL_TIME",
        experienceLevel: (initialJobData as any).experienceLevel || "JUNIOR",
        levelRequirementMode: initialJobData.levelRequirementMode || "ADVISORY",
        minSalary: initialJobData.minSalary ? String(initialJobData.minSalary) : "",
        maxSalary: initialJobData.maxSalary ? String(initialJobData.maxSalary) : "",
        currency: initialJobData.currency || "VND",
        location: initialJobData.location || "",
        description: initialJobData.description || "",
        requirements: initialJobData.requirements || "",
        benefits: (initialJobData as any).benefits || "",
        certificates: initialJobData.jobCertificates?.map(c => ({
          certificateName: c.certificateName,
          requirementType: c.requirementType || "MANDATORY"
        })) || [],
        selectedSkills: initialJobData.jobSkills?.map(s => ({
          skillId: s.skillId,
          skillName: s.skill?.name || "Kỹ năng",
          requirementType: s.requirementType || "MANDATORY"
        })) || [],
        workingModel: initialJobData.workingModel || "ON_SITE",
        requiresProofOfWork: initialJobData.requiresProofOfWork || false,
        proofOfWorkType: initialJobData.proofOfWorkType || "PORTFOLIO",
        requiredExperienceYears: initialJobData.requiredExperienceYears ? String(initialJobData.requiredExperienceYears) : "",
        expiryDate: initialJobData.expiryDate ? new Date(initialJobData.expiryDate).toISOString().split("T")[0] : "",
        autoShortlistThreshold: initialJobData.autoShortlistThreshold || 85,
        autoRejectThreshold: initialJobData.autoRejectThreshold || 40,
        rejectOnMissingMandatory: initialJobData.rejectOnMissingMandatory ?? true,
        skillWeight: initialJobData.skillWeight || 40,
        experienceWeight: initialJobData.experienceWeight || 30,
        educationWeight: initialJobData.educationWeight || 15,
        otherWeight: initialJobData.otherWeight || 15,
      });
    }
  }, [initialJobData]);

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

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const requiredYears = Number(formData.requiredExperienceYears);
  const [suggestedMinYears, suggestedMaxYears] =
    LEVEL_YEAR_GUIDANCE[formData.experienceLevel] || [0, null];
  const hasLevelYearsWarning =
    formData.requiredExperienceYears !== "" &&
    (requiredYears < suggestedMinYears ||
      (suggestedMaxYears !== null && requiredYears > suggestedMaxYears));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        departmentId: formData.departmentId?.trim() ? formData.departmentId : undefined,
        minSalary: formData.minSalary ? Number(formData.minSalary) : undefined,
        maxSalary: formData.maxSalary ? Number(formData.maxSalary) : undefined,
        requiredExperienceYears: formData.requiredExperienceYears ? Number(formData.requiredExperienceYears) : undefined,
        expiryDate: formData.expiryDate ? formData.expiryDate : undefined,
        autoShortlistThreshold: Number(formData.autoShortlistThreshold),
        autoRejectThreshold: formData.autoRejectThreshold ? Number(formData.autoRejectThreshold) : undefined,
        skillWeight: Number(formData.skillWeight),
        experienceWeight: Number(formData.experienceWeight),
        educationWeight: Number(formData.educationWeight),
        otherWeight: Number(formData.otherWeight),
        categoryId: formData.categoryId?.trim() ? formData.categoryId : undefined,
        skills: formData.selectedSkills.map(s => ({ skillId: s.skillId, requirementType: s.requirementType })),
        certificates: formData.certificates.filter(c => c.certificateName.trim().length > 0),
      };
      if (initialJobData) {
        await updateRecruiterJob(token, initialJobData.id, payload);
      } else {
        await createRecruiterJob(token, payload);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(`Thao tác thất bại: ${err?.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-[#1F2937]">
              {initialJobData ? "Chỉnh sửa Bài tuyển dụng" : "Tạo Bài tuyển dụng mới"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${step >= 1 ? 'bg-[#2563EB] text-white' : 'bg-[#EFF6FF] text-[#1F2937]'}`}>1. Cơ bản</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${step >= 2 ? 'bg-[#2563EB] text-white' : 'bg-[#EFF6FF] text-[#1F2937]'}`}>2. Chi tiết</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${step >= 3 ? 'bg-[#2563EB] text-white' : 'bg-[#EFF6FF] text-[#1F2937]'}`}>3. AI & Kỹ năng</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#1F2937] mb-1">Vị trí tuyển dụng <span className="text-red-500">*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="VD: Senior Frontend Engineer" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#1F2937] mb-1">Trạng thái bài tuyển dụng</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937] font-semibold">
                    <option value="DRAFT">Bản nháp (Draft)</option>
                    <option value="PUBLISHED">Đang mở tuyển dụng (Published)</option>
                    <option value="PAUSED">Tạm dừng (Paused)</option>
                    <option value="CLOSED">Đóng tuyển dụng (Closed)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1F2937] mb-1">Ngành nghề tuyển dụng (Job Category)</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937] font-medium">
                    <option value="">-- Chọn ngành nghề --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Hình thức</label>
                  <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]">
                    <option value="FULL_TIME">Toàn thời gian</option>
                    <option value="PART_TIME">Bán thời gian</option>
                    <option value="CONTRACT">Hợp đồng</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="INTERNSHIP">Thực tập</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Cấp bậc</label>
                  <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]">
                    <option value="INTERN">Intern</option>
                    <option value="FRESHER">Fresher</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="MIDDLE">Middle</option>
                    <option value="SENIOR">Senior</option>
                    <option value="LEAD">Lead</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DIRECTOR">Director</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Lương tối thiểu</label>
                  <input type="number" name="minSalary" value={formData.minSalary} onChange={handleChange} placeholder="VD: 10000000" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Lương tối đa</label>
                  <input type="number" name="maxSalary" value={formData.maxSalary} onChange={handleChange} placeholder="VD: 25000000" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Tiền tệ</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]">
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Địa điểm làm việc</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="VD: Hà Nội, Hồ Chí Minh..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Mô hình làm việc (Working Model)</label>
                  <select name="workingModel" value={formData.workingModel} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]">
                    <option value="ON_SITE">Làm tại văn phòng (On-site)</option>
                    <option value="HYBRID">Kết hợp (Hybrid)</option>
                    <option value="REMOTE">Làm từ xa (Remote)</option>
                    <option value="SHIFT">Theo ca (Shift Work)</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Cách áp dụng yêu cầu level</label>
                  <select name="levelRequirementMode" value={formData.levelRequirementMode} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937] font-semibold">
                    <option value="ADVISORY">Chỉ cảnh báo (khuyên dùng)</option>
                    <option value="REQUIRED">Điều kiện bắt buộc</option>
                  </select>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {formData.levelRequirementMode === "REQUIRED"
                    ? "Ứng viên thấp hơn level yêu cầu sẽ được đánh dấu không đủ điều kiện; recruiter vẫn là người đưa ra quyết định cuối cùng."
                    : "Level ảnh hưởng điểm kinh nghiệm và hiển thị cảnh báo, nhưng không loại ứng viên."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Kinh nghiệm tối thiểu (Số năm)</label>
                  <input type="number" min="0" name="requiredExperienceYears" value={formData.requiredExperienceYears} onChange={handleChange} placeholder="VD: 2" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]" />
                  {hasLevelYearsWarning && (
                    <p className="mt-1 text-[11px] font-medium text-amber-700">
                      Số năm này khác khoảng tham khảo của level {formData.experienceLevel}
                      {suggestedMaxYears === null
                        ? ` (từ ${suggestedMinYears} năm).`
                        : ` (${suggestedMinYears}–${suggestedMaxYears} năm).`} Hệ thống vẫn cho phép lưu.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">Hạn nộp hồ sơ (Expiry Date)</label>
                  <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Mô tả công việc <span className="text-red-500">*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937] resize-none" placeholder="Nhập mô tả tổng quan công việc..."></textarea>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Yêu cầu công việc</label>
                <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={5} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937] resize-none" placeholder="- Kinh nghiệm X năm...&#10;- Bằng cấp..."></textarea>
              </div>
              {/* Proof of work section */}
              <div className="p-4 bg-[#EFF6FF]/50 border border-blue-100 rounded-xl space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#1F2937] block">Yêu cầu Bằng chứng năng lực / Portfolio (Proof of Work)</span>
                    <span className="text-xs text-slate-500">Bắt buộc ứng viên nộp Link sản phẩm/Portfolio/GitHub/Báo cáo khi ứng tuyển</span>
                  </div>
                  <input type="checkbox" name="requiresProofOfWork" checked={formData.requiresProofOfWork} onChange={handleChange} className="w-5 h-5 text-[#2563EB] border-slate-300 rounded focus:ring-[#2563EB]" />
                </label>
                
                {formData.requiresProofOfWork && (
                  <div className="pt-2 border-t border-blue-100 flex items-center gap-3">
                    <label className="text-xs font-bold text-[#1F2937]">Loại sản phẩm bắt buộc:</label>
                    <select name="proofOfWorkType" value={formData.proofOfWorkType} onChange={handleChange} className="px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]">
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

              {/* Industry Skills Selection */}
              <div className="p-4 bg-[#EFF6FF]/60 border border-blue-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-bold text-[#1F2937]">Kỹ năng Yêu cầu Theo Ngành nghề ({formData.selectedSkills.length})</h4>
                  </div>
                  <span className="text-xs text-[#2563EB] font-bold">HR có thể chọn nhiều kỹ năng</span>
                </div>

                {/* Available Skill Suggestions */}
                <div>
                  <span className="text-xs font-bold text-slate-600 mb-1.5 block">Gợi ý kỹ năng ngành {categories.find(c => c.id === formData.categoryId)?.name || ''}:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white rounded-lg border border-blue-200">
                    {availableSkills.map(skill => {
                      const isSelected = formData.selectedSkills.some(s => s.skillId === skill.id);
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormData(prev => ({
                                ...prev,
                                selectedSkills: prev.selectedSkills.filter(s => s.skillId !== skill.id)
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedSkills: [...prev.selectedSkills, { skillId: skill.id, skillName: skill.name, requirementType: 'MANDATORY' }]
                              }));
                            }
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md transition-all font-bold flex items-center gap-1 ${
                            isSelected 
                              ? 'bg-[#2563EB] text-white shadow-sm' 
                              : 'bg-slate-100 text-[#1F2937] hover:bg-blue-50 hover:text-[#2563EB]'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{skill.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Skill Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nhập kỹ năng mới nếu chưa có trong danh sách..."
                    value={customSkillName}
                    onChange={(e) => setCustomSkillName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]"
                  />
                  <button
                    type="button"
                    disabled={creatingSkill || !customSkillName.trim()}
                    onClick={async () => {
                      if (!customSkillName.trim() || !formData.categoryId) return;
                      setCreatingSkill(true);
                      try {
                        const newSkill = await createCustomSkill(token, { name: customSkillName.trim(), categoryId: formData.categoryId });
                        setAvailableSkills(prev => [...prev, newSkill]);
                        setFormData(prev => ({
                          ...prev,
                          selectedSkills: [...prev.selectedSkills, { skillId: newSkill.id, skillName: newSkill.name, requirementType: 'MANDATORY' }]
                        }));
                        setCustomSkillName('');
                      } catch (err) {
                        alert('Không thể tạo kỹ năng mới');
                      } finally {
                        setCreatingSkill(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors shrink-0 shadow-sm"
                  >
                    + Thêm kỹ năng riêng
                  </button>
                </div>

                {/* Selected Skills List with Requirement Type Selector */}
                {formData.selectedSkills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-blue-100">
                    <span className="text-xs font-bold text-[#1F2937]">Danh sách Kỹ năng đã đính kèm vào JD:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.selectedSkills.map((sk, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white border border-blue-200 rounded-lg text-xs">
                          <span className="font-bold text-[#1F2937] truncate mr-2">{sk.skillName}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <select
                              value={sk.requirementType}
                              onChange={(e) => {
                                const newReq = e.target.value;
                                setFormData(prev => {
                                  const updated = [...prev.selectedSkills];
                                  updated[idx] = { ...updated[idx], requirementType: newReq };
                                  return { ...prev, selectedSkills: updated };
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                sk.requirementType === 'MANDATORY' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                              }`}
                            >
                              <option value="MANDATORY">Bắt buộc</option>
                              <option value="PREFERRED">Ưu tiên</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedSkills: prev.selectedSkills.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Required Certificates section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#1F2937]">Chứng chỉ / Giấy phép yêu cầu (Certificates & Licenses)</label>
                  <button type="button" onClick={addCertificate} className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1">
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
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]"
                    />
                    <select
                      value={cert.requirementType}
                      onChange={(e) => updateCertificate(index, 'requirementType', e.target.value)}
                      className="w-32 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937]"
                    >
                      <option value="MANDATORY">Bắt buộc</option>
                      <option value="PREFERRED">Ưu tiên</option>
                      <option value="NICE_TO_HAVE">Điểm cộng</option>
                    </select>
                    <button type="button" onClick={() => removeCertificate(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-[#EFF6FF] border border-blue-200 p-4 rounded-xl flex gap-4">
                <div className="w-10 h-10 bg-white border border-blue-200 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2937]">Cấu hình Trợ lý AI Chấm điểm</h4>
                  <p className="text-xs text-[#1F2937] leading-relaxed mt-1">
                    AI sẽ phân tích CV, tính điểm và gợi ý danh sách <strong>Ứng viên Đạt tiêu chuẩn</strong>. Quyết định loại hay mời phỏng vấn hoàn toàn do Nhà tuyển dụng phê duyệt.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Threshold */}
                <div className="space-y-4 border border-slate-200 rounded-xl p-5 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="w-4 h-4 text-[#2563EB]" />
                    <h5 className="font-bold text-[#1F2937] text-sm">Ngưỡng điểm Đạt tiêu chuẩn</h5>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ứng viên có điểm AI $\ge$ mức này sẽ được tự động xếp vào danh sách <strong>"Ứng viên Tiềm năng (Shortlisted)"</strong> để Nhà tuyển dụng ưu tiên xem xét trước.
                  </p>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#1F2937]">Ngưỡng điểm Đạt (Passing Score)</label>
                      <span className="text-sm font-extrabold text-emerald-600">{formData.autoShortlistThreshold} / 100 điểm</span>
                    </div>
                    <input 
                      type="range" 
                      name="autoShortlistThreshold" 
                      min="50" 
                      max="95" 
                      value={formData.autoShortlistThreshold} 
                      onChange={handleChange} 
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]" 
                    />
                  </div>
                  
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    💡 <strong>Nguyên tắc An toàn:</strong> AI không bao giờ tự động gửi thư từ chối hay tự loại ứng viên. Mọi CV nộp vào đều được lưu trữ để Nhà tuyển dụng đánh giá thủ công nếu muốn.
                  </div>
                </div>

                {/* Weights */}
                <div className="space-y-4 border border-slate-200 rounded-xl p-5 bg-white">
                  <h5 className="font-bold text-[#1F2937] text-sm mb-4">Trọng số chấm điểm (%)</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kỹ năng</label>
                      <input type="number" name="skillWeight" value={formData.skillWeight} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kinh nghiệm</label>
                      <input type="number" name="experienceWeight" value={formData.experienceWeight} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Học vấn & Bằng cấp</label>
                      <input type="number" name="educationWeight" value={formData.educationWeight} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#2563EB]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Ngoại ngữ / Chứng chỉ</label>
                      <input type="number" name="otherWeight" value={formData.otherWeight} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#1F2937] outline-none focus:border-[#2563EB]" />
                    </div>
                  </div>
                  {(Number(formData.skillWeight) + Number(formData.experienceWeight) + Number(formData.educationWeight) + Number(formData.otherWeight)) !== 100 && (
                    <p className="text-xs text-rose-500 font-bold">Tổng trọng số phải bằng 100% (Hiện tại: {Number(formData.skillWeight) + Number(formData.experienceWeight) + Number(formData.educationWeight) + Number(formData.otherWeight)}%)</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-[#EFF6FF]/50">
          {step > 1 ? (
            <button onClick={handlePrev} className="px-4 py-2 text-xs font-bold text-[#1F2937] hover:text-[#2563EB] transition-colors">
              Quay lại
            </button>
          ) : <div></div>}

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-[#1F2937] transition-colors">
              Hủy
            </button>
            {step < 3 ? (
              <button 
                onClick={handleNext}
                disabled={step === 1 && !formData.title}
                className="px-6 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp tục
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-md disabled:opacity-50"
              >
                {loading && <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
                Lưu bài tuyển dụng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
