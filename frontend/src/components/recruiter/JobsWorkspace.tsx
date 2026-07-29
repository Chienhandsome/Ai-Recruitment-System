"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Copy, Pencil, Play, Pause, XCircle } from "lucide-react";
import type { JobsResponse, JobPostingData } from "@/lib/recruiter-api";
import { updateRecruiterJob, getRecruiterJobs } from "@/lib/recruiter-api";
import { CreateJobWizard } from "./CreateJobWizard";
import { JobDetailView } from "./JobDetailView";
import { format } from "date-fns";

interface JobsWorkspaceProps {
  initialData: JobsResponse | null;
  token: string;
}

export function JobsWorkspace({ initialData, token }: JobsWorkspaceProps) {
  const [data, setData] = useState<JobsResponse | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<JobPostingData | null>(null);

  const tabs = [
    { id: "ALL", label: "Tất cả" },
    { id: "DRAFT", label: "Bản nháp" },
    { id: "PUBLISHED", label: "Đang mở" },
    { id: "PAUSED", label: "Tạm dừng" },
    { id: "CLOSED", label: "Đã đóng" },
  ];

  const loadJobs = async (status: string, searchQuery: string) => {
    setLoading(true);
    try {
      const result = await getRecruiterJobs(token, {
        page: 1,
        limit: 10,
        status: status === "ALL" ? undefined : status,
        search: searchQuery || undefined,
      });
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if tab or search changes (debounce could be added for search)
    const timeoutId = setTimeout(() => {
      loadJobs(activeTab, search);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [activeTab, search, token]);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await updateRecruiterJob(token, jobId, { status: newStatus });
      // Reload jobs
      loadJobs(activeTab, search);
    } catch (err) {
      console.error("Failed to change status", err);
      alert("Cập nhật trạng thái thất bại");
    }
  };

  // If a job is selected, render the JobDetailView!
  if (selectedJobId) {
    return (
      <>
        <JobDetailView
          jobId={selectedJobId}
          token={token}
          onBack={() => setSelectedJobId(null)}
          onEdit={(job) => {
            setEditingJob(job);
            setIsWizardOpen(true);
          }}
          onJobDeleted={() => {
            setSelectedJobId(null);
            loadJobs(activeTab, search);
          }}
        />

        {isWizardOpen && (
          <CreateJobWizard 
            isOpen={isWizardOpen} 
            onClose={() => {
              setIsWizardOpen(false);
              setEditingJob(null);
            }} 
            token={token}
            initialJobData={editingJob}
            onSuccess={() => {
              setIsWizardOpen(false);
              setEditingJob(null);
              loadJobs(activeTab, search);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Quản lý Bài đăng</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tạo mới và theo dõi các chiến dịch tuyển dụng của bạn.
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tạo bài tuyển dụng bằng AI
        </button>
      </div>

      {/* Filters and Tabs */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex p-1.5 bg-[#EFF6FF] rounded-xl border border-blue-100 w-full md:w-auto overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm JD, mã Job..."
              className="block w-full pl-9 pr-3 py-2 border border-blue-200 rounded-xl text-xs bg-[#EFF6FF] text-[#1F2937] placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
            />
          </div>
          <button className="inline-flex items-center justify-center p-2 border border-blue-200 rounded-xl text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-[#EFF6FF] border-b border-blue-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                    Vị trí / Mã Job
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                    Ứng viên
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {data.data.map((job) => (
                  <tr 
                    key={job.id} 
                    onClick={() => setSelectedJobId(job.id)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
                          {job.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded font-mono font-bold border border-blue-200">
                            {job.jobCode}
                          </span>
                          {job.workingModel && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {job.workingModel === "ON_SITE" ? "On-site" : job.workingModel === "HYBRID" ? "Hybrid" : job.workingModel === "REMOTE" ? "Remote" : "Shift"}
                            </span>
                          )}
                          {job.requiresProofOfWork && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                              Req Proof
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-600">
                        {job.department?.name || "Chưa xếp"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-blue-200">
                        {job._count?.applications || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500 font-medium">
                        {format(new Date(job.createdAt), "dd/MM/yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 outline-none cursor-pointer border ${
                          job.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                          job.status === "DRAFT" ? "bg-amber-50 text-amber-700 border-amber-300" :
                          job.status === "PAUSED" ? "bg-slate-100 text-slate-700 border-slate-300" :
                          "bg-red-50 text-red-700 border-red-300"
                        }`}
                      >
                        <option value="DRAFT">Nháp</option>
                        <option value="PUBLISHED">Mở</option>
                        <option value="PAUSED">Tạm dừng</option>
                        <option value="CLOSED">Đóng</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedJobId(job.id)} 
                          title="Xem Chi tiết JD & AI Candidates" 
                          className="p-1.5 text-slate-400 hover:text-[#2563EB] rounded-md hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingJob(job);
                            setIsWizardOpen(true);
                          }} 
                          title="Sửa JD" 
                          className="p-1.5 text-slate-400 hover:text-[#2563EB] rounded-md hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-4 border border-blue-200 shadow-sm">
              <Search className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-bold text-[#1F2937]">Không tìm thấy bài đăng nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Bạn chưa có bài đăng nào {activeTab !== "ALL" ? `ở trạng thái ${tabs.find(t => t.id === activeTab)?.label}` : ""}. Bắt đầu bằng cách tạo một JD mới nhé!
            </p>
            <button 
              onClick={() => setIsWizardOpen(true)}
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#2563EB] hover:underline"
            >
              <Plus className="w-4 h-4" /> Tạo bài đăng ngay
            </button>
          </div>
        )}
      </div>

      {isWizardOpen && (
        <CreateJobWizard 
          isOpen={isWizardOpen} 
          onClose={() => {
            setIsWizardOpen(false);
            setEditingJob(null);
          }} 
          token={token}
          initialJobData={editingJob}
          onSuccess={() => {
            setIsWizardOpen(false);
            setEditingJob(null);
            loadJobs(activeTab, search);
          }}
        />
      )}
    </div>
  );
}
