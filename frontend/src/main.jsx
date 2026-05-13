import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./app/store";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Wrap entire app in Redux Provider so all components can access the store */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
