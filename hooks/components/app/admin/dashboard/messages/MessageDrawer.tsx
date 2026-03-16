'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface MessageDrawerProps {
  message: ContactMessage;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: () => Promise<void>;
}

export default function MessageDrawer({
  message,
  isOpen,
  onClose,
  onMarkAsRead,
}: MessageDrawerProps) {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAsRead = async () => {
    if (message.read) return;

    try {
      setIsMarking(true);

      const response = await fetch('/api/admin/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: message.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      await onMarkAsRead();
    } catch (error) {
      console.error('Error marking message as read:', error);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Message Details</SheetTitle>
          <SheetDescription>
            Received {format(new Date(message.created_at), 'MMMM d, yyyy h:mm a')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
            <p className="text-base">{message.name}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
            <a
              href={`mailto:${message.email}`}
              className="text-base text-blue-600 hover:underline"
            >
              {message.email}
            </a>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Subject</h3>
            <p className="text-base font-medium">{message.subject}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Message</h3>
            <p className="text-base whitespace-pre-wrap">{message.message}</p>
          </div>

          <Separator />

          <div className="flex gap-2">
            {!message.read && (
              <Button
                onClick={handleMarkAsRead}
                disabled={isMarking}
                className="flex-1"
              >
                {isMarking ? 'Marking...' : 'Mark as Read'}
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
