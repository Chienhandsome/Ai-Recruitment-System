'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Calendar,
  Clock,
  Video,
  User,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  type NotificationItem,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/notification-api';
import { type InterviewData, getInterviews } from '@/lib/interview-api';
import { createClient } from '@/lib/supabase/client';

interface RecruiterNotificationBellProps {
  token: string;
  onNavigateToInterviews?: () => void;
}

export function RecruiterNotificationBell({
  token,
  onNavigateToInterviews,
}: RecruiterNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [todayInterviews, setTodayInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [notifRes, countRes, interviewsRes] = await Promise.all([
        getMyNotifications(token, { limit: 15 }),
        getUnreadNotificationCount(token),
        getInterviews(token, { limit: 50 }),
      ]);

      setNotifications(notifRes.data || []);
      setUnreadCount(countRes.unreadCount || 0);

      // Filter today's interviews
      const todaySessions = (interviewsRes.data || []).filter((it) => {
        const d = parseISO(it.scheduledAt);
        return isToday(d) && it.status !== 'CANCELLED' && it.status !== 'COMPLETED';
      });
      setTodayInterviews(todaySessions);
    } catch (err) {
      console.error('Failed to load recruiter notifications or interviews:', err);
    }
  }, [token]);

  useEffect(() => {
    loadData();
    // Poll every 5 seconds as fallback
    const interval = setInterval(loadData, 5000);

    // Subscribe to realtime changes on notifications & interviews
    const supabase = createClient();
    const channel = supabase
      .channel('recruiter_notifications_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => loadData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interviews' },
        () => loadData(),
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsAsRead(token);
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() })),
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!token) return;
    if (item.status === 'UNREAD') {
      try {
        await markNotificationAsRead(token, item.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, status: 'READ' as const } : n)),
        );
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }

    if (
      item.type === 'INTERVIEW_SCHEDULED' ||
      item.title.toLowerCase().includes('phỏng vấn') ||
      item.message.toLowerCase().includes('phỏng vấn')
    ) {
      setIsOpen(false);
      onNavigateToInterviews?.();
    }
  };

  const totalBadgeCount = unreadCount + todayInterviews.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center focus:outline-none ${
          isOpen
            ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
            : todayInterviews.length > 0
            ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 ring-2 ring-amber-400/30'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#2563EB]'
        }`}
        title={
          todayInterviews.length > 0
            ? `Hôm nay bạn có ${todayInterviews.length} buổi phỏng vấn!`
            : 'Thông báo tuyển dụng'
        }
      >
        <Bell className="w-5 h-5" />

        {/* Pulsing indicator if today has interviews */}
        {todayInterviews.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        )}

        {/* Counter Badge */}
        {totalBadgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-xs">
            {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2563EB]" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#1F2937]">
                Thông Báo & Lịch Phỏng Vấn
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Đã đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-100">
            {/* 1. TOP SPECIAL HIGHLIGHT: TODAY'S INTERVIEWS */}
            {todayInterviews.length > 0 && (
              <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/60 border-b border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#2563EB] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    HÔM NAY: {todayInterviews.length} BUỔI PHỎNG VẤN
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    CẦN THỰC HIỆN
                  </span>
                </div>

                <div className="space-y-1.5">
                  {todayInterviews.map((it) => {
                    const date = parseISO(it.scheduledAt);
                    const cand = it.application?.candidate;
                    const job = it.application?.job;

                    return (
                      <div
                        key={it.id}
                        onClick={() => {
                          setIsOpen(false);
                          onNavigateToInterviews?.();
                        }}
                        className="p-2.5 rounded-xl bg-white border border-blue-200 shadow-2xs hover:border-[#2563EB] transition-all cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-[#1F2937] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                            {format(date, 'HH:mm')}
                            <span className="text-slate-400 font-normal">({it.durationMinutes}p)</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-100">
                            {it.title}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <span className="font-bold text-[#1F2937] truncate max-w-[180px]">
                            {cand?.fullName || 'Ứng viên'}
                          </span>
                          <span className="text-[11px] text-[#2563EB] font-semibold truncate max-w-[140px]">
                            {job?.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. NOTIFICATIONS LIST */}
            {notifications.length > 0 ? (
              notifications.map((item) => {
                const isUnread = item.status === 'UNREAD';
                const isInterviewNotif =
                  item.type === 'INTERVIEW_SCHEDULED' ||
                  item.title.toLowerCase().includes('phỏng vấn');

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      isUnread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isInterviewNotif
                          ? 'bg-blue-100 text-[#2563EB]'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isInterviewNotif ? (
                        <Calendar className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          className={`text-xs ${
                            isUnread ? 'font-black text-[#1F2937]' : 'font-bold text-slate-700'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <span className="text-[10px] text-slate-400 block pt-0.5 font-medium">
                        {format(new Date(item.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : todayInterviews.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1.5">
                <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-bold text-slate-600">Bạn chưa có thông báo mới</p>
                <p className="text-[11px] text-slate-400">
                  Các thông tin về lịch phỏng vấn và phản hồi ứng viên sẽ hiển thị tại đây.
                </p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateToInterviews?.();
              }}
              className="text-xs font-extrabold text-[#2563EB] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <span>Xem toàn bộ Lịch phỏng vấn</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
