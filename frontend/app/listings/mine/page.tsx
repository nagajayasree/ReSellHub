'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Listing {
  _id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  status: string;
}

async function fetchMyListings(): Promise<Listing[]> {
  const res = await api.get('/api/listings/mine');
  return res.data;
}

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', 'mine'],
    queryFn: fetchMyListings,
    enabled: !!user,
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  if (authLoading || !user) {
    return null;
  }

  if (isLoading) {
    return <p className="p-6 text-gray-500">Loading your listings...</p>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link
          href="/listings/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Item
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <p className="text-gray-500">You haven&apos;t listed anything yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <div
              key={listing._id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <p className="font-medium text-gray-900">{listing.title}</p>
                <p className="text-sm text-gray-500">
                  ${listing.price} · {listing.condition} · {listing.status}
                </p>
              </div>

              <Link
                href={`/listings/${listing._id}/edit`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit
              </Link>
              <button
                onClick={() => {
                  if (confirm('Delete this listing?')) {
                    deleteListing.mutate(listing._id);
                  }
                }}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
