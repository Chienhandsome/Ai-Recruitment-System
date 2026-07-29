"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Trash2,
  Building2,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Loader2,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAdminUsers,
  updateAdminUserStatus,
  deleteAdminUser,
  AdminUserData,
} from "@/lib/admin-api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const loadUsersData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await fetchAdminUsers(
        selectedRoleFilter,
        selectedStatusFilter,
        searchQuery
      );
      setUsers(data);
    } catch (err: unknown) {
      console.error("[AdminUsers] Error loading users:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể nạp danh sách người dùng từ cơ sở dữ liệu"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, [selectedRoleFilter, selectedStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsersData();
  };

  const handleStatusChange = async (
    userId: string,
    fullName: string,
    newStatus: string
  ) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await updateAdminUserStatus(token, userId, newStatus);
      const actionLabel =
        newStatus === "ACTIVE"
          ? "Kích hoạt tài khoản"
          : newStatus === "SUSPENDED"
          ? "Tạm khóa tài khoản"
          : "Khóa vĩnh viễn";
      setSuccessMsg(`Đã ${actionLabel} cho người dùng "${fullName}"!`);
      await loadUsersData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${fullName}" khỏi CSDL? Thao tác này không thể hoàn tác!`
      )
    ) {
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await deleteAdminUser(token, userId);
      setSuccessMsg(`Đã xóa tài khoản "${fullName}" thành công!`);
      await loadUsersData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Xóa tài khoản thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (roleCode: string) => {
    switch (roleCode) {
      case "ADMIN":
        return (
          <span
            key={roleCode}
            className="text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md"
          >
            Quản trị viên (ADMIN)
          </span>
        );
      case "RECRUITER":
        return (
          <span
            key={roleCode}
            className="text-[10px] font-bold bg-blue-100 text-[#2563EB] border border-blue-200 px-2 py-0.5 rounded-md"
          >
            Nhà tuyển dụng (RECRUITER)
          </span>
        );
      case "CANDIDATE":
        return (
          <span
            key={roleCode}
            className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md"
          >
            Ứng viên (CANDIDATE)
          </span>
        );
      default:
        return (
          <span
            key={roleCode}
            className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
          >
            {roleCode}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <UserCheck className="w-3.5 h-3.5" /> Hoạt Động
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5" /> Tạm Khóa
          </span>
        );
      case "LOCKED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg">
            <UserX className="w-3.5 h-3.5" /> Bị Báo Cáo / Khóa
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Quản Lý Tài Khoản Người Dùng (Users Management)
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Quản lý thông tin tài khoản Ứng viên, Nhà tuyển dụng và phân quyền Admin từ PostgreSQL
          </p>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex bg-[#E2E8F0] p-1 rounded-xl text-xs font-medium self-start sm:self-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Tất cả vai trò" },
            { id: "CANDIDATE", label: "Ứng viên" },
            { id: "RECRUITER", label: "Nhà tuyển dụng" },
            { id: "ADMIN", label: "Admin" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRoleFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                selectedRoleFilter === tab.id
                  ? "bg-white text-[#2563EB] font-bold shadow-sm"
                  : "text-[#64748B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            className="text-rose-400 hover:text-rose-700"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-400 hover:text-emerald-700"
          >
            <UserCheck className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm space-y-6">
        {/* Controls: Search & Status dropdown */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo Email, Họ tên hoặc Số điện thoại..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A]"
            />
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full sm:w-56 px-3 py-2.5 text-sm bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A] font-medium"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="ACTIVE">Đang Hoạt Động</option>
            <option value="SUSPENDED">Tạm Khóa</option>
            <option value="LOCKED">Bị Khóa / Báo Cáo</option>
          </select>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] text-white font-bold text-xs rounded-xl hover:bg-[#1D4ED8] transition-all shadow-sm"
          >
            Tìm Kiếm
          </button>
        </form>

        {/* Users Table */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-blue-100">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-3" />
            <p className="text-xs font-semibold text-[#64748B]">
              Đang kết nối CSDL PostgreSQL và tải danh sách người dùng...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#64748B] italic bg-slate-50 rounded-xl border border-dashed border-[#E2E8F0]">
            Không tìm thấy tài khoản người dùng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] text-xs uppercase font-bold">
                  <th className="pb-3 px-3">Người Dùng</th>
                  <th className="pb-3 px-3">Vai Trò (Role)</th>
                  <th className="pb-3 px-3">Công Ty / Đơn Vị</th>
                  <th className="pb-3 px-3">Trạng Thái</th>
                  <th className="pb-3 px-3">Ngày Tạo</th>
                  <th className="pb-3 px-3 text-right">Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* User info */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-blue-200 text-[#2563EB] font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {user.fullName ? user.fullName.charAt(0) : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-[#0F172A] text-sm">
                            {user.fullName || "Chưa đặt tên"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#64748B]">
                            <span className="flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-slate-400" />{" "}
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="py-4 px-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0
                          ? user.roles.map((r) => getRoleBadge(r))
                          : getRoleBadge("CANDIDATE")}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-4 px-3">
                      {user.companyName ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />{" "}
                          {user.companyName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Tài khoản cá nhân
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-3">{getStatusBadge(user.status)}</td>

                    {/* Date */}
                    <td className="py-4 px-3 text-xs text-[#64748B] font-mono">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === "ACTIVE" ? (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                user.id,
                                user.fullName,
                                "SUSPENDED"
                              )
                            }
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg transition-all shadow-xs"
                            title="Khóa tạm thời"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            Tạm Khóa
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                user.id,
                                user.fullName,
                                "ACTIVE"
                              )
                            }
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-all shadow-xs"
                            title="Mở khóa tài khoản"
                          >
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            Mở Khóa
                          </button>
                        )}

                        <button
                          onClick={() =>
                            handleDeleteUser(user.id, user.fullName)
                          }
                          disabled={isSubmitting}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
