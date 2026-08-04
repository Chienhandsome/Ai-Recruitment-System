"use client"

import * as React from "react"
import {
  Save,
  X,
  User,
  Briefcase,
  FileText,
  Globe,
  Link2,
  Sparkles,
  GraduationCap,
  FolderGit2,
  Award,
  Plus,
  Trash2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { updateCandidateProfile } from "@/lib/candidate-api"
import { ResumeUpload } from "@/components/candidate/resume-upload"
import type { WorkExperienceData, EducationData, ProjectData, CertificateData } from "@/types/auth"

interface ProfileFormProps {
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  address: string | null
  desiredTitle: string | null
  professionalSummary: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  initialWorkExperiences?: WorkExperienceData[]
  initialEducations?: EducationData[]
  initialProjects?: ProjectData[]
  initialCertificates?: CertificateData[]
  onCancel: () => void
  onSaved: () => void
}

export function ProfileForm({
  fullName,
  email,
  phone,
  address,
  desiredTitle,
  professionalSummary,
  githubUrl,
  linkedinUrl,
  portfolioUrl,
  initialWorkExperiences = [],
  initialEducations = [],
  initialProjects = [],
  initialCertificates = [],
  onCancel,
  onSaved
}: ProfileFormProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null)

  // Dynamic state lists
  const [workExps, setWorkExps] = React.useState<WorkExperienceData[]>(
    initialWorkExperiences.length > 0 ? initialWorkExperiences : []
  )
  const [educations, setEducations] = React.useState<EducationData[]>(
    initialEducations.length > 0 ? initialEducations : []
  )
  const [projects, setProjects] = React.useState<ProjectData[]>(
    initialProjects.length > 0 ? initialProjects : []
  )
  const [certificates, setCertificates] = React.useState<CertificateData[]>(
    initialCertificates.length > 0 ? initialCertificates : []
  )

  // --- Handlers for Work Experience ---
  const addWorkExp = () => {
    setWorkExps((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        positionTitle: "",
        companyName: "",
        startDate: "",
        endDate: null,
        isCurrent: false,
        description: null,
        achievements: null,
        source: "MANUAL"
      }
    ])
  }

  const removeWorkExp = (index: number) => {
    setWorkExps((prev) => prev.filter((_, i) => i !== index))
  }

  const updateWorkExp = <K extends keyof WorkExperienceData>(
    index: number,
    field: K,
    value: WorkExperienceData[K]
  ) => {
    setWorkExps((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value, source: "MANUAL" }
      return updated
    })
  }

  // --- Handlers for Education ---
  const addEducation = () => {
    setEducations((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        schoolName: "",
        major: null,
        degree: null,
        startDate: null,
        endDate: null,
        description: null,
        source: "MANUAL"
      }
    ])
  }

  const removeEducation = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index))
  }

  const updateEducation = <K extends keyof EducationData>(
    index: number,
    field: K,
    value: EducationData[K]
  ) => {
    setEducations((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value, source: "MANUAL" }
      return updated
    })
  }

  // --- Handlers for Project ---
  const addProject = () => {
    setProjects((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        projectName: "",
        projectRole: null,
        description: null,
        technologies: null,
        projectUrl: null,
        startDate: null,
        endDate: null,
        source: "MANUAL"
      }
    ])
  }

  const removeProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index))
  }

  const updateProject = <K extends keyof ProjectData>(
    index: number,
    field: K,
    value: ProjectData[K]
  ) => {
    setProjects((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value, source: "MANUAL" }
      return updated
    })
  }

  // --- Handlers for Certificate ---
  const addCertificate = () => {
    setCertificates((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        certificateName: "",
        issuingOrganization: "",
        issueDate: null,
        expiryDate: null,
        credentialUrl: null,
        source: "MANUAL"
      }
    ])
  }

  const removeCertificate = (index: number) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCertificate = <K extends keyof CertificateData>(
    index: number,
    field: K,
    value: CertificateData[K]
  ) => {
    setCertificates((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value, source: "MANUAL" }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      const supabase = createClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setSaveMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        setIsSaving(false)
        return
      }

      // Filter out empty rows
      const validWorkExps = workExps
        .filter((w) => w.companyName.trim() && w.positionTitle.trim())
        .map((w) => ({
          id: w.id.startsWith("temp-") ? undefined : w.id,
          source: w.source ?? "MANUAL",
          companyName: w.companyName.trim(),
          positionTitle: w.positionTitle.trim(),
          startDate: w.startDate || undefined,
          endDate: w.endDate || null,
          isCurrent: w.isCurrent,
          description: w.description || null,
          achievements: w.achievements || null
        }))

      const validEducations = educations
        .filter((e) => e.schoolName.trim())
        .map((e) => ({
          id: e.id.startsWith("temp-") ? undefined : e.id,
          source: e.source ?? "MANUAL",
          schoolName: e.schoolName.trim(),
          major: e.major || null,
          degree: e.degree || null,
          startDate: e.startDate || null,
          endDate: e.endDate || null
        }))

      const validProjects = projects
        .filter((p) => p.projectName.trim())
        .map((p) => ({
          id: p.id.startsWith("temp-") ? undefined : p.id,
          source: p.source ?? "MANUAL",
          projectName: p.projectName.trim(),
          projectRole: p.projectRole || null,
          description: p.description || null,
          technologies: p.technologies
            ? p.technologies.map((technology) => technology.trim()).filter(Boolean)
            : null,
          projectUrl: p.projectUrl || null,
          startDate: p.startDate || null,
          endDate: p.endDate || null
        }))

      const validCertificates = certificates
        .filter((c) => c.certificateName.trim())
        .map((c) => ({
          id: c.id.startsWith("temp-") ? undefined : c.id,
          source: c.source ?? "MANUAL",
          certificateName: c.certificateName.trim(),
          issuingOrganization: c.issuingOrganization || "Unknown",
          issueDate: c.issueDate || null
        }))

      await updateCandidateProfile(session.access_token, {
        fullName: formData.get("fullName") as string,
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
        desiredTitle: (formData.get("desiredTitle") as string) || null,
        professionalSummary: (formData.get("professionalSummary") as string) || null,
        linkedinUrl: (formData.get("linkedinUrl") as string) || null,
        githubUrl: (formData.get("githubUrl") as string) || null,
        portfolioUrl: (formData.get("portfolioUrl") as string) || null,
        workExperiences: validWorkExps,
        educations: validEducations,
        projects: validProjects,
        certificates: validCertificates
      })

      setSaveMessage("Đã lưu thông tin thành công!")
      setTimeout(() => {
        onSaved()
      }, 800)
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu thông tin.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Action Header */}
      <div className="p-4 bg-[#EFF6FF] border border-blue-100 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#2563EB] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#0F172A]">Chỉnh sửa hồ sơ cá nhân</h3>
            <p className="text-[11px] text-[#64748B]">
              Cập nhật trực tiếp Kinh nghiệm, Học vấn, Dự án hoặc tải CV để tự động bóc tách.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="border-[#E2E8F0] text-[#0F172A] font-bold text-xs rounded-xl px-3 py-2 bg-white"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl px-4 py-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <User className="h-4 w-4" />
            </div>
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-bold text-[#0F172A]">
                Họ và tên <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={fullName}
                placeholder="Nguyễn Văn A"
                required
                className="bg-[#F8FAFC] border-[#E2E8F0] text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-[#0F172A]">
                Địa chỉ Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                disabled
                className="bg-[#F1F5F9] border-[#E2E8F0] text-sm text-[#64748B] cursor-not-allowed rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-[#0F172A]">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={phone ?? ""}
                placeholder="0901234567"
                className="bg-[#F8FAFC] border-[#E2E8F0] text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-[#0F172A]">
                Địa chỉ / Nơi sinh sống
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={address ?? ""}
                placeholder="TP. Hồ Chí Minh"
                className="bg-[#F8FAFC] border-[#E2E8F0] text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Briefcase className="h-4 w-4" />
            </div>
            Thông tin nghề nghiệp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="desiredTitle" className="text-xs font-bold text-[#0F172A]">
              Vị trí ứng tuyển mong muốn
            </Label>
            <Input
              id="desiredTitle"
              name="desiredTitle"
              defaultValue={desiredTitle ?? ""}
              placeholder="Ví dụ: Senior Frontend Engineer, React Native Developer..."
              className="bg-[#F8FAFC] border-[#E2E8F0] text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="professionalSummary" className="text-xs font-bold text-[#0F172A]">
              Giới thiệu bản thân & Mục tiêu nghề nghiệp
            </Label>
            <Textarea
              id="professionalSummary"
              name="professionalSummary"
              defaultValue={professionalSummary ?? ""}
              placeholder="Tóm tắt kinh nghiệm làm việc nổi bật, mục tiêu nghề nghiệp và thế mạnh chuyên môn của bạn..."
              rows={4}
              className="bg-[#F8FAFC] border-[#E2E8F0] text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Experiences Section */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Briefcase className="h-4 w-4" />
            </div>
            Kinh nghiệm làm việc ({workExps.length})
          </CardTitle>

          <Button
            type="button"
            onClick={addWorkExp}
            className="bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 font-bold text-xs rounded-xl px-3 py-1.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm kinh nghiệm
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {workExps.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-4 border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
              Chưa có kinh nghiệm làm việc nào. Bấm nút &quot;Thêm kinh nghiệm&quot; ở trên để bổ
              sung.
            </p>
          ) : (
            workExps.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 relative"
              >
                <Button
                  type="button"
                  onClick={() => removeWorkExp(idx)}
                  className="absolute right-3 top-3 h-7 w-7 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="grid gap-3 sm:grid-cols-2 pr-8">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Chức danh / Vị trí</Label>
                    <Input
                      value={exp.positionTitle}
                      onChange={(e) => updateWorkExp(idx, "positionTitle", e.target.value)}
                      placeholder="Ví dụ: Frontend Developer"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Tên công ty</Label>
                    <Input
                      value={exp.companyName}
                      onChange={(e) => updateWorkExp(idx, "companyName", e.target.value)}
                      placeholder="Ví dụ: Công ty Công nghệ ABC"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#0F172A]">
                    Mô tả công việc & Thành tựu
                  </Label>
                  <Textarea
                    value={exp.description ?? ""}
                    onChange={(e) => updateWorkExp(idx, "description", e.target.value)}
                    placeholder="Mô tả các công việc chính đã thực hiện..."
                    rows={2}
                    className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Education Section (Trường học / Học vấn) */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <GraduationCap className="h-4 w-4" />
            </div>
            Học vấn & Trường học ({educations.length})
          </CardTitle>

          <Button
            type="button"
            onClick={addEducation}
            className="bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 font-bold text-xs rounded-xl px-3 py-1.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm trường học
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {educations.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-4 border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
              Chưa có học vấn nào. Bấm nút &quot;Thêm trường học&quot; ở trên để bổ sung.
            </p>
          ) : (
            educations.map((edu, idx) => (
              <div
                key={edu.id || idx}
                className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 relative"
              >
                <Button
                  type="button"
                  onClick={() => removeEducation(idx)}
                  className="absolute right-3 top-3 h-7 w-7 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="grid gap-3 sm:grid-cols-3 pr-8">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Tên trường học</Label>
                    <Input
                      value={edu.schoolName}
                      onChange={(e) => updateEducation(idx, "schoolName", e.target.value)}
                      placeholder="Ví dụ: Đại học Bách Khoa"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Chuyên ngành</Label>
                    <Input
                      value={edu.major ?? ""}
                      onChange={(e) => updateEducation(idx, "major", e.target.value)}
                      placeholder="Ví dụ: Công nghệ thông tin"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Bằng cấp</Label>
                    <Input
                      value={edu.degree ?? ""}
                      onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                      placeholder="Ví dụ: Cử nhân, Kỹ sư"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <FolderGit2 className="h-4 w-4" />
            </div>
            Dự án đã tham gia ({projects.length})
          </CardTitle>

          <Button
            type="button"
            onClick={addProject}
            className="bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 font-bold text-xs rounded-xl px-3 py-1.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm dự án
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-4 border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
              Chưa có dự án nào. Bấm nút &quot;Thêm dự án&quot; ở trên để bổ sung.
            </p>
          ) : (
            projects.map((proj, idx) => (
              <div
                key={proj.id || idx}
                className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 relative"
              >
                <Button
                  type="button"
                  onClick={() => removeProject(idx)}
                  className="absolute right-3 top-3 h-7 w-7 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="grid gap-3 sm:grid-cols-2 pr-8">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Tên dự án</Label>
                    <Input
                      value={proj.projectName}
                      onChange={(e) => updateProject(idx, "projectName", e.target.value)}
                      placeholder="Ví dụ: SmartRecruit Portal"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Vai trò trong dự án</Label>
                    <Input
                      value={proj.projectRole ?? ""}
                      onChange={(e) => updateProject(idx, "projectRole", e.target.value)}
                      placeholder="Ví dụ: Full-stack Developer"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Công nghệ sử dụng</Label>
                    <Input
                      value={
                        Array.isArray(proj.technologies)
                          ? proj.technologies.join(", ")
                          : (proj.technologies ?? "")
                      }
                      onChange={(e) =>
                        updateProject(idx, "technologies", e.target.value.split(","))
                      }
                      placeholder="React, Next.js, NestJS, Postgres..."
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">
                      Đường dẫn dự án (URL)
                    </Label>
                    <Input
                      value={proj.projectUrl ?? ""}
                      onChange={(e) => updateProject(idx, "projectUrl", e.target.value)}
                      placeholder="https://myproject.com"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#0F172A]">Mô tả dự án</Label>
                  <Textarea
                    value={proj.description ?? ""}
                    onChange={(e) => updateProject(idx, "description", e.target.value)}
                    placeholder="Mô tả chức năng chính và đóng góp của bạn..."
                    rows={2}
                    className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Certificates Section */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Award className="h-4 w-4" />
            </div>
            Chứng chỉ & Bằng cấp ({certificates.length})
          </CardTitle>

          <Button
            type="button"
            onClick={addCertificate}
            className="bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 font-bold text-xs rounded-xl px-3 py-1.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm chứng chỉ
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {certificates.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-4 border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
              Chưa có chứng chỉ nào. Bấm nút &quot;Thêm chứng chỉ&quot; ở trên để bổ sung.
            </p>
          ) : (
            certificates.map((cert, idx) => (
              <div
                key={cert.id || idx}
                className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 relative"
              >
                <Button
                  type="button"
                  onClick={() => removeCertificate(idx)}
                  className="absolute right-3 top-3 h-7 w-7 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="grid gap-3 sm:grid-cols-2 pr-8">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Tên chứng chỉ</Label>
                    <Input
                      value={cert.certificateName}
                      onChange={(e) => updateCertificate(idx, "certificateName", e.target.value)}
                      placeholder="Ví dụ: AWS Certified Solutions Architect"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Đơn vị cấp</Label>
                    <Input
                      value={cert.issuingOrganization}
                      onChange={(e) =>
                        updateCertificate(idx, "issuingOrganization", e.target.value)
                      }
                      placeholder="Ví dụ: Amazon Web Services"
                      className="bg-white border-[#E2E8F0] text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Globe className="h-4 w-4" />
            </div>
            Mạng xã hội & Đường dẫn Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="linkedinUrl"
                className="text-xs font-bold text-[#0F172A] flex items-center gap-1"
              >
                <Briefcase className="h-3.5 w-3.5 text-[#2563EB]" />
                LinkedIn URL
              </Label>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                defaultValue={linkedinUrl ?? ""}
                placeholder="https://linkedin.com/in/username"
                className="bg-[#F8FAFC] border-[#E2E8F0] text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="githubUrl"
                className="text-xs font-bold text-[#0F172A] flex items-center gap-1"
              >
                <Link2 className="h-3.5 w-3.5 text-[#0F172A]" />
                GitHub URL
              </Label>
              <Input
                id="githubUrl"
                name="githubUrl"
                type="url"
                defaultValue={githubUrl ?? ""}
                placeholder="https://github.com/username"
                className="bg-[#F8FAFC] border-[#E2E8F0] text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="portfolioUrl"
                className="text-xs font-bold text-[#0F172A] flex items-center gap-1"
              >
                <Globe className="h-3.5 w-3.5 text-[#10B981]" />
                Portfolio / Website
              </Label>
              <Input
                id="portfolioUrl"
                name="portfolioUrl"
                type="url"
                defaultValue={portfolioUrl ?? ""}
                placeholder="https://myportfolio.com"
                className="bg-[#F8FAFC] border-[#E2E8F0] text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CV Upload Section */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <FileText className="h-4 w-4" />
            </div>
            Tải lên CV (Tự động bóc tách bằng AI)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeUpload />
        </CardContent>
      </Card>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        {saveMessage ? (
          <p
            className={`text-xs font-bold ${
              saveMessage.includes("thành công") ? "text-[#10B981]" : "text-rose-600"
            }`}
          >
            {saveMessage}
          </p>
        ) : (
          <p className="text-xs text-[#64748B]">
            Nhấn Lưu thay đổi để hoàn tất quá trình chỉnh sửa
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="border-[#E2E8F0] text-[#0F172A] font-bold text-xs rounded-xl px-4 py-2.5 bg-white"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </form>
  )
}
