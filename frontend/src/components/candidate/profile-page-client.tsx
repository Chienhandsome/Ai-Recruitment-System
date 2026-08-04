"use client"

import * as React from "react"
import { ProfileView } from "@/components/candidate/profile-view"
import { ProfileForm } from "@/components/candidate/profile-form"
import { SkillsEditor } from "@/components/candidate/skills-editor"
import type { CandidateSkillData } from "@/lib/candidate-api"
import type { WorkExperienceData, EducationData, ProjectData, CertificateData } from "@/types/auth"

interface ProfilePageClientProps {
  profileStatus: "EMPTY" | "PROCESSING" | "READY" | "NEEDS_REVIEW" | "FAILED"
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
  initialSkills: CandidateSkillData[]
}

export function ProfilePageClient({
  profileStatus,
  fullName,
  email,
  phone,
  avatarUrl,
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
  initialSkills
}: ProfilePageClientProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const reviewNotice = profileStatus === "NEEDS_REVIEW" && (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      AI chưa đủ tự tin về một số thông tin trích xuất. Vui lòng kiểm tra và chỉnh sửa hồ sơ trước
      khi sử dụng.
    </div>
  )

  if (isEditing) {
    return (
      <div className="space-y-6">
        {reviewNotice}
        <ProfileForm
          fullName={fullName}
          email={email}
          phone={phone}
          avatarUrl={avatarUrl}
          address={address}
          desiredTitle={desiredTitle}
          professionalSummary={professionalSummary}
          githubUrl={githubUrl}
          linkedinUrl={linkedinUrl}
          portfolioUrl={portfolioUrl}
          initialWorkExperiences={workExperiences}
          initialEducations={educations}
          initialProjects={projects}
          initialCertificates={certificates}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false)
            // Reload page to get fresh data from server
            window.location.reload()
          }}
        />

        <SkillsEditor initialSkills={initialSkills} isEditing={true} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviewNotice}
      <ProfileView
        fullName={fullName}
        email={email}
        phone={phone}
        avatarUrl={avatarUrl}
        address={address}
        desiredTitle={desiredTitle}
        professionalSummary={professionalSummary}
        githubUrl={githubUrl}
        linkedinUrl={linkedinUrl}
        portfolioUrl={portfolioUrl}
        workExperiences={workExperiences}
        educations={educations}
        projects={projects}
        certificates={certificates}
        skills={initialSkills}
        onEdit={() => setIsEditing(true)}
      />
    </div>
  )
}
