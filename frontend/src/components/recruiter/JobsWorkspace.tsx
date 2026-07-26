"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, Eye, Copy, Pencil, Play, Pause, XCircle } from "lucide-react";
import type { JobsResponse, JobPostingData } from "@/lib/recruiter-api";
import { updateRecruiterJob, getRecruiterJobs } from "@/lib/recruiter-api";
import { CreateJobWizard } from "./CreateJobWizard";
import { format } from "date-fns";

interface JobsWorkspaceProps {
  initialData: JobsResponse | null;
  token: string;
}

export function JobsWorkspace({ initialData, token }: JobsWorkspaceProps) {
  const [data, setData] = useState<JobsResponse | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");

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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#121620] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-slate-200 dark:border-slate-800/60 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý Bài đăng</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tạo mới và theo dõi các chiến dịch tuyển dụng của bạn.
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tạo bài tuyển dụng bằng AI
        </button>
      </div>

      {/* Filters and Tabs */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg w-full md:w-auto overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm JD, mã Job..."
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-[#0B0E14] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <button className="inline-flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/60">
              <thead className="bg-slate-50 dark:bg-slate-800/40">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Vị trí / Mã Job
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ứng viên
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#121620] divide-y divide-slate-200 dark:divide-slate-700/60">
                {data.data.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {job.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {job.jobCode}
                          </span>
                          {job.workingModel && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {job.workingModel === "ON_SITE" ? "On-site" : job.workingModel === "HYBRID" ? "Hybrid" : job.workingModel === "REMOTE" ? "Remote" : "Shift"}
                            </span>
                          )}
                          {job.requiresProofOfWork && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                              Req Proof
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {job.department?.name || "Chưa xếp"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                        {job._count?.applications || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(job.createdAt), "dd/MM/yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-3 py-1 outline-none cursor-pointer border ${
                          job.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                          job.status === "DRAFT" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
                          job.status === "PAUSED" ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600" :
                          "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                        }`}
                      >
                        <option value="DRAFT">Nháp</option>
                        <option value="PUBLISHED">Mở</option>
                        <option value="PAUSED">Tạm dừng</option>
                        <option value="CLOSED">Đóng</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Xem Pipeline" className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button title="Sao chép link" className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button title="Sửa" className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10">
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
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Không tìm thấy bài đăng nào</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Bạn chưa có bài đăng nào {activeTab !== "ALL" ? `ở trạng thái ${tabs.find(t => t.id === activeTab)?.label}` : ""}. Bắt đầu bằng cách tạo một JD mới nhé!
            </p>
            <button 
              onClick={() => setIsWizardOpen(true)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Plus className="w-4 h-4" /> Tạo bài đăng ngay
            </button>
          </div>
        )}
      </div>

      {isWizardOpen && (
        <CreateJobWizard 
          isOpen={isWizardOpen} 
          onClose={() => setIsWizardOpen(false)} 
          token={token}
          onSuccess={() => {
            setIsWizardOpen(false);
            loadJobs(activeTab, search);
          }}
        />
      )}
    </div>
  );
}
