import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin by email
    const email = session.user.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get message ID from request body
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Update message as read
    const { error: updateError } = await supabase
      .from('contact_messages')
      .update({ read: true })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}
