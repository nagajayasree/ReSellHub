import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IListing extends Document {
  sellerId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  images: string[];
  status: 'active' | 'sold' | 'removed';
}

const listingSchema = new Schema<IListing>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    condition: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }],
    status: { type: String, enum: ['active', 'sold', 'removed'], default: 'active' },
  },
  { timestamps: true }
);

listingSchema.index({ category: 1, condition: 1, price: 1 });
listingSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IListing>('Listing', listingSchema);