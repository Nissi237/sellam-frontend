import { api } from "./client";
import type { Product } from "../types/product";
import type { Order } from "../types/order";
import type { User } from "../types/auth";

// -------- Media upload --------
export const uploadFile = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api
    .post<{ url: string; type: "image" | "video" }>("/media", fd)
    .then((r) => r.data);
};

// -------- Auth --------
export interface AuthResponse {
  token: string;
  user: User;
}
export const requestOtp = (phone: string) =>
  api.post("/auth/otp/request", { phone });

export const registerUser = (payload: Record<string, unknown>) =>
  api.post<AuthResponse>("/auth/register", payload).then((r) => r.data);

export const loginUser = (payload: Record<string, unknown>) =>
  api.post<AuthResponse>("/auth/login", payload).then((r) => r.data);

// Admin authenticates through a separate door (see backend src/auth/admin).
export const adminLogin = (email: string, password: string) =>
  api.post<AuthResponse>("/admin/auth/login", { email, password }).then((r) => r.data);

export const fetchMe = () =>
  api.get<{ user: User }>("/auth/me").then((r) => r.data.user);

// -------- Products --------
export const fetchProducts = (params?: Record<string, unknown>) =>
  api.get<{ products: Product[] }>("/products", { params }).then((r) => r.data.products);

export const fetchProduct = (id: string) =>
  api.get<{ product: Product }>(`/products/${id}`).then((r) => r.data.product);

export const fetchCompare = (id: string) =>
  api.get<{ products: Product[] }>(`/products/${id}/compare`).then((r) => r.data.products);

export const fetchMyProducts = () =>
  api.get<{ products: Product[] }>("/products/mine").then((r) => r.data.products);

export const createProduct = (payload: Record<string, unknown>) =>
  api.post<{ product: Product }>("/products", payload).then((r) => r.data.product);

export const updateProduct = (id: string, payload: Record<string, unknown>) =>
  api.patch<{ product: Product }>(`/products/${id}`, payload).then((r) => r.data.product);

export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

// -------- Orders --------
export const createOrder = (payload: Record<string, unknown>) =>
  api.post<{ orders: Order[] }>("/orders", payload).then((r) => r.data.orders);

export const fetchOrders = (as?: "buyer" | "seller") =>
  api.get<{ orders: Order[] }>("/orders", { params: as ? { as } : {} }).then((r) => r.data.orders);

export const fetchOrder = (id: string) =>
  api.get<{ order: Order }>(`/orders/${id}`).then((r) => r.data.order);

export const updateOrderStatus = (id: string, status: string) =>
  api.patch<{ order: Order }>(`/orders/${id}/status`, { status }).then((r) => r.data.order);

// Poll a real (Monetbil) Mobile Money charge until it settles.
export const verifyPayment = (orderId: string) =>
  api
    .post<{ status: string; paymentStatus: string }>(`/orders/${orderId}/verify-payment`)
    .then((r) => r.data);

// -------- Mobile Money accounts --------
export interface MomoAccount {
  id: string;
  provider: "MTN MoMo" | "Orange Money";
  momoNumber: string;
  accountName: string | null;
  isDefault: boolean;
  createdAt: string;
}
export const fetchMomoAccounts = () =>
  api.get<{ accounts: MomoAccount[] }>("/me/momo-accounts").then((r) => r.data.accounts);

export const addMomoAccount = (payload: {
  provider: string;
  momoNumber: string;
  accountName?: string;
  isDefault?: boolean;
}) => api.post<{ account: MomoAccount }>("/me/momo-accounts", payload).then((r) => r.data.account);

export const setDefaultMomoAccount = (id: string) =>
  api.patch(`/me/momo-accounts/${id}/default`);

export const deleteMomoAccount = (id: string) =>
  api.delete(`/me/momo-accounts/${id}`);

// -------- Reviews --------
export interface Review {
  id: string;
  orderId: string;
  productId: string | null;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string | null;
  status?: string;
  sellerResponse?: string | null;
  evidence?: string[];
  createdAt: string;
}
export const fetchReviews = (params: { productId?: string; sellerId?: string }) =>
  api.get<{ reviews: Review[] }>("/reviews", { params }).then((r) => r.data.reviews);

