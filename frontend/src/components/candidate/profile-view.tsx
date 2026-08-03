"use client"

import * as React from "react"
import {
  Pencil,
  Star,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Calendar,
  Building2,
  ExternalLink,
  Globe,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CandidateSkillData } from "@/lib/candidate-api"
import type {
  WorkExperienceData,
  EducationData,
  ProjectData,
  CertificateData,
} from "@/types/auth"

// ─── Types & Helpers ──────────────────────────────────────────────────

type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"

const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  BEGINNER: "Mới bắt đầu",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Thành thạo",
  EXPERT: "Chuyên gia",
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })
  } catch {
    return dateStr
  }
}

interface ProfileViewProps {
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
  workExperiences?: WorkExperienceData[]
  educations?: EducationData[]
  projects?: ProjectData[]
  certificates?: CertificateData[]
  skills: CandidateSkillData[]
  onEdit: () => void
}

// ─── Component ────────────────────────────────────────────────────────

export function ProfileView({
  fullName,
  email,
  phone,
  address,
  desiredTitle,
  professionalSummary,
  githubUrl,
  linkedinUrl,
  portfolioUrl,
  workExperiences = [],
  educations = [],
  projects = [],
  certificates = [],
  skills,
  onEdit,
}: ProfileViewProps) {
  const primarySkills = skills.filter((s) => s.isPrimary)
  const otherSkills = skills.filter((s) => !s.isPrimary)

  return (
    <div className="space-y-6">
      {/* Header Banner & Profile Card - Design System Color: Hiring Blue #2563EB */}
      <Card className="overflow-hidden border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <div className="h-28 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] relative">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        </div>
        <CardContent className="pt-0 relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-22 h-22 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-black text-[#2563EB] shrink-0">
                {fullName ? fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="pb-1 space-y-0.5">
                <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  {fullName}
                </h2>
                {desiredTitle ? (
                  <p className="text-sm font-semibold text-[#2563EB]">
                    {desiredTitle}
                  </p>
                ) : (
                  <p className="text-xs text-[#64748B]">Ứng viên SmartRecruit</p>
                )}
              </div>
            </div>

            <Button
              onClick={onEdit}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl px-4 py-2 shadow-sm transition-all active:scale-[0.98] flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Chỉnh sửa hồ sơ</span>
            </Button>
          </div>

          {/* Quick Contact Chips */}
          <div className="flex flex-wrap gap-4 pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B] font-medium">
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
              <Mail className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="text-[#0F172A]">{email}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                <Phone className="h-3.5 w-3.5 text-[#10B981]" />
                <span className="text-[#0F172A]">{phone}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                <MapPin className="h-3.5 w-3.5 text-[#E11D48]" />
                <span className="text-[#0F172A]">{address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      {professionalSummary && (
        <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#2563EB]" />
              Giới thiệu bản thân
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-line">
              {professionalSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Work Experience Timeline Section */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Briefcase className="h-4 w-4" />
            </div>
            Kinh nghiệm làm việc
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workExperiences.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E2E8F0] bg-[#F8FAFC] rounded-xl">
              <Briefcase className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">Chưa có thông tin kinh nghiệm làm việc.</p>
              <p className="text-xs text-[#64748B] mt-1">Thông tin sẽ tự động được trích xuất khi bạn tải CV lên.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E2E8F0]">
              {workExperiences.map((exp, idx) => (
                <div key={exp.id || idx} className="relative pl-8 space-y-1">
                  <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-[#EFF6FF] border-2 border-[#2563EB] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      {exp.positionTitle}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-[#64748B] font-medium bg-[#F8FAFC] px-2.5 py-0.5 rounded-md border border-[#E2E8F0] self-start sm:self-auto">
                      <Calendar className="h-3 w-3 text-[#2563EB]" />
                      <span>
                        {formatDate(exp.startDate)} - {exp.isCurrent ? "Hiện tại" : formatDate(exp.endDate) || "N/A"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-[#2563EB] flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {exp.companyName}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-[#64748B] pt-1 leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                  {exp.achievements && (
                    <div className="mt-2 p-2.5 bg-[#EFF6FF] border border-blue-100 rounded-xl text-xs text-[#1E40AF]">
                      <strong className="font-bold">Thành tựu:</strong> {exp.achievements}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education Section (Trường học / Học vấn) */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <GraduationCap className="h-4 w-4" />
            </div>
            Học vấn & Trường học
          </CardTitle>
        </CardHeader>
        <CardContent>
          {educations.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E2E8F0] bg-[#F8FAFC] rounded-xl">
              <GraduationCap className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">Chưa có thông tin học vấn.</p>
              <p className="text-xs text-[#64748B] mt-1">Thông tin trường học sẽ tự động trích xuất từ CV của bạn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {educations.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#2563EB] shrink-0" />
                      <span>{edu.schoolName}</span>
                    </h3>
                  </div>
                  {edu.major && (
                    <p className="text-xs font-bold text-[#2563EB]">
                      Chuyên ngành: {edu.major}
                    </p>
                  )}
                  {edu.degree && (
                    <p className="text-xs text-[#64748B]">
                      Bằng cấp: <span className="font-semibold text-[#0F172A]">{edu.degree}</span>
                    </p>
                  )}
                  {(edu.startDate || edu.endDate) && (
                    <p className="text-[11px] text-[#64748B] flex items-center gap-1 pt-1 font-medium">
                      <Calendar className="h-3 w-3 text-[#2563EB]" />
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate) || "N/A"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Section (Dự án) */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <FolderGit2 className="h-4 w-4" />
            </div>
            Dự án đã tham gia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E2E8F0] bg-[#F8FAFC] rounded-xl">
              <FolderGit2 className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">Chưa có thông tin dự án.</p>
              <p className="text-xs text-[#64748B] mt-1">Các dự án trong CV sẽ tự động được cập nhật vào đây.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#0F172A]">
                        {proj.projectName}
                      </h3>
                      {proj.projectRole && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-blue-100 font-bold">
                          {proj.projectRole}
                        </span>
                      )}
                    </div>

                    {proj.projectUrl && (
                      <a
                        href={proj.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Xem dự án</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {proj.description && (
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {proj.description}
                    </p>
                  )}

                  {/* Technologies Badges */}
                  {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.technologies.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-mono font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {(proj.startDate || proj.endDate) && (
                    <p className="text-[11px] text-[#64748B] flex items-center gap-1 pt-1 font-medium">
                      <Calendar className="h-3 w-3 text-[#2563EB]" />
                      {formatDate(proj.startDate)} - {formatDate(proj.endDate) || "N/A"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificates Section (Chứng chỉ) */}
      {certificates.length > 0 && (
        <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
                <Award className="h-4 w-4" />
              </div>
              Chứng chỉ & Bằng cấp chuyên môn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map((cert, idx) => (
                <div
                  key={cert.id || idx}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] shrink-0 border border-blue-100">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#0F172A]">
                      {cert.certificateName}
                    </h4>
                    <p className="text-[11px] text-[#2563EB] font-semibold">
                      {cert.issuingOrganization}
                    </p>
                    {cert.issueDate && (
                      <p className="text-[10px] text-[#64748B]">
                        Cấp ngày: {formatDate(cert.issueDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills Section */}
      <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Star className="h-4 w-4 text-[#2563EB] fill-[#2563EB]" />
            </div>
            Kỹ năng chuyên môn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.length === 0 ? (
            <p className="text-sm text-[#64748B] text-center py-4">
              Chưa có kỹ năng nào được thêm.
            </p>
          ) : (
            <>
              {primarySkills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                    Kỹ năng chính
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {primarySkills.map((s) => (
                      <SkillBadge key={s.id} skill={s} highlight />
                    ))}
                  </div>
                </div>
              )}
              {otherSkills.length > 0 && (
                <div className="space-y-2">
                  {primarySkills.length > 0 && (
                    <p className="text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                      Kỹ năng khác
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {otherSkills.map((s) => (
                      <SkillBadge key={s.id} skill={s} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Social & Portfolio Links */}
      {(linkedinUrl || githubUrl || portfolioUrl) && (
        <Card className="border border-[#E2E8F0] bg-white shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-100">
                <Globe className="h-4 w-4" />
              </div>
              Mạng xã hội & Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {linkedinUrl && (
              <LinkRow label="LinkedIn" url={linkedinUrl} />
            )}
            {githubUrl && (
              <LinkRow label="GitHub" url={githubUrl} />
            )}
            {portfolioUrl && (
              <LinkRow label="Portfolio" url={portfolioUrl} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center gap-3 text-xs p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
      <Globe className="h-4 w-4 text-[#2563EB] shrink-0" />
      <span className="font-bold text-[#0F172A] min-w-[70px]">{label}:</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#2563EB] hover:underline truncate font-semibold flex items-center gap-1"
      >
        <span>{url}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    </div>
  )
}

function SkillBadge({ skill, highlight }: { skill: CandidateSkillData; highlight?: boolean }) {
  const level = PROFICIENCY_LABELS[skill.proficiencyLevel as ProficiencyLevel] ?? skill.proficiencyLevel
  const isFromCV = skill.source === "EXTRACTED"

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
        highlight
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : isFromCV
            ? "border-blue-200 bg-[#EFF6FF] text-[#2563EB]"
            : "border-[#E2E8F0] bg-white text-[#0F172A]"
      }`}
    >
      {highlight && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
      <span>{skill.skill.name}</span>
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
          highlight
            ? "bg-amber-200/70 text-amber-900"
            : isFromCV
              ? "bg-blue-100 text-[#2563EB]"
              : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]"
        }`}
      >
        {level}
      </span>
    </div>
  )
}
