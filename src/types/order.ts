import type { Product } from "./product";

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  deliveryMode: "pickup" | "delivery";
  deliveryAddress?: string;
  paymentProvider: "MTN MoMo" | "Orange Money";
  phone: string;
  totalAmount: number;
  status: "Confirmed"; // will expand to Out for Delivery / Delivered once tracking is built
  estimatedWindow: string;
  createdAt: string;
}