export const createReview = (payload: {
  orderId: string;
  productId?: string;
  rating: number;
  comment?: string;
  evidencePhotos?: string[];
  authenticityConcern?: boolean;
}) => api.post<{ review: Review; held: boolean }>("/reviews", payload).then((r) => r.data);

export const respondToReview = (id: string, response: string) =>
  api.post(`/reviews/${id}/response`, { response });
export const disputeReview = (id: string, reason: string) =>
  api.post(`/reviews/${id}/dispute`, { reason });

// -------- Origin claims (FR-41) --------
export const submitOriginClaim = (
  productId: string,
  payload: { claim: string; documentType?: string; fileUrl: string }
) => api.post(`/products/${productId}/origin-claim`, payload);

// -------- Admin moderation (FR-39/40/42/43) --------
export interface FlaggedReview {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  buyerName: string;
  sellerName: string;
  reasons: string[];
  evidence: string[];
  createdAt: string;
}
export interface OriginDoc {
  id: string;
  claim: string;
  documentType: string | null;
  fileUrl: string;
  productId: string;
  productName: string;
  sellerName: string;
}
export interface DuplicateFlag {
  productId: string;
  productName: string;
  photoUrl: string;
  sellerName: string;
  matchedProductId: string | null;
  matchedProductName: string | null;
  matchedSeller: string | null;
}
export const adminListReviews = () =>
  api.get<{ reviews: FlaggedReview[] }>("/admin/reviews").then((r) => r.data.reviews);
export const adminResolveReview = (id: string, decision: "publish" | "remove") =>
  api.post(`/admin/reviews/${id}/resolve`, { decision });
export const adminListOriginDocs = () =>
  api.get<{ documents: OriginDoc[] }>("/admin/origin-documents").then((r) => r.data.documents);
export const adminVerifyOrigin = (id: string, decision: "verified" | "rejected") =>
  api.post(`/admin/origin-documents/${id}/verify`, { decision });
export const adminListDuplicates = () =>
  api.get<{ flags: DuplicateFlag[] }>("/admin/duplicate-images").then((r) => r.data.flags);
export const adminResolveDuplicate = (id: string, decision: "clear" | "remove") =>
  api.post(`/admin/products/${id}/image-resolve`, { decision });

// -------- Analytics (FR-24/25/31) + seller verification (FR-23) --------
export interface SellerAnalytics {
  salesTotal: number;
  salesThisWeek: number;
  orderCount: number;
  repeatBuyerRate: number;
  topProducts: { name: string; qty: number; revenue: number }[];
}
export interface CorporateAnalytics {
  spendTotal: number;
  spendThisMonth: number;
  orderCount: number;
  suppliers: { sellerName: string; orders: number; reliability: number; spend: number }[];
}
export interface MarketInsights {
  totalGMV: number;
  orderCount: number;
  activeSellers: number;
  activeBuyers: number;
  categories: { category: string; orders: number; revenue: number; avgPrice: number }[];
}
export interface Payout {
  orderId: string;
  provider: string | null;
  momoNumber: string | null;
  grossAmount: number;
  commission: number;
  amount: number;
  status: "pending" | "paid" | "failed" | "skipped";
  transactionRef: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}
export const fetchMyPayouts = () =>
  api.get<{ payouts: Payout[] }>("/payments/payouts/mine").then((r) => r.data.payouts);
export const retryPayout = (orderId: string) =>
  api.post<{ payout: Payout }>(`/payments/payouts/${orderId}/retry`).then((r) => r.data.payout);

export interface AdminPayout extends Payout {
  sellerName: string;
}
export interface PayoutSummary {
  paid: { count: number; amount: number };
  pending: { count: number; amount: number };
  failed: { count: number; amount: number };
  skipped: { count: number; amount: number };
}
export const adminListPayouts = (status?: string) =>
  api
    .get<{ summary: PayoutSummary; payouts: AdminPayout[] }>("/admin/payouts", {
      params: status ? { status } : {},
    })
    .then((r) => r.data);

