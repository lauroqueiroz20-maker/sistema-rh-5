import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "leaflet/dist/leaflet.css";

import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./ErrorBoundary";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
};

type WindowComInstalador = Window & {
  __dinizInstallPrompt?: InstallPromptEvent;
};

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  (window as WindowComInstalador).__dinizInstallPrompt =
    evento as InstallPromptEvent;
});

async function prepararAplicativo() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if ("caches" in window) {
    const chaves = await caches.keys();

    await Promise.all(
      chaves.map((chave) =>
        caches.delete(chave)
      )
    );
  }

  const registros =
    await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registros.map((registro) =>
      registro.unregister()
    )
  );
}

prepararAplicativo().finally(() => {
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

