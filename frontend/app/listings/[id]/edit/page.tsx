'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
// import api from '@/lib/api';
// import { useAuth } from '@/context/AuthContext';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

const CATEGORIES = [
  'Clothing',
  'Shoes',
  'Accessories',
  'Electronics',
  'Home',
  'Sports',
  'Toys',
  'Books',
  'Beauty',
  'Health',
  'Furniture',
  'Other',
];
const CONDITIONS = ['New with tags', 'Like new', 'Good', 'Fair', 'Well loved'];

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  images: string[];
}

interface NewImageFile {
  file: File;
  previewUrl: string;
}

async function fetchListing(id: string): Promise<Listing> {
  const res = await api.get(`/api/listings/${id}`);
  return res.data;
}

export default function EditListingPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
    enabled: !!id,
  });

  if (authLoading || !user || isLoading || !listing) {
    return null;
  }

  // Only mounts once `listing` exists, so the form's useState calls
  // below read the real values on their first render — no sync effect needed.
  return <EditListingForm id={id} listing={listing} />;
}

function EditListingForm({ id, listing }: { id: string; listing: Listing }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [category, setCategory] = useState(listing.category);
  const [condition, setCondition] = useState(listing.condition);
  const [price, setPrice] = useState(String(listing.price));
  const [existingImages, setExistingImages] = useState<string[]>(
    listing.images,
  );
  const [newImages, setNewImages] = useState<NewImageFile[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');

  const totalImages = existingImages.length + newImages.length;

  const updateListing = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('price', price);
      formData.append('existingImages', JSON.stringify(existingImages));
      newImages.forEach((img) => formData.append('images', img.file));

      const res = await api.patch(`/api/listings/${id}`, formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      router.push('/listings/mine');
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : undefined;
      setError(message || 'Something went wrong');
    },
  });

  async function handleFileSelect(fileList: FileList | null) {
    if (!fileList) return;
    const remainingSlots = 5 - totalImages;
    const selected = Array.from(fileList).slice(0, remainingSlots);

    setCompressing(true);
    setError('');

    try {
      const compressed = await Promise.all(
        selected.map(async (file) => {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          });
          return {
            file: compressedFile,
            previewUrl: URL.createObjectURL(compressedFile),
          };
        }),
      );
      setNewImages((prev) => [...prev, ...compressed]);
    } catch (err) {
      console.error(err);
      setError('Could not process one or more images');
    } finally {
      setCompressing(false);
    }
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleSubmit() {
    setError('');
    if (totalImages === 0) {
      setError('Keep at least one photo');
      return;
    }
    if (!title || !description || !price) {
      setError('Fill in all fields');
      return;
    }
    updateListing.mutate();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit listing</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        {error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Photos ({totalImages}/5)
          </label>
          <div className="grid grid-cols-5 gap-3">
            {existingImages.map((url, i) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- existing remote URL */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}

            {newImages.map((img, i) => (
              <div
                key={img.previewUrl}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img
                  src={img.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}

            {totalImages < 5 && (
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 hover:border-gray-400">
                {compressing ? '...' : '+ Add'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={compressing}
                  className="hidden"
                  onChange={(e) => {
                    handleFileSelect(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="description"
            className="text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="category"
              className="text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="condition"
              className="text-sm font-medium text-gray-700"
            >
              Condition
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="price" className="text-sm font-medium text-gray-700">
            Price (USD)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={updateListing.isPending || compressing}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {updateListing.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </main>
  );
}
