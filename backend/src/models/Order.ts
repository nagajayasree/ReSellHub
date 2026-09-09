import mongoose, { Schema, Document, Types } from 'mongoose';

export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'completed';

export interface IOrder extends Document {
  offerId: Types.ObjectId;
  listingId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  amount: number;
  status: OrderStatus;
}

const orderSchema = new Schema<IOrder>(
  {
    offerId: { type: Schema.Types.ObjectId, ref: 'Offer', required: true, unique: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'shipped', 'completed'],
      default: 'pending_payment',
    },
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1 });
orderSchema.index({ sellerId: 1 });

export default mongoose.model<IOrder>('Order', orderSchema);