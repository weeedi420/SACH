import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Universal versioned cache bust – fixes stale PWA on sachhh.com + all hosts
const CACHE_VERSION = "v13";

(async function bustStaleCacheIfNeeded() {
  try {
    const storedVersion = localStorage.getItem("sachhh_cache_version");
    if (storedVersion === CACHE_VERSION) return;

    console.log(`[sachhh] Cache version mismatch (${storedVersion} → ${CACHE_VERSION}). Busting stale cache...`);

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    localStorage.setItem("sachhh_cache_version", CACHE_VERSION);
    window.location.reload();
  } catch (e) {
    // If localStorage is blocked (rare), just continue
    console.warn("[sachhh] Cache bust failed:", e);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