export const getSellerAnalytics = () =>
  api.get<SellerAnalytics>("/analytics/seller").then((r) => r.data);
export const getCorporateAnalytics = () =>
  api.get<CorporateAnalytics>("/analytics/corporate").then((r) => r.data);
export const getMarketInsights = () =>
  api.get<MarketInsights>("/admin/insights").then((r) => r.data);

// ---- Dashboard analytics (seller graphs/calendar/Kanban) ----
export interface DailyPoint { date: string; sales: number; transactions: number }
export interface WeeklyPoint { week: string; sales: number; transactions: number }
export interface SellerProductStat {
  id: string;
  name: string;
  unit: string;
  stock: number;
  unitsSold: number;
  revenue: number;
}
export interface SellerDashboard {
  daily: DailyPoint[];
  weekly: WeeklyPoint[];
  products: SellerProductStat[];
}
export const getSellerDashboard = () =>
  api.get<SellerDashboard>("/analytics/seller/dashboard").then((r) => r.data);

// ---- Admin: accounts + platform progression ----
export interface Account {
  id: string;
  fullName: string;
  role: "individual_buyer" | "seller" | "corporate_buyer" | "admin" | "delivery_agent";
  email: string | null;
  phone: string | null;
  createdAt: string;
  ordersAsBuyer: number;
  ordersAsSeller: number;
  productCount: number;
}
export interface AccountsResponse {
  total: number;
  roleCounts: Record<string, number>;
  accounts: Account[];
}
export const adminListAccounts = () =>
  api.get<AccountsResponse>("/admin/accounts").then((r) => r.data);

export interface Progression {
  totals: { users: number; products: number; orders: number; gmv: number };
  signups: { date: string; buyers: number; sellers: number }[];
  orders: { date: string; orders: number; gmv: number }[];
}
export const adminGetProgression = () =>
  api.get<Progression>("/admin/progression").then((r) => r.data);

export interface SellerVerification {
  status: string;
  nationalIdUrl: string | null;
  stallPhotoUrl: string | null;
}
export const getSellerVerification = () =>
  api.get<SellerVerification>("/sellers/me/verification").then((r) => r.data);
export const submitSellerVerification = (nationalIdUrl: string, stallPhotoUrl: string) =>
  api.post("/sellers/me/verification", { nationalIdUrl, stallPhotoUrl });

export interface PendingSeller {
  userId: string;
  fullName: string;
  marketName: string | null;
  stallLocation: string | null;
  nationalIdUrl: string | null;
  stallPhotoUrl: string | null;
}
export const adminListSellers = () =>
  api.get<{ sellers: PendingSeller[] }>("/admin/sellers").then((r) => r.data.sellers);
export const adminVerifySeller = (userId: string, decision: "verified" | "rejected") =>
  api.post(`/admin/sellers/${userId}/verify`, { decision });

// -------- RFQs & Quotes (FR-10/11) --------
export type Frequency = "one_time" | "daily" | "weekly" | "monthly";
export interface Rfq {
  id: string;
  corporateBuyerId: string;
  buyerName: string;
  businessName: string | null;
  productCategory: string;
  quantity: number;
  unit: string | null;
  frequency: Frequency;
  deliveryLocation: string | null;
  notes: string | null;
  status: "open" | "quoted" | "accepted" | "closed" | "cancelled";
  createdAt: string;
  quoteCount?: number;
}
export interface Quote {
  id: string;
  rfqId: string;
  sellerId: string;
  sellerName: string;
  unitPrice: number;
  deliveryTerms: string | null;
  notes: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  createdAt: string;
}
export const createRfq = (payload: Record<string, unknown>) =>
  api.post<{ rfq: Rfq }>("/rfqs", payload).then((r) => r.data.rfq);
export const listRfqs = (as?: "seller") =>
  api.get<{ rfqs: Rfq[] }>("/rfqs", { params: as ? { as } : {} }).then((r) => r.data.rfqs);
export const getRfq = (id: string) =>
  api.get<{ rfq: Rfq; quotes: Quote[] }>(`/rfqs/${id}`).then((r) => r.data);
