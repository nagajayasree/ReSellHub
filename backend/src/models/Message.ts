import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: 'text' | 'offer';
  body?: string;
  offerId?: Types.ObjectId;
  readAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'offer'], default: 'text' },
    body: { type: String },
    offerId: { type: Schema.Types.ObjectId, ref: 'Offer' },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// fetching a thread in order is the hot path — index for it
messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);