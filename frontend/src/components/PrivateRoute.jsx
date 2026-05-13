import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Redirects to login if user is not authenticated
export default function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/login" replace />;
}
