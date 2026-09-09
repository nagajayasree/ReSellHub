import mongoose, { Schema, Document, Types } from 'mongoose';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';

export interface IOffer extends Document {
  conversationId: Types.ObjectId;
  listingId: Types.ObjectId;
  amount: number;
  status: OfferStatus;
  createdBy: Types.ObjectId;
  parentOfferId?: Types.ObjectId;
}

const offerSchema = new Schema<IOffer>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'countered', 'expired'],
      default: 'pending',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentOfferId: { type: Schema.Types.ObjectId, ref: 'Offer' },
  },
  { timestamps: true }
);

offerSchema.index({ conversationId: 1, status: 1 });

export default mongoose.model<IOffer>('Offer', offerSchema);