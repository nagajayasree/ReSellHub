'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from './lib/api';

interface Listing {
  _id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/listings')
      .then((res) => setListings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-6 text-gray-500">Loading listings...</p>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Browse listings</h1>

      {listings.length === 0 ? (
        <p className="text-gray-500">
          No listings yet — be the first to add one.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {listings.map((listing) => (
            <Link
              key={listing._id}
              href={`/listings/${listing._id}`}
              className="group"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 200px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <h3 className="mt-2 truncate text-sm font-medium text-gray-900">
                {listing.title}
              </h3>
              <p className="text-sm font-semibold text-gray-900">
                ${listing.price}
              </p>
              <p className="text-xs text-gray-500">{listing.condition}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
