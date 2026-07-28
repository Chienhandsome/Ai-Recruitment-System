"use client"

import * as React from "react"
import { Pencil, Star, MapPin, Phone, Briefcase, Link2, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CandidateSkillData } from "@/lib/candidate-api"

// ─── Types ────────────────────────────────────────────────────────────

type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"

const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  BEGINNER: "Mới bắt đầu",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Thành thạo",
  EXPERT: "Chuyên gia",
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
  skills,
  onEdit,
}: ProfileViewProps) {
  const primarySkills = skills.filter((s) => s.isPrimary)
  const otherSkills = skills.filter((s) => !s.isPrimary)

  return (
    <div className="space-y-6">
      {/* Header with Edit button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{fullName}</h2>
          {desiredTitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{desiredTitle}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Cập nhật thông tin
        </Button>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Email" value={email} />
          {phone && <InfoRow icon={<Phone className="h-4 w-4" />} label="Điện thoại" value={phone} />}
          {address && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Địa chỉ" value={address} />}
        </CardContent>
      </Card>

      {/* Professional Summary */}
      {professionalSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Giới thiệu bản thân</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-line">{professionalSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kỹ năng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Chưa có kỹ năng nào được thêm.
            </p>
          ) : (
            <>
              {primarySkills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Khác
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

      {/* Links */}
      {(linkedinUrl || githubUrl || portfolioUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liên kết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedinUrl && (
              <LinkRow icon={<Briefcase className="h-4 w-4" />} label="LinkedIn" url={linkedinUrl} />
            )}
            {githubUrl && (
              <LinkRow icon={<Github className="h-4 w-4" />} label="GitHub" url={githubUrl} />
            )}
            {portfolioUrl && (
              <LinkRow icon={<Link2 className="h-4 w-4" />} label="Portfolio" url={portfolioUrl} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground min-w-[80px]">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function LinkRow({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground min-w-[80px]">{label}:</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline truncate"
      >
        {url}
      </a>
    </div>
  )
}

function SkillBadge({ skill, highlight }: { skill: CandidateSkillData; highlight?: boolean }) {
  const level = PROFICIENCY_LABELS[skill.proficiencyLevel as ProficiencyLevel] ?? skill.proficiencyLevel
  const isFromCV = skill.source === "EXTRACTED"

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border ${
        highlight
          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
          : isFromCV
            ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
            : "border-input bg-muted"
      }`}
    >
      {highlight && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
      <span className={`font-medium ${
        highlight ? "text-amber-700 dark:text-amber-300" :
        isFromCV ? "text-blue-700 dark:text-blue-300" : "text-foreground"
      }`}>
        {skill.skill.name}
      </span>
      <span className={`text-xs ${
        highlight ? "text-amber-500 dark:text-amber-400" :
        isFromCV ? "text-blue-500 dark:text-blue-400" : "text-muted-foreground"
      }`}>
        {level}
      </span>
      {skill.yearsExperience != null && (
        <span className="text-xs text-muted-foreground">
          · {skill.yearsExperience}n
        </span>
      )}
      {isFromCV && (
        <span className="text-[10px] text-blue-400 dark:text-blue-500 ml-0.5">CV</span>
      )}
    </div>
  )
}
