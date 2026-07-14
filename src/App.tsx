import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SellerProvider } from "./context/SellerContext";
import { OrderProvider } from "./context/OrderContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Login from "./pages/Login";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import SellerDashboard from "./pages/SellerDashboard";
import ListingForm from "./pages/ListingForm";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import Account from "./pages/Account";
import Rfqs from "./pages/Rfqs";
import RfqDetail from "./pages/RfqDetail";
import Invoices from "./pages/Invoices";
import Messages from "./pages/Messages";
import Deliver from "./pages/Deliver";
import Subscription from "./pages/Subscription";
import Financing from "./pages/Financing";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
    <CartProvider>
      <SellerProvider>
        <OrderProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/login" element={<Login />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/sell" element={<SellerDashboard />} />
                <Route path="/sell/new" element={<ListingForm />} />
                <Route path="/sell/edit/:id" element={<ListingForm />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                <Route path="/order-tracking/:id" element={<OrderTracking />} />
                <Route path="/account" element={<Account />} />
                <Route path="/rfqs" element={<Rfqs />} />
                <Route path="/rfqs/:id" element={<RfqDetail />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/deliver" element={<Deliver />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/financing" element={<Financing />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </OrderProvider>
      </SellerProvider>
    </CartProvider>
    </AuthProvider>
  );
}