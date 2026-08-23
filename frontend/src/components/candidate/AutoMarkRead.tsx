'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { markAllNotificationsAsRead } from '@/lib/notification-api';

export function AutoMarkRead() {
  useEffect(() => {
    const markRead = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          await markAllNotificationsAsRead(session.access_token);
        }
      } catch {
        // Ignore background error
      }
    };

    const timer = setTimeout(markRead, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
