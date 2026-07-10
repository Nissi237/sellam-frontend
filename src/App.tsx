import { BrowserRouter, Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
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
              </Routes>
            </Layout>
          </BrowserRouter>
        </OrderProvider>
      </SellerProvider>
    </CartProvider>
  );
}