import React, { useState } from "react";
import { X, User, Users, Building, Briefcase, Mail, CheckCircle } from "lucide-react";
import type { RecruiterProfileData } from "@/lib/recruiter-api";
import { updateRecruiterProfile } from "@/lib/recruiter-api";
import { createClient } from "@/lib/supabase/client";

interface RecruiterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RecruiterProfileData | null;
  onProfileUpdated?: (updatedProfile: RecruiterProfileData) => void;
}

export function RecruiterProfileModal({ isOpen, onClose, profile, onProfileUpdated }: RecruiterProfileModalProps) {
  const [title, setTitle] = useState(profile?.title || "");
  const [fullName, setFullName] = useState(profile?.user?.fullName || "");
  const [phone, setPhone] = useState(profile?.user?.phone || "");
  const [birthDay, setBirthDay] = useState(
    profile?.user?.birthDay ? new Date(profile.user.birthDay).toISOString().split("T")[0] : ""
  );
  const [avatarUrl, setAvatarUrl] = useState(profile?.user?.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  React.useEffect(() => {
    if (profile) {
      setTitle(profile.title || "");
      setFullName(profile.user?.fullName || "");
      setPhone(profile.user?.phone || "");
      setBirthDay(
        profile.user?.birthDay ? new Date(profile.user.birthDay).toISOString().split("T")[0] : ""
      );
      setAvatarUrl(profile.user?.avatarUrl || "");
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Sync Supabase Auth metadata
        await supabase.auth.updateUser({
          data: { full_name: fullName, name: fullName }
        });

        const updatedProfile = await updateRecruiterProfile(session.access_token, {
          title,
          fullName,
          phone,
          birthDay: birthDay ? birthDay : undefined,
          avatarUrl: avatarUrl ? avatarUrl : undefined,
        });

        if (onProfileUpdated) {
          onProfileUpdated(updatedProfile);
        }

        setSuccessMsg("Cập nhật hồ sơ thành công!");
        setTimeout(() => {
          setIsSaving(false);
          onClose();
        }, 400);
      }
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Hồ Sơ Cá Nhân
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="h-16 w-16 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center font-bold text-2xl text-slate-500">
              {profile?.user?.avatarUrl ? (
                <img src={profile.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.user?.fullName ? profile.user.fullName.charAt(0).toUpperCase() : "R"
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Nhập họ tên của bạn"
              />
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
                <Mail className="w-4 h-4" />
                {profile?.user?.email}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Chức danh (Title)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="VD: Senior Talent Acquisition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  📞 Số điện thoại
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
                  placeholder="VD: 0901234567"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  🎂 Ngày sinh
                </label>
                <input
                  type="date"
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                🖼️ Link Ảnh đại diện (Avatar URL)
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Công ty
                </label>
                <div className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed">
                  {profile?.company?.name || "Chưa gắn công ty"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Phòng ban
                </label>
                <div className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed">
                  {profile?.department?.name || "Chưa gắn phòng ban"}
                </div>
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {successMsg}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
