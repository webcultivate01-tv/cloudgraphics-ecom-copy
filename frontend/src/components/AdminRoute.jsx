import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Redirects to home if user is not an admin
export default function AdminRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
