'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';

interface Conversation {
  _id: string;
  listingId: { _id: string; title: string; images: string[]; price: number };
  buyerId: { _id: string; name: string };
  sellerId: { _id: string; name: string };
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'offer';
  body: string;
  createdAt: string;
}

async function fetchConversation(id: string): Promise<Conversation> {
  const res = await api.get(`/api/conversations/${id}`);
  return res.data;
}

async function fetchMessages(id: string): Promise<Message[]> {
  const res = await api.get(`/api/conversations/${id}/messages`);
  return res.data;
}

export default function ConversationThreadPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => fetchConversation(id),
    enabled: !!id && !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => fetchMessages(id),
    enabled: !!id && !!user,
    refetchInterval: 5000, // simple polling until real-time WebSockets land
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (body: string) => {
      const res = await api.post(`/api/conversations/${id}/messages`, { body });
      return res.data;
    },
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  function handleSend() {
    if (!text.trim()) return;
    sendMessage.mutate(text);
  }

  if (authLoading || !user) {
    return null;
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-73px)] max-w-2xl flex-col px-6 py-6">
      {conversation && (
        <div className="mb-4 border-b border-gray-200 pb-4">
          <Link
            href={`/listings/${conversation.listingId._id}`}
            className="text-sm text-gray-500 hover:underline"
          >
            {conversation.listingId.title} - $ {conversation.listingId.price}
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">
            {conversation.buyerId._id === user.id
              ? conversation.sellerId.name
              : conversation.buyerId.name}
          </h1>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {messages?.map((message) => {
          const isMine = message.senderId === user.id;
          return (
            <div
              key={message._id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                  isMine ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-200 pt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <button
          onClick={handleSend}
          disabled={sendMessage.isPending || !text.trim()}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}
