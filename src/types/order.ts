export type OrderStatus =
  | "placed"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderItemView {
  id?: string;
  productId: string | null;
  productName: string;
  unit?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  buyerId?: string;
  sellerId?: string;
  sellerName?: string;
  buyerName?: string;
  type?: "retail" | "bulk";
  status: OrderStatus;
  totalAmount: number;
  deliveryMode: "delivery" | "pickup";
  deliveryAddress?: string | null;
  estimatedWindow?: string;
  deliveryAgentId?: string | null;
  agentName?: string | null;
  createdAt: string;
  paymentProvider?: string | null;
  paymentStatus?: string | null;
  payerMomoNumber?: string | null;
  channelUssd?: string | null; // Monetbil USSD hint shown while awaiting approval
  items: OrderItemView[];
}
