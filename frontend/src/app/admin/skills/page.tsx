"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ArrowRightLeft,
  X,
  Loader2,
  Check,
  AlertCircle,
  Edit2,
  Tag
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchSkills,
  fetchCategories,
  fetchUnrecognizedSkills,
  createNewSkill,
  updateSkill,
  addSkillAlias,
  deleteSkillAlias,
  mapUnrecognizedSkill,
  approveUnrecognizedSkill,
  rejectUnrecognizedSkill,
  SkillData,
  SkillCategoryData,
  UnrecognizedSkillData
} from "@/lib/admin-api";

export default function AdminSkillsPage() {
  const [activeTab, setActiveTab] = useState<"database" | "unrecognized">("database");
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [categories, setCategories] = useState<SkillCategoryData[]>([]);
  const [unrecognized, setUnrecognized] = useState<UnrecognizedSkillData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  // Unrecognized Modals
  const [mappingItem, setMappingItem] = useState<UnrecognizedSkillData | null>(null);
  const [targetSkillId, setTargetSkillId] = useState("");
  const [approvingItem, setApprovingItem] = useState<UnrecognizedSkillData | null>(null);
  const [newSkillCategory, setNewSkillCategory] = useState("");

  // Manual Create Modal
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [manualSkillName, setManualSkillName] = useState("");
  const [manualCategoryId, setManualCategoryId] = useState("");

  // Edit Skill Modal
  const [editingSkill, setEditingSkill] = useState<SkillData | null>(null);
  const [editSkillName, setEditSkillName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  // Add Alias Modal
  const [addingAliasSkill, setAddingAliasSkill] = useState<SkillData | null>(null);
  const [newAliasName, setNewAliasName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [skillsData, categoriesData, unrecData] = await Promise.all([
        fetchSkills(selectedCategoryFilter || undefined, searchQuery || undefined),
        fetchCategories(),
        fetchUnrecognizedSkills()
      ]);
      setSkills(skillsData);
      setCategories(categoriesData);
      setUnrecognized(unrecData);
    } catch (err: unknown) {
      console.error("[AdminSkills] Error loading data:", err);
      setErrorMsg(err instanceof Error ? err.message : "Không thể nạp dữ liệu từ backend");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
    // Search is intentionally applied only by handleSearchSubmit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // --- ACTIONS ---

  const handleEditSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill || !editSkillName.trim() || !editCategoryId) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await updateSkill(token, editingSkill.id, {
        name: editSkillName.trim(),
        categoryId: editCategoryId
      });
      setSuccessMsg(`Đã cập nhật kỹ năng "${editSkillName}" thành công!`);
      setEditingSkill(null);
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Cập nhật kỹ năng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAliasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingAliasSkill || !newAliasName.trim()) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await addSkillAlias(token, addingAliasSkill.id, newAliasName.trim());
      setSuccessMsg(`Đã thêm alias "${newAliasName}" cho kỹ năng "${addingAliasSkill.name}"!`);
      setAddingAliasSkill(null);
      setNewAliasName("");
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Thêm Alias thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlias = async (aliasId: string, aliasName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa alias "${aliasName}"?`)) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await deleteSkillAlias(token, aliasId);
      setSuccessMsg(`Đã xóa alias "${aliasName}"!`);
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Xóa Alias thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMapSubmit = async () => {
    if (!mappingItem || !targetSkillId) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await mapUnrecognizedSkill(token, mappingItem.id, targetSkillId);
      setSuccessMsg(`Đã gán "${mappingItem.rawSkillName}" làm Alias thành công!`);
      setMappingItem(null);
      setTargetSkillId("");
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Map skill thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveSubmit = async () => {
    if (!approvingItem || !newSkillCategory) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await approveUnrecognizedSkill(token, approvingItem.id, newSkillCategory);
      setSuccessMsg(`Đã tạo Kỹ năng mới "${approvingItem.rawSkillName}" thành công!`);
      setApprovingItem(null);
      setNewSkillCategory("");
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Tạo skill thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (item: UnrecognizedSkillData) => {
    if (!confirm(`Bạn có chắc chắn muốn bỏ qua từ khóa "${item.rawSkillName}"?`)) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await rejectUnrecognizedSkill(token, item.id);
      setSuccessMsg(`Đã bỏ qua từ khóa "${item.rawSkillName}"`);
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSkillName.trim() || !manualCategoryId) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await createNewSkill(token, manualSkillName.trim(), manualCategoryId);
      setSuccessMsg(`Đã thêm kỹ năng "${manualSkillName}" thành công!`);
      setIsManualCreateOpen(false);
      setManualSkillName("");
      setManualCategoryId("");
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Tạo kỹ năng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Master Data & AI Skills
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Quản lý từ điển kỹ năng, phân loại ngành nghề và các từ khóa phụ (Aliases)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#E2E8F0] p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab("database")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "database"
                  ? "bg-white text-[#2563EB] font-bold shadow-sm"
                  : "text-[#64748B]"
              }`}
            >
              Từ điển Kỹ năng ({skills.length})
            </button>
            <button
              onClick={() => setActiveTab("unrecognized")}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === "unrecognized"
                  ? "bg-white text-rose-600 font-bold shadow-sm"
                  : "text-[#64748B]"
              }`}
            >
              Chờ xử lý
              {unrecognized.length > 0 && (
                <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {unrecognized.length}
                </span>
              )}
            </button>
          </div>
          {activeTab === "database" && (
            <button
              onClick={() => setIsManualCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Thêm Kỹ năng Mới
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-rose-400 hover:text-rose-700">
            <X className="w-4 h-4" />
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
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tab Views */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-blue-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-3" />
          <p className="text-xs font-semibold text-[#64748B]">
            Đang kết nối CSDL và tìm kiếm kỹ năng...
          </p>
        </div>
      ) : activeTab === "database" ? (
        <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm space-y-6">
          {/* Controls: Search & Category Filter */}
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
                placeholder="Tìm kiếm kỹ năng hoặc alias (ví dụ: Next15, Tailwind, SEO...)"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A]"
              />
            </div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full sm:w-72 px-3 py-2.5 text-sm bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A] font-medium"
            >
              <option value="">Tất cả Ngành nghề ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] text-white font-bold text-xs rounded-xl hover:bg-[#1D4ED8] transition-all shadow-sm"
            >
              Tìm Kiếm
            </button>
          </form>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] text-xs uppercase font-bold">
                  <th className="pb-3 px-2">Tên Kỹ Năng</th>
                  <th className="pb-3 px-2">Ngành Nghề / Danh Mục</th>
                  <th className="pb-3 px-2">Từ Khóa Phụ (Aliases)</th>
                  <th className="pb-3 px-2 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {skills.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-xs text-[#64748B] italic">
                      Không tìm thấy kỹ năng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  skills.map((skill) => (
                    <tr key={skill.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2">
                        <p className="font-bold text-[#0F172A] text-sm">{skill.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {skill.normalizedName}
                        </p>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-xs bg-[#EFF6FF] text-[#2563EB] px-2.5 py-1 rounded-md font-semibold border border-blue-100 inline-block">
                          {skill.category?.name ?? "Chưa phân loại"}
                        </span>
                      </td>
                      <td className="py-4 px-2 max-w-md">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {skill.aliases && skill.aliases.length > 0 ? (
                            skill.aliases.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-[#475569] px-2 py-0.5 rounded-md border border-[#E2E8F0] group hover:bg-rose-50 hover:border-rose-200 transition-colors"
                              >
                                {a.aliasName}
                                <button
                                  onClick={() => handleDeleteAlias(a.id, a.aliasName)}
                                  className="text-slate-400 group-hover:text-rose-600 ml-0.5"
                                  title="Xóa alias này"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa có alias</span>
                          )}
                          <button
                            onClick={() => {
                              setAddingAliasSkill(skill);
                              setNewAliasName("");
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Alias
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => {
                            setEditingSkill(skill);
                            setEditSkillName(skill.name);
                            setEditCategoryId(skill.categoryId);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#0F172A] text-xs font-semibold rounded-lg transition-all shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#2563EB]" />
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm">
          <div className="mb-6 pb-4 border-b border-[#E2E8F0]">
            <h2 className="text-base font-bold text-[#0F172A]">Từ khóa AI chưa nhận diện</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Danh sách từ khóa do AI trích xuất từ CV hoặc bài đăng tuyển dụng nhưng chưa có trong
              hệ thống.
            </p>
          </div>

          {unrecognized.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] bg-slate-50 rounded-xl border border-dashed border-[#E2E8F0]">
              🎉 Không có từ khóa nào chờ xử lý. Tất cả từ khóa đều đã được chuẩn hóa vào CSDL!
            </div>
          ) : (
            <div className="space-y-3">
              {unrecognized.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl hover:border-blue-300 transition-colors gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F172A] text-sm">{item.rawSkillName}</span>
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded">
                        Tần suất: {item.frequency} lần
                      </span>
                    </div>
                    {item.categoryHint && (
                      <p className="mt-1 text-xs text-slate-500">
                        Gợi ý phân loại: <span className="font-semibold">{item.categoryHint}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setMappingItem(item);
                        setTargetSkillId(skills[0]?.id ?? "");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-sm"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#2563EB]" />
                      Map vào Alias
                    </button>
                    <button
                      onClick={() => {
                        setApprovingItem(item);
                        setNewSkillCategory(categories[0]?.id ?? "");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg hover:bg-emerald-50 transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      Tạo Skill Mới
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Bỏ qua"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Edit Skill */}
      {editingSkill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleEditSkillSubmit}
            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#2563EB]" /> Sửa Thông Tin Kỹ Năng
              </h3>
              <button
                type="button"
                onClick={() => setEditingSkill(null)}
                className="text-slate-400 hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Tên Kỹ năng</label>
              <input
                type="text"
                required
                value={editSkillName}
                onChange={(e) => setEditSkillName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Ngành nghề / Danh mục</label>
              <select
                required
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setEditingSkill(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-50 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#1D4ED8] flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Add Alias to Skill */}
      {addingAliasSkill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddAliasSubmit}
            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#2563EB]" /> Thêm Alias Cho Kỹ Năng
              </h3>
              <button
                type="button"
                onClick={() => setAddingAliasSkill(null)}
                className="text-slate-400 hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Kỹ năng gốc: <strong className="text-[#0F172A]">{addingAliasSkill.name}</strong>
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">
                Tên từ khóa đồng nghĩa (Alias)
              </label>
              <input
                type="text"
                required
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                placeholder="Ví dụ: Next15, NextJS..."
                className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setAddingAliasSkill(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-50 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#1D4ED8] flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Thêm Alias
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Manual Create Skill */}
      {isManualCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleManualCreate}
            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="font-bold text-base text-[#0F172A]">Thêm Kỹ Năng Mới Vào CSDL</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Tên Kỹ năng</label>
              <input
                type="text"
                required
                value={manualSkillName}
                onChange={(e) => setManualSkillName(e.target.value)}
                placeholder="Ví dụ: PyTorch, LangChain..."
                className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Ngành nghề / Danh mục</label>
              <select
                required
                value={manualCategoryId}
                onChange={(e) => setManualCategoryId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A]"
              >
                <option value="">-- Chọn ngành nghề --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsManualCreateOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-50 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#1D4ED8] flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Lưu Kỹ Năng
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 4: Map Unrecognized Skill */}
      {mappingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-[#0F172A]">
              Map từ khóa &quot;{mappingItem.rawSkillName}&quot; vào Kỹ năng
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Chọn Kỹ năng Gốc</label>
              <select
                value={targetSkillId}
                onChange={(e) => setTargetSkillId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A]"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category?.name})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setMappingItem(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-50 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleMapSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#1D4ED8] flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận Map Alias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Approve Unrecognized Skill */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-[#0F172A]">
              Tạo Kỹ năng mới từ từ khóa &quot;{approvingItem.rawSkillName}&quot;
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Chọn Ngành nghề / Danh mục</label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setApprovingItem(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-50 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleApproveSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-700 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Tạo Kỹ Năng Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
