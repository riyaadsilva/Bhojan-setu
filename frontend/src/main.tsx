import { createRoot } from "react-dom/client";
import App from "./App"; 
import "./index.css";
import AppErrorBoundary from "./components/AppErrorBoundary";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
} else {
  createRoot(rootElement).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
