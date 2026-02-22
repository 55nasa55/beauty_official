'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MessageDrawer from './MessageDrawer';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface MessagesTableProps {
  messages: ContactMessage[];
  onRefresh: () => Promise<void>;
}

export default function MessagesTable({ messages, onRefresh }: MessagesTableProps) {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedMessage(null);
  };

  const handleMarkAsRead = async () => {
    await onRefresh();
    handleCloseDrawer();
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Messages</h1>
          <Button onClick={onRefresh} variant="outline">
            Refresh
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No messages yet
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow
                    key={message.id}
                    className={message.read ? '' : 'font-semibold bg-blue-50'}
                  >
                    <TableCell>{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell>{message.subject}</TableCell>
                    <TableCell>
                      {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {message.read ? (
                        <span className="text-gray-500">Read</span>
                      ) : (
                        <Badge variant="secondary" className="bg-blue-500 text-white">
                          Unread
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleViewMessage(message)}
                        variant="outline"
                        size="sm"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedMessage && (
        <MessageDrawer
          message={selectedMessage}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </>
  );
}
