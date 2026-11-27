"use client";

// Keep embedded-browser install enforcement explicit at the top-level PWA boundary.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type InstallState = "hidden" | "native" | "embedded";

const INSTALL_DISMISSED_KEY = "prospec:install:dismissed-at:v6";
const INSTALL_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const INSTALL_RELEASE_KEY = "prospec:install:invitation-release:v3";

function environment() {
  if (typeof window === "undefined") return { standalone: true, ios: false, android: false, embedded: false };
  const ua = navigator.userAgent || "";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const ios = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const embedded = /WhatsApp|Instagram|FBAN|FBAV|Messenger|Line\/|Twitter|TikTok|Snapchat/i.test(ua) ||
    (/Android/i.test(ua) && /; wv\)/i.test(ua));
  return { standalone, ios, android, embedded };
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  const ios = /iPad|iPhone|iPod/i.test(nav.userAgent) ||
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  return ios && /Safari/i.test(nav.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(nav.userAgent);
}

function dismissedRecently() {
  try {
    const value = window.localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (!value) return false;
    const at = Date.parse(value);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < INSTALL_DISMISS_MS;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, new Date().toISOString());
  } catch {
    // Installation remains optional when storage is unavailable.
  }
}

function clearDismissal() {
  try { window.localStorage.removeItem(INSTALL_DISMISSED_KEY); } catch {}
}

