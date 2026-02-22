'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import MessagesTable from './MessagesTable';

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
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

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
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);
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

  return <MessagesTable messages={messages} onRefresh={loadMessages} />;
}
