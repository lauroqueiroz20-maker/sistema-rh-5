import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "leaflet/dist/leaflet.css";

import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./ErrorBoundary";

async function limparAplicativoAntigo() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registros =
    await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registros.map((registro) =>
      registro.unregister()
    )
  );

  if (!("caches" in window)) {
    return;
  }

  const chaves = await caches.keys();

  await Promise.all(
    chaves.map((chave) =>
      caches.delete(chave)
    )
  );
}

limparAplicativoAntigo().finally(() => {
  createRoot(
    document.getElementById("root")!
  ).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
});
