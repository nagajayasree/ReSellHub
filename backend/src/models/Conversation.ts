import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  listingId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  lastMessageAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// one conversation per buyer/listing pair
conversationSchema.index({ listingId: 1, buyerId: 1 }, { unique: true });

export default mongoose.model<IConversation>('Conversation', conversationSchema);