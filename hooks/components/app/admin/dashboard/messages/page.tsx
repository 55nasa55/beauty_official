'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import MessagesTable from './MessagesTable';
import MessagesToolbar from './MessagesToolbar';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Parse query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'all';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    checkAuthAndLoadData();
  }, [page, limit, search, filter, sort]);

  async function checkAuthAndLoadData() {
    try {
      setIsLoading(true);

      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      // Check admin by email
      const email = session.user.email?.toLowerCase();
      if (!email) {
        router.push('/admin/login');
        return;
      }

      const { data: adminCheck } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!adminCheck) {
        router.push('/admin/login');
        return;
      }

      setAuthChecked(true);

      // Load messages
      await loadMessages();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        filter,
        sort,
      });

      const res = await fetch(`/api/admin/messages/list?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load messages");

      const json = await res.json();

      setMessages(json.messages || []);
      setTotalCount(json.totalCount || 0);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }

  if (isLoading || !authChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Messages</h1>

      <MessagesToolbar
        page={page}
        limit={limit}
        search={search}
        filter={filter}
        sort={sort}
        totalCount={totalCount}
      />

      <MessagesTable
        messages={messages}
        totalCount={totalCount}
        page={page}
        limit={limit}
        onRefresh={loadMessages}
      />
    </div>
  );
}
