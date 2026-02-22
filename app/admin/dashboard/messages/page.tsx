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
      // Calculate range for pagination
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      // Build query
      let query = supabase
        .from('contact_messages')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
      }

      // Apply read/unread filter
      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter === 'read') {
        query = query.eq('read', true);
      } else if (filter === '30days') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', thirtyDaysAgo);
      }

      // Apply sorting
      if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      setMessages(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading messages:', error);
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