export default function PwaRegister({ initialEmbedded = false, initialAndroid = false }: { initialEmbedded?: boolean; initialAndroid?: boolean }) {
  const installPromptRef = useRef<InstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>(initialEmbedded ? "embedded" : "hidden");
  const [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const [embeddedAndroid, setEmbeddedAndroid] = useState(initialEmbedded && initialAndroid);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [canShowManualInstall, setCanShowManualInstall] = useState(initialAndroid);
  const [installCardDismissed, setInstallCardDismissed] = useState(false);
  const [installCardCollapsed, setInstallCardCollapsed] = useState(false);
  const embeddedActionRef = useRef<HTMLButtonElement | null>(null);
  const reloadForUpdate = useRef(false);

  useEffect(() => {
    const env = environment();
    const embedded = initialEmbedded || env.embedded;
    // One-time release migration: clear stale dismissals created when dismissing
    // Chrome's native prompt also hid the branded invitation.
    try {
      if (window.localStorage.getItem(INSTALL_RELEASE_KEY) !== "1") {
        clearDismissal();
        window.localStorage.setItem(INSTALL_RELEASE_KEY, "1");
        setInstallCardDismissed(false);
      } else {
        setInstallCardDismissed(dismissedRecently());
      }
    } catch {
      setInstallCardDismissed(false);
    }
    setEmbeddedAndroid((initialEmbedded && initialAndroid) || (env.embedded && env.android));
    // The branded invitation is available in every supported browser, even when
    // Chromium has not yet emitted beforeinstallprompt.
    setCanShowManualInstall(!env.standalone && !embedded);

    let registration: ServiceWorkerRegistration | null = null;
    const inspect = () => {
      if (registration?.waiting && navigator.serviceWorker.controller) setUpdateReady(registration.waiting);
    };
    const checkForUpdates = () => {
      if (!registration || !navigator.onLine) return;
      void registration.update().then(inspect).catch(() => {});
    };
    const online = () => {
      checkForUpdates();
    };
    const visibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdates();
    };

    const onBeforeInstallPrompt = (event: Event) => {
      const current = environment();
      if (current.standalone) return;
      event.preventDefault();
      const prompt = event as InstallPromptEvent;
      installPromptRef.current = prompt;
      setInstallCardDismissed(dismissedRecently());
      setInstallCardCollapsed(false);
      setCanInstall(true);
      // Retain the one-shot native event for the user's explicit Install click.
      // Do not interrupt page load with a second, custom install screen.
    };

    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", visibilityChange);
    const promptWindow = window as Window & { __iteration13InstallPrompt?: Event; __iteration13PwaListenerReady?: boolean };
    // The browser can emit beforeinstallprompt before React hydrates. Adopt the
    // event captured by the tiny beforeInteractive script before listening normally.
    promptWindow.__iteration13PwaListenerReady = true;
    const earlyPrompt = promptWindow.__iteration13InstallPrompt;
    if (earlyPrompt) {
      delete promptWindow.__iteration13InstallPrompt;
      onBeforeInstallPrompt(earlyPrompt);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    if (env.standalone && !embedded) {
      setInstallState("hidden");
    } else if (embedded) {
      // Embedded browsers are a compatibility gate, not an install promotion.
      setInstallState("embedded");
    }

    const requestInstall = () => {
      const current = environment();
      if (current.standalone) return;
      if (current.embedded) {
        setInstallState("embedded");
        return;
      }
      // This event can be dispatched programmatically and therefore is not a
      // trusted user activation. Never consume Chromium's one-shot prompt here.
      // The native prompt is invoked only by the actual Install button click.
      if (!current.standalone) {
        setInstallHelpOpen(true);
        setInstallState("native");
      }
    };
    const appInstalled = () => {
      installPromptRef.current = null;
      setCanInstall(false);
      setCanShowManualInstall(false);
      setInstallHelpOpen(false);
      setInstallState("hidden");
      clearDismissal();
    };
    window.addEventListener("iteration13-open-install", requestInstall);
    window.addEventListener("appinstalled", appInstalled);

    const register = async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        inspect();
        registration.addEventListener("updatefound", () => {
          const worker = registration?.installing;
          if (!worker) return;
          worker.addEventListener("statechange", inspect);
        });
        await registration.update();
        inspect();
      } catch {}
    };

    void register();
    const controllerChange = () => { if (reloadForUpdate.current) window.location.reload(); };
    navigator.serviceWorker?.addEventListener("controllerchange", controllerChange);

    return () => {
      window.removeEventListener("iteration13-open-install", requestInstall);
      window.removeEventListener("appinstalled", appInstalled);
      window.removeEventListener("online", online);
      document.removeEventListener("visibilitychange", visibilityChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChange);
    };
  }, [initialEmbedded, initialAndroid]);

  useEffect(() => {
    if (installState !== "embedded" && installState !== "native") return;

    const isEmbeddedGate = installState === "embedded";
    const previousOverflow = document.body.style.overflow;
    if (isEmbeddedGate) document.body.style.overflow = "hidden";
    if (installState === "embedded") embeddedActionRef.current?.focus();
    else document.querySelector<HTMLButtonElement>(".plugInstallPrimary")?.focus();

    const keepDialogFocused = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isEmbeddedGate) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          dismissInstall();
        }
      }
      if (event.key === "Tab" && isEmbeddedGate) {
        event.preventDefault();
        embeddedActionRef.current?.focus();
      }
    };

    window.addEventListener("keydown", keepDialogFocused, true);
    return () => {
      if (isEmbeddedGate) document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keepDialogFocused, true);
    };
  }, [installState, installHelpOpen]);

  function install() {
    const prompt = installPromptRef.current;
    if (!prompt) {
      // Chrome only exposes its native install sheet after beforeinstallprompt.
      // Without that browser-owned event, show the supported browser instructions.
      if (!environment().standalone) {
        setInstallHelpOpen(true);
        setInstallState("native");
      }
      return;
    }

    // Invoke prompt() synchronously in the actual button click handler. Do not put
    // an await, timer, state transition, or other asynchronous boundary before it:
    // Chromium requires the retained event to be used during this user activation.
    installPromptRef.current = null;
    setCanInstall(false);
    let promptResult: Promise<void>;
    try {
      promptResult = prompt.prompt();
    } catch {
      setInstallHelpOpen(true);
      setInstallState("native");
      return;
    }

    void promptResult
      .then(() => prompt.userChoice)
      .then(choice => {
        // A native prompt dismissal is not a request to hide the branded invitation.
        // Only the card's explicit close action records a seven-day dismissal.
      })
      .catch(() => {
        // The browser owns this one-shot prompt; never simulate its confirmation UI.
      })
      .finally(() => {
        setInstallHelpOpen(false);
        setInstallState("hidden");
      });
  }

  function closeInstallHelp() {
    // Closing browser guidance must not dismiss the persistent install invitation.
    setInstallHelpOpen(false);
    setInstallState("hidden");
  }

  function dismissInstall() {
    rememberDismissal();
    setInstallCardDismissed(true);
    setInstallCardCollapsed(false);
    setInstallHelpOpen(false);
    setInstallState("hidden");
  }

  function openBrowser() {
    const url = window.location.href;
    const env = environment();
    if (env.android) {
      window.location.href = "intent://" + url.replace(/^https?:\/\//, "") + "#Intent;scheme=https;package=com.android.chrome;end";
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function applyUpdate() {
    // Always provide a visible outcome. Normally controllerchange reloads as soon
    // as the waiting worker activates; the timeout covers a stale/nonresponsive worker.
    reloadForUpdate.current = true;
    if (updateReady) {
      try {
        updateReady.postMessage({ type: "SKIP_WAITING" });
      } catch {
        // The full navigation below remains the recovery path.
      }
    }
    window.setTimeout(() => {
      if (reloadForUpdate.current) window.location.reload();
    }, 1800);
  }

  const installShellStyle: CSSProperties = { position: "fixed", left: "auto", right: 18, bottom: 18, zIndex: 1205, width: "min(440px, calc(100vw - 36px))", maxWidth: 440, margin: 0, padding: 12, borderRadius: 16, background: "#FFFFFF", color: "#111318", boxShadow: "0 12px 40px rgba(0,0,0,.18)", border: "1px solid rgba(17,19,24,.12)" };
  const embeddedInstallStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.82)", backdropFilter: "blur(4px)", overscrollBehavior: "contain" };
  const installCard = installState === "native" && installHelpOpen && !environment().embedded ? (
    <div style={installShellStyle} role="presentation">
      <section className="plugInstallModal" role="dialog" aria-modal="false" aria-labelledby="plug-install-title" aria-describedby="plug-install-message">
        <div className="plugInstallTop"><span className="plugInstallMark">P</span><span className="plugInstallTag">PROSPEC GROUP · PITBULLS OF BRANDING</span><button type="button" className="plugInstallClose" aria-label="Close install guidance" onClick={closeInstallHelp}>×</button></div>
        {environment().android ? <><div className="plugInstallKicker">ANDROID INSTALL</div><h2 id="plug-install-title">Install Prospec.</h2><p id="plug-install-message">If Chrome offers its native install prompt, this button opens it. Otherwise open Chrome’s <b>⋮ menu</b> and choose <b>Install app</b> or <b>Add to Home screen</b>, then confirm.</p></> : isIosSafari() ? <><div className="plugInstallKicker">IPHONE &amp; IPAD · SAFARI</div><h2 id="plug-install-title">Add to Home Screen.</h2><p id="plug-install-message">In Safari, tap <b>Share</b>, choose <b>Add to Home Screen</b>, then tap <b>Add</b>. Open the new Home Screen icon to launch the installed app.</p></> : <><div className="plugInstallKicker">BROWSER INSTALL</div><h2 id="plug-install-title">Install Prospec.</h2><p id="plug-install-message">Use your browser’s <b>Install</b> option in the address bar, or open the browser menu and choose <b>Install Prospec</b> / <b>Install app</b> if available. Confirm to add Prospec to your device.</p></>}
        {environment().android ? <div className="plugInstallActions">
          <button type="button" className="plugInstallPrimary" onClick={() => { if (installPromptRef.current) install(); else openBrowser(); }}>Install with Chrome</button>
          <button type="button" className="plugInstallSecondary" onClick={dismissInstall}>Continue on the website</button>
        </div> : <button type="button" className="plugInstallPrimary" onClick={closeInstallHelp}>Continue on the website</button>}
      </section>
    </div>
) : installState === "embedded" ? (
    <div style={embeddedInstallStyle} role="alertdialog" aria-modal="true" aria-labelledby="plug-embedded-title" aria-describedby="plug-embedded-message">
      <div className="pwaInstallInfo" style={{...installShellStyle, position: "relative", left: "auto", right: "auto", bottom: "auto", width: "100%", maxWidth: 520, margin: 0}}>
        <div>
          <strong id="plug-embedded-title"><span aria-hidden="true">🌐 </span>OPEN PROSPEC GROUP IN YOUR BROWSER</strong>
          <span id="plug-embedded-message">{embeddedAndroid ? <>Open Prospec Group in Chrome to continue. Chrome will offer its own installation action when the app is eligible.</> : <>Prospec Group opened inside another app. Open this page in your browser to continue.</>}</span>
        </div>
        <div className="pwaInstallActions" style={{display:"flex",justifyContent:"flex-end"}}>
          <button ref={embeddedActionRef} type="button" style={{background:"#0866FF",color:"#fff"}} onClick={openBrowser}>{embeddedAndroid ? "OPEN IN CHROME" : "OPEN IN BROWSER"}</button>
        </div>
      </div>
    </div>
  ) : null;

  return <>
    {!environment().standalone && installState !== "embedded" && (canInstall || canShowManualInstall) && !installCardDismissed && !(installState === "native" && installHelpOpen) && (
      <aside className={`i13-install-card${installCardCollapsed ? " is-collapsed" : ""}`} aria-label="Install Prospec Group">
        <div className="i13-install-brand">
          <span className="i13-install-mark" aria-hidden="true">P</span>
          <span><strong>PROSPEC GROUP</strong><small>PITBULLS OF BRANDING</small></span>
        </div>
        <button className="i13-install-collapse" type="button" aria-label={installCardCollapsed ? "Expand install options" : "Collapse install options"} aria-expanded={!installCardCollapsed} onClick={() => setInstallCardCollapsed(value => !value)}>{installCardCollapsed ? "＋" : "−"}</button>
        <button className="i13-install-close" type="button" aria-label="Dismiss install prompt for seven days" onClick={dismissInstall}>×</button>
        <button className="i13-install-action" type="button" onClick={install}>{installCardCollapsed ? "Install" : "Install Prospec Group"} <span aria-hidden="true">↗</span></button>
      </aside>
    )}
    {installCard}
    {updateReady && <div className="pwaUpdate" role="status" aria-live="polite" aria-atomic="true"><div><strong>Update ready</strong><span>Refresh to load the latest app shell.</span></div><div className="pwaUpdateActions"><button type="button" className="pwaUpdateDismiss" onClick={() => setUpdateReady(null)}>Later</button><button type="button" className="button buttonPrimary" onClick={applyUpdate}>Refresh</button></div></div>}
  </>;
}
