'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  getRecruiterApplicationDetail,
  getRecruiterApplications,
  type RecruiterDashboardStats,
  type RecruiterProfileData,
} from '@/lib/recruiter-api';
import { CreateJobWizard } from './CreateJobWizard';
import { DashboardTab } from './DashboardTab';
import { RecruiterInterviewsWorkspace } from './interviews/RecruiterInterviewsWorkspace';
import { JobsWorkspace } from './JobsWorkspace';
import { RecruiterHeader } from './RecruiterHeader';
import { RecruiterProfileModal } from './RecruiterProfileModal';

// Types
export interface Candidate {
  id: string;
  name: string;
  avatar: string;
  roleApplied: string;
  matchScore: number;
  skillsFit: { skill: string; fitScore: number }[];
  experienceYears: number;
  aiSummary: string;
  status: 'SHORTLISTED' | 'SCREENING' | 'REJECTED' | 'NEW';
  appliedDate: string;
  pros: string[];
  cons: string[];
  education: string;
  radarScores: {
    skills: number;
    experience: number;
    education: number;
    cultureFit: number;
  };
}

export function RecruiterWorkspace({
  profile: initialProfile,
  stats,
  token,
  defaultTab = 'dashboard',
  initialApplicationId,
}: {
  initialApplicationId?: string;
  profile: RecruiterProfileData | null;
  stats: RecruiterDashboardStats | null;
  token: string;
  defaultTab?: 'dashboard' | 'jobs' | 'interviews' | 'candidates';
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfileData | null>(initialProfile);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'interviews' | 'candidates'>(
    defaultTab,
  );
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCandidateForReport, setSelectedCandidateForReport] = useState<Candidate | null>(
    null,
  );
  const [topCandidates, setTopCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (!token) return;
    getRecruiterApplications(token, { page: 1, limit: 5 })
      .then((response) => {
        setTopCandidates(
          response.data.map((application) => {
            const score = Math.round(application.latestAiResult?.overallScore ?? 0);
            const status: Candidate['status'] =
              application.currentStage === 'SHORTLISTED'
                ? 'SHORTLISTED'
                : application.currentStage === 'REJECTED'
                  ? 'REJECTED'
                  : application.currentStage === 'SCREENING'
                    ? 'SCREENING'
                    : 'NEW';
            return {
              id: application.id,
              name: application.candidate.fullName || 'Ứng viên',
              avatar: application.candidate.avatarUrl || '/file.svg',
              roleApplied: application.job.title,
              matchScore: score,
              skillsFit: [],
              experienceYears: 0,
              aiSummary: application.latestAiResult
                ? `Match ${application.latestAiResult.matchLevel} — ${score}%`
                : 'Chưa có phân tích từ AI',
              status,
              appliedDate: new Date(application.appliedAt).toLocaleDateString('vi-VN'),
              pros: [],
              cons: [],
              education: 'Chưa tổng hợp',
              radarScores: {
                skills: score,
                experience: score,
                education: score,
                cultureFit: score,
              },
            };
          }),
        );
      })
      .catch((error) => console.error('Failed to load top applications', error));
  }, [token]);

  const [targetJobId, setTargetJobId] = useState<string | null>(null);
  const [targetJobTab, setTargetJobTab] = useState<'info' | 'candidates'>('candidates');
  const [targetAppId, setTargetAppId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const handleProfileUpdated = (updated: RecruiterProfileData) => {
    setProfile(updated);
  };

  const handleNavigateToJob = (jobId: string, initialTab: 'info' | 'candidates' = 'candidates') => {
    setTargetJobId(jobId);
    setTargetJobTab(initialTab);
    setActiveTab('jobs');
  };

  const handleNavigateToApplication = async (applicationId: string, jobId?: string) => {
    setTargetAppId(applicationId);
    setTargetJobTab('candidates');
    if (jobId) {
      setTargetJobId(jobId);
      setActiveTab('jobs');
    } else {
      try {
        const appDetail = await getRecruiterApplicationDetail(token, applicationId);
        if (appDetail?.job?.id) {
          setTargetJobId(appDetail.job.id);
        }
      } catch (err) {
        console.warn('Failed to resolve job from application:', err);
      }
      setActiveTab('jobs');
    }
  };

  useEffect(() => {
    if (!initialApplicationId || !token) return;
    let cancelled = false;
    getRecruiterApplicationDetail(token, initialApplicationId)
      .then((detail) => {
        if (cancelled || !detail.job?.id) return;
        setTargetAppId(initialApplicationId);
        setTargetJobId(detail.job.id);
        setTargetJobTab('candidates');
        setActiveTab('jobs');
      })
      .catch((error) => console.error('Failed to open application', error));
    return () => {
      cancelled = true;
    };
  }, [initialApplicationId, token]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <RecruiterHeader
        token={token}
        profile={profile}
        activeSection={activeTab === 'candidates' ? 'interviews' : activeTab}
        onNavigate={(section) => {
          if (section === 'talent-pool') return;
          setTargetJobId(null);
          setActiveTab(section);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNavigateToApplication={handleNavigateToApplication}
      />

      {/* Main Workspace Body */}
      <main className="max-w-[1440px] mx-auto p-6 space-y-6">
        {/* Tab 1: Action-First Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            token={token}
            onOpenCreateJob={() => setIsCreateJobOpen(true)}
            onNavigateToInterviews={() => setActiveTab('interviews')}
            onNavigateToJob={handleNavigateToJob}
            onNavigateToApplication={handleNavigateToApplication}
            onNavigateToJobsList={() => {
              setTargetJobId(null);
              setActiveTab('jobs');
            }}
          />
        )}

        {/* Tab 2: Job Management */}
        {activeTab === 'jobs' && (
          <JobsWorkspace
            initialData={null}
            token={token}
            selectedJobId={targetJobId}
            initialJobTab={targetJobTab}
            selectedApplicationId={targetAppId}
            onClearSelectedJob={() => {
              setTargetJobId(null);
              setTargetAppId(null);
              setTargetJobTab('info');
            }}
          />
        )}

        {/* Tab 3: Interviews Workspace */}
        {(activeTab === 'interviews' || activeTab === 'candidates') && (
          <RecruiterInterviewsWorkspace token={token} />
        )}
      </main>

      {/* Modal: Create Job Wizard */}
      <CreateJobWizard
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        token={token}
        onSuccess={() => {
          setIsCreateJobOpen(false);
          router.refresh();
        }}
      />

      {/* Modal: Recruiter Profile */}
      <RecruiterProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}
