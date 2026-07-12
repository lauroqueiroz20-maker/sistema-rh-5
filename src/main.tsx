import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "leaflet/dist/leaflet.css";

import "./index.css";
import App from "./App.tsx";

function registrarAplicativoMobile() {
  if (
    !("serviceWorker" in navigator) ||
    !import.meta.env.PROD
  ) {
    return;
  }

  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker.register(
        "/service-worker.js"
      );
    }
  );
}

async function limparAplicativoAntigo() {
  if (
    !("serviceWorker" in navigator) ||
    import.meta.env.PROD
  ) {
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

registrarAplicativoMobile();

limparAplicativoAntigo().finally(() => {
  createRoot(
    document.getElementById("root")!
  ).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
