'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Calendar,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  type NotificationItem,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/notification-api';
import { createClient } from '@/lib/supabase/client';

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await getUnreadNotificationCount(session.access_token);
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignore background fetch error
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await getMyNotifications(session.access_token, { limit: 10 });
      setNotifications(res.data);
      setUnreadCount(res.meta.unreadCount);
    } catch {
      // Ignore fetch error
    } finally {
      setLoading(false);
    }
  };

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll unread count every 30s as a fallback
    const interval = setInterval(fetchUnreadCount, 30000);

    // Subscribe to realtime database changes for instant notification updates
    const supabase = createClient();
    let channel: any = null;

    const setupRealtime = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      channel = supabase
        .channel('candidate_notifications_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: userId ? `recipient_user_id=eq.${userId}` : undefined,
          },
          () => {
            fetchUnreadCount();
            if (isOpenRef.current) {
              fetchNotifications();
            }
          },
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await markAllNotificationsAsRead(session.access_token);
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() })),
      );
    } catch {
      // Ignore error
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    try {
      if (item.status === 'UNREAD') {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          await markNotificationAsRead(session.access_token, item.id);
          setUnreadCount((c) => Math.max(0, c - 1));
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === item.id ? { ...n, status: 'READ' as const } : n,
            ),
          );
        }
      }
    } catch {
      // Ignore error
    }

    setIsOpen(false);
    router.push('/candidate/applications');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'INTERVIEW_SCHEDULED':
        return <Calendar className="size-4 text-[#2563EB]" />;
      case 'MATCHING_COMPLETED':
        return <Sparkles className="size-4 text-emerald-600" />;
      default:
        return <Info className="size-4 text-[#2563EB]" />;
    }
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
        className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-[#EFF6FF] hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100 active:scale-95"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-[#EFF6FF]/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#1F2937]">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
              >
                <CheckCheck className="size-3.5" /> Đã đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-xs">
                <Loader2 className="size-4 animate-spin text-[#2563EB]" /> Đang tải thông báo...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                    item.status === 'UNREAD' ? 'bg-[#EFF6FF]/40 font-medium' : 'bg-white text-slate-600'
                  }`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${
                      item.status === 'UNREAD'
                        ? 'border-blue-200 bg-white shadow-xs'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          item.status === 'UNREAD'
                            ? 'font-bold text-[#1F2937]'
                            : 'font-semibold text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.status === 'UNREAD' && (
                        <span className="size-2 shrink-0 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                      <Clock className="size-3" />
                      <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400 space-y-1">
                <Bell className="size-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-semibold">Bạn chưa có thông báo nào</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
            <Link
              href="/candidate/applications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
            >
              Xem tất cả đơn ứng tuyển <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