export const submitQuote = (rfqId: string, payload: Record<string, unknown>) =>
  api.post<{ quote: Quote }>(`/rfqs/${rfqId}/quotes`, payload).then((r) => r.data.quote);
export const acceptQuote = (rfqId: string, quoteId: string) =>
  api.post(`/rfqs/${rfqId}/quotes/${quoteId}/accept`).then((r) => r.data);
export const rejectQuote = (rfqId: string, quoteId: string) =>
  api.post(`/rfqs/${rfqId}/quotes/${quoteId}/reject`).then((r) => r.data);

// -------- Invoices & Contracts (FR-12) --------
export interface Invoice {
  id: string;
  contractId: string | null;
  orderId: string | null;
  buyerName: string;
  sellerName: string;
  amount: number;
  periodLabel: string | null;
  status: "issued" | "paid" | "overdue" | "cancelled";
  issuedAt: string;
  dueDate: string | null;
}
export interface Contract {
  id: string;
  buyerName: string;
  sellerName: string;
  productCategory: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  frequency: Frequency;
  nextInvoiceDate: string;
  status: "active" | "paused" | "cancelled";
}
export const listInvoices = (as?: "seller") =>
  api.get<{ invoices: Invoice[] }>("/invoices", { params: as ? { as } : {} }).then((r) => r.data.invoices);
export const payInvoice = (id: string) => api.post(`/invoices/${id}/pay`);
export const listContracts = (as?: "seller") =>
  api.get<{ contracts: Contract[] }>("/contracts", { params: as ? { as } : {} }).then((r) => r.data.contracts);
export const runContract = (id: string) => api.post(`/contracts/${id}/run`).then((r) => r.data);

// -------- Messages (FR-13) --------
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  productId: string | null;
  orderId: string | null;
  rfqId: string | null;
  content: string;
  readAt: string | null;
  createdAt: string;
}
export interface Conversation {
  otherId: string;
  otherName: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}
export const sendMessage = (payload: {
  receiverId: string;
  content: string;
  productId?: string;
  orderId?: string;
  rfqId?: string;
}) => api.post<{ message: Message }>("/messages", payload).then((r) => r.data.message);
export const listMessages = (params: {
  withUserId: string;
  orderId?: string;
  productId?: string;
  rfqId?: string;
}) => api.get<{ messages: Message[] }>("/messages", { params }).then((r) => r.data.messages);
export const listConversations = () =>
  api.get<{ conversations: Conversation[] }>("/messages/conversations").then((r) => r.data.conversations);

// -------- Delivery & live tracking (FR-27/33/34/35) --------
export interface LatLng { lat: number; lng: number }
export interface DeliveryJob {
  id: string;
  totalAmount: number;
  deliveryAddress: string | null;
  sellerName: string;
  buyerName: string;
  destination: LatLng;
  origin: LatLng;
  mine: boolean;
}
export interface TrackingState {
  status: string;
  agentName: string | null;
  origin: LatLng | null;
  destination: LatLng | null;
  riderPosition: LatLng | null;
  etaMinutes: number | null;
}
export const fetchAvailableDeliveries = () =>
  api.get<{ deliveries: DeliveryJob[] }>("/delivery/available").then((r) => r.data.deliveries);
export const claimDelivery = (orderId: string) => api.post(`/delivery/${orderId}/claim`);
export const postLocation = (orderId: string, lat: number, lng: number) =>
  api.post<{ etaMinutes: number | null }>(`/delivery/${orderId}/location`, { lat, lng }).then((r) => r.data);
export const markDelivered = (orderId: string) => api.post(`/delivery/${orderId}/delivered`);
export const getTracking = (orderId: string) =>
  api.get<TrackingState>(`/delivery/${orderId}/tracking`).then((r) => r.data);

// -------- Seller-managed delivery agents --------
export interface SellerDeliveryAgent {
  id: string;
  fullName: string;
  phone: string;
  activeJobs: number;
}
export const listDeliveryAgents = () =>
  api.get<{ agents: SellerDeliveryAgent[] }>("/sellers/me/delivery-agents").then((r) => r.data.agents);
