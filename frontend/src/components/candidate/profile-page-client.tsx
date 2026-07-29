"use client"

import * as React from "react"
import { ProfileView } from "@/components/candidate/profile-view"
import { ProfileForm } from "@/components/candidate/profile-form"
import { SkillsEditor } from "@/components/candidate/skills-editor"
import type { CandidateSkillData } from "@/lib/candidate-api"
import type {
  WorkExperienceData,
  EducationData,
  ProjectData,
  CertificateData,
} from "@/types/auth"

interface ProfilePageClientProps {
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
  initialSkills,
}: ProfilePageClientProps) {
  const [isEditing, setIsEditing] = React.useState(false)

  if (isEditing) {
    return (
      <div className="space-y-6">
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
  )
}
