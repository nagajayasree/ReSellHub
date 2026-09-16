'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  images: string[];
  status: string;
  sellerId: { _id: string; name: string };
  createdAt: string;
}

async function fetchListing(id: string): Promise<Listing> {
  const res = await api.get(`/api/listings/${id}`);
  return res.data;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [activeImage, setActiveImage] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  const {
    data: listing,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
    enabled: !!id,
  });

  const startConversation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/conversations', { listingId: id });
      return res.data;
    },
    onSuccess: (conversation) => {
      router.push(`/messages/${conversation._id}`);
    },
  });

  function handleMessageSeller() {
    if (!user) {
      router.push('/login');
      return;
    }
    startConversation.mutate();
  }

  if (isLoading) {
    return <p className="p-6 text-gray-500">Loading...</p>;
  }

  if (isError || !listing) {
    return <p className="p-6 text-gray-500">Listing not found.</p>;
  }

  const isOwnListing = user?.id === listing.sellerId._id;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={listing.images[activeImage]}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {listing.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {listing.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 ${
                    i === activeImage ? 'border-black' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            ${listing.price}
          </p>

          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {listing.category}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {listing.condition}
            </span>
          </div>

          <p className="mt-6 whitespace-pre-wrap text-sm text-gray-700">
            {listing.description}
          </p>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              Sold by{' '}
              <span className="font-medium text-gray-900">
                {listing.sellerId.name}
              </span>
            </p>
          </div>

          {!isOwnListing && (
            <button
              type="button"
              onClick={handleMessageSeller}
              disabled={startConversation.isPending}
              className="mt-6 w-full rounded-md bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {startConversation.isPending
                ? 'Starting chat...'
                : 'Message seller'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
