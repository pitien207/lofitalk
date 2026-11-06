import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { BrowserRouter } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLanguageStore } from "./store/useLanguageStore";
import { registerServiceWorker } from "./utils/pushNotifications";

const queryClient = new QueryClient();

const render = () =>
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );

// Load the active language's strings first so the first paint is translated.
useLanguageStore.getState().init().finally(render);

// Web Push only (no offline cache), see public/sw.js.
registerServiceWorker();
