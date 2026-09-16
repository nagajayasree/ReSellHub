'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface ConversationListItem {
  _id: string;
  listingId: { _id: string; title: string; images: string[] };
  buyerId: { _id: string; name: string };
  sellerId: { _id: string; name: string };
  lastMessageAt: string;
  lastMessage: { body: string; type: string; createdAt: string } | null;
}

async function fetchConversations(): Promise<ConversationListItem[]> {
  const res = await api.get('/api/conversations');
  return res.data;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    enabled: !!user,
  });

  if (authLoading || !user) {
    return null;
  }

  if (isLoading) {
    return <p className="p-6 text-gray-500">Loading messages...</p>;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Messages</h1>

      {!conversations || conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-200 rounded-lg border border-gray-200">
          {conversations.map((conversation) => {
            const otherParty =
              conversation.buyerId._id === user.id ? conversation.sellerId : conversation.buyerId;

            return (
              <Link
                key={conversation._id}
                href={`/messages/${conversation._id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <Image
                    src={conversation.listingId.images[0]}
                    alt={conversation.listingId.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{conversation.listingId.title}</p>
                  <p className="truncate text-sm text-gray-500">
                    {otherParty.name}
                    {conversation.lastMessage ? ` · ${conversation.lastMessage.body}` : ''}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}