export const createDeliveryAgent = (fullName: string, phone: string) =>
  api
    .post<{ agent: SellerDeliveryAgent }>("/sellers/me/delivery-agents", { fullName, phone })
    .then((r) => r.data.agent);
export const deleteDeliveryAgent = (id: string) =>
  api.delete(`/sellers/me/delivery-agents/${id}`);
// Seller assigns one of their agents to their own order.
export const assignDeliveryAgent = (orderId: string, agentId: string) =>
  api.post<{ order: Order }>(`/orders/${orderId}/assign-agent`, { agentId }).then((r) => r.data.order);

// -------- Marketing: promotions, sponsored (FR-20/30) --------
export interface Promotion {
  id: string;
  product_id: string;
  product_name: string;
  discount_type: "percent" | "fixed";
  value: string;
  start_date: string;
  end_date: string;
}
export const createPromotion = (payload: {
  productId: string;
  discountType: "percent" | "fixed";
  value: number;
  endDate: string;
}) => api.post("/promotions", payload).then((r) => r.data);
export const listMyPromotions = () =>
  api.get<{ promotions: Promotion[] }>("/promotions/mine").then((r) => r.data.promotions);
export const deletePromotion = (id: string) => api.delete(`/promotions/${id}`);
export const sponsorProduct = (productId: string, days = 7) =>
  api.post(`/products/${productId}/sponsor`, { days });

// -------- Loyalty + referral (FR-32/21) --------
export interface Loyalty { pointsEarned: number; pointsRedeemed: number; balance: number }
export const getLoyalty = () => api.get<Loyalty>("/loyalty").then((r) => r.data);
export const redeemLoyalty = (points: number) =>
  api.post<{ balance: number }>("/loyalty/redeem", { points }).then((r) => r.data);
export const getReferral = () =>
  api.get<{ code: string; referrals: number }>("/loyalty/referral").then((r) => r.data);

// -------- Subscription (FR-29) --------
export interface Plan {
  tier: "Basic" | "Pro" | "Enterprise";
  status: string;
  startDate: string | null;
  renewalDate: string | null;
}
export const getSubscription = () =>
  api.get<{ plan: Plan }>("/subscription").then((r) => r.data.plan);
export const setSubscription = (tier: string) =>
  api.post<{ plan: Plan }>("/subscription", { tier }).then((r) => r.data.plan);

// -------- Notifications (FR-22) --------
export interface Notification {
  id: string;
  type: string | null;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
export const listNotifications = () =>
  api.get<{ notifications: Notification[] }>("/notifications").then((r) => r.data.notifications);
export const unreadNotifications = () =>
  api.get<{ unread: number }>("/notifications/unread-count").then((r) => r.data.unread);
export const markNotificationRead = (id: string) => api.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post("/notifications/read-all");

// -------- Embedded finance: working-capital advances (FR-26) --------
export interface Eligibility {
  eligible: boolean;
  reason: string;
  trustScore: number;
  salesTotal: number;
  maxAmount: number;
  minTrust: number;
}
export interface Advance {
  id: string;
  amount: number;
  repaymentRate: number;
  outstandingBalance: number;
  status: "requested" | "active" | "repaid" | "rejected";
  partnerMfiRef: string | null;
  disbursedDate: string | null;
  createdAt: string;
}
export interface LedgerEntry {
  id: string;
  entryType: "disbursement" | "repayment";
  amount: number;
  orderId: string | null;
  balanceAfter: number;
  createdAt: string;
}
export const getAdvanceEligibility = () =>
  api.get<Eligibility>("/advances/eligibility").then((r) => r.data);
export const requestAdvance = (amount: number, repaymentRate: number) =>
  api.post<{ advance: Advance }>("/advances", { amount, repaymentRate }).then((r) => r.data.advance);
export const listMyAdvances = () =>
  api.get<{ advances: Advance[] }>("/advances/mine").then((r) => r.data.advances);
export const getAdvanceLedger = (id: string) =>
  api.get<{ ledger: LedgerEntry[] }>(`/advances/${id}/ledger`).then((r) => r.data.ledger);
