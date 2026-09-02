"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const [isEditing, setIsEditing] = React.useState(false)
  const [isReviewingParsedResume, setIsReviewingParsedResume] = React.useState(false)
  const [isRefreshingProfile, startProfileRefresh] = React.useTransition()

  const profileFormRevision = React.useMemo(
    () =>
      JSON.stringify({
        fullName,
        phone,
        address,
        desiredTitle,
        professionalSummary,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        workExperiences,
        educations,
        projects,
        certificates
      }),
    [
      fullName,
      phone,
      address,
      desiredTitle,
      professionalSummary,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      workExperiences,
      educations,
      projects,
      certificates
    ]
  )
  const skillsRevision = React.useMemo(() => JSON.stringify(initialSkills), [initialSkills])

  const handleResumeParsed = React.useCallback(() => {
    setIsReviewingParsedResume(true)
    startProfileRefresh(() => {
      router.refresh()
    })
  }, [router])

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
        {isReviewingParsedResume && (
          <div
            role="status"
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900"
          >
            {isRefreshingProfile
              ? "AI đã phân tích xong. Đang tải thông tin vào biểu mẫu..."
              : "AI đã điền thông tin từ CV vào biểu mẫu. Vui lòng kiểm tra, chỉnh sửa nếu cần rồi bấm Lưu thay đổi."}
          </div>
        )}
        <ProfileForm
          key={profileFormRevision}
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
          onResumeParsed={handleResumeParsed}
          onCancel={() => {
            setIsReviewingParsedResume(false)
            setIsEditing(false)
          }}
          onSaved={() => {
            setIsReviewingParsedResume(false)
            setIsEditing(false)
            router.refresh()
          }}
        />

        <SkillsEditor key={skillsRevision} initialSkills={initialSkills} isEditing={true} />
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
