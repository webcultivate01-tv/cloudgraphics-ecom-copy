import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";

// ── User / Public Pages ──────────────────────────────────────
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Contact from "./pages/Contact";
import Replacements from "./pages/Replacements";
import ForgotPassword from "./pages/ForgotPassword";

// ── Admin Pages ──────────────────────────────────────────────
import Dashboard from "./pages/admin/Dashboard";
import ManageProducts from "./pages/admin/ManageProducts";
import ManageOrders from "./pages/admin/ManageOrders";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageAdmins from "./pages/admin/ManageAdmins";
import ManageEvents from "./pages/admin/ManageEvents";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageInquiries from "./pages/admin/ManageInquiries";
import ManageReviews from "./pages/admin/ManageReviews";
import ManageReplacements from "./pages/admin/ManageReplacements";
import DataExport from "./pages/admin/DataExport";

// Wraps any admin page with the sidebar layout + route guard
const AdminPage = ({ children }) => (
  <AdminRoute>
    <AdminLayout>{children}</AdminLayout>
  </AdminRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Admin routes — no Navbar/Footer, use AdminLayout sidebar ── */}
        <Route path="/admin/dashboard"  element={<AdminPage><Dashboard /></AdminPage>} />
        <Route path="/admin/products"   element={<AdminPage><ManageProducts /></AdminPage>} />
        <Route path="/admin/orders"     element={<AdminPage><ManageOrders /></AdminPage>} />
        <Route path="/admin/users"      element={<AdminPage><ManageUsers /></AdminPage>} />
        <Route path="/admin/admins"     element={<AdminPage><ManageAdmins /></AdminPage>} />
        <Route path="/admin/events"      element={<AdminPage><ManageEvents /></AdminPage>} />
        <Route path="/admin/categories"  element={<AdminPage><ManageCategories /></AdminPage>} />
        <Route path="/admin/inquiries"   element={<AdminPage><ManageInquiries /></AdminPage>} />
        <Route path="/admin/reviews"       element={<AdminPage><ManageReviews /></AdminPage>} />
        <Route path="/admin/replacements" element={<AdminPage><ManageReplacements /></AdminPage>} />
        <Route path="/admin/export"       element={<AdminPage><DataExport /></AdminPage>} />

        {/* ── Public + User routes — use Navbar/Footer ── */}
        <Route path="/*" element={
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/"          element={<Home />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/register"  element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/products"  element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart"      element={<Cart />} />
                <Route path="/checkout"  element={<PrivateRoute><Checkout /></PrivateRoute>} />
                <Route path="/orders"    element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
                <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/favorites"     element={<Favorites />} />
                <Route path="/replacements"  element={<PrivateRoute><Replacements /></PrivateRoute>} />
                <Route path="/contact"       element={<Contact />} />
                <Route path="*" element={
                  <div style={{ textAlign: "center", padding: "100px", color: "#fff", background: "#0f3460", minHeight: "80vh" }}>
                    <h1>404 — Page Not Found</h1>
                  </div>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </BrowserRouter>
  );
}
