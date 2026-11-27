import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const sw = read("../public/sw.js");
const page = read("../src/app/page.tsx");
const account = read("../src/app/AccountWorkspace.tsx");
const offline = read("../src/app/offline/page.tsx");
const pwaRegister = read("../src/app/pwa-register.tsx");
const firebaseClient = read("../src/lib/firebase/client.ts");
const firestoreRules = read("../firestore.rules");
const layout = read("../src/app/layout.tsx");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(sw.includes('const CACHE_VERSION = "prospec-shell-v1"'), "Prospec app-shell cache namespace must be isolated");
check(sw.includes('event.waitUntil(self.skipWaiting())'), "user-approved worker activation must be awaited by the message event");
check(sw.includes("navigationPreload.enable()") && sw.includes("event.preloadResponse"), "navigation preload must be optional and used by network-first page loads");
check(sw.includes("function isSafePublicHtml") && sw.includes('value === "cookie"') && sw.includes('value === "authorization"'), "public HTML caching must reject cookie- or authorization-varying responses");
check(sw.includes("sensitiveQuery.test(key)") && sw.includes("responseOrigin === self.location.origin"), "public HTML caching must reject sensitive query strings and cross-origin redirects");
check(sw.includes("response.status >= 500") && sw.includes("networkFirstNavigation(request, event)"), "cached public pages must recover from transient server errors");
check(page.includes('caches.open("prospec-shell-v1")') && page.includes('shell.match("/")') && page.includes('shell.match("/offline")'), "Store must detect the current Prospec offline shell");
check(page.includes('window.localStorage.setItem(getStorageKey(STORAGE_KEY), JSON.stringify(data))'), "customer/admin preview changes must be synchronously saved before success feedback");
check(page.includes("prospecCatalogue") && page.includes("prospecDivisions") && page.includes("catalogueDivision"), "public Store must render the four Prospec divisions and filterable catalogue");
check(page.includes("Quote on request") && page.includes("service.custom || service.price <= 0"), "unpriced catalogue items must remain requestable without showing P0");
check(firebaseClient.includes("persistentLocalCache") && firebaseClient.includes("persistentMultipleTabManager"), "Firestore must retain persistent multi-tab offline cache");
check(page.includes("ensureCustomerAuth()") && page.includes("onSnapshot(enquiriesQuery"), "customer requests must use persistent Firebase identity and live Firestore updates");
check(page.includes('setDoc(doc(getProspecDb(), "prospecEnquiries"') && account.includes("arrayUnion(message)"), "customer requests and messages must queue through Firestore offline persistence");
check(firestoreRules.includes("request.auth.uid") && firestoreRules.includes("prospecEnquiries"), "Firestore rules must scope enquiry records to the authenticated customer");
check(page.includes('fetch("/api/admin/session"') && page.includes("async function submitAdminLogin"), "owner login must use the server session endpoint");
check(account.includes("Firestore keeps an offline cache") || account.includes("Prospec account"), "customer Account must describe its cloud-backed customer session");
check(offline.includes("Prospec Group") && offline.includes("preview"), "offline page must use Prospec identity and explain offline behavior");
check(layout.includes('strategy="beforeInteractive"') && layout.includes("event.preventDefault()") && layout.includes("window.__iteration13InstallPrompt = event"), "early native install-prompt capture must remain intact");
check(pwaRegister.includes("await prompt.prompt()") && pwaRegister.includes("await prompt.userChoice") && pwaRegister.includes("onClick={install}"), "branded install button must invoke the retained native browser prompt synchronously from the click");
check(pwaRegister.includes("i13-install-card") && pwaRegister.includes('className="i13-install-close"') && pwaRegister.includes("setInstallCardDismissed(true)") && pwaRegister.includes("aria-expanded={!installCardCollapsed}"), "compact collapsible and dismissible install card must remain intact");
check(pwaRegister.includes("function isIosSafari()") && pwaRegister.includes("Share</b>, choose <b>Add to Home Screen</b>"), "iOS Safari installation guidance must remain intact");
check(pwaRegister.includes("const installInvitationEligible = true;") && pwaRegister.includes("setCanInstall(installInvitationEligible)") && !pwaRegister.includes("INSTALL_VISIT_THRESHOLD") && !pwaRegister.includes("visitCount") && !pwaRegister.includes("prospec:install:dismissed-at:v6") && pwaRegister.includes("(canInstall || canShowManualInstall)") && pwaRegister.includes("await prompt.prompt()") && pwaRegister.includes("onClick={install}"), "install invitation must be available on every eligible visit and invoke Chromium’s retained browser-owned prompt from the explicit click without visit or persistent-dismissal gates");
check(pwaRegister.includes("onClick={dismissInstall}") && pwaRegister.includes("setInstallCardDismissed(true)") && !pwaRegister.includes("localStorage") && !pwaRegister.includes("sessionStorage"), "install-card dismissal must be cancellable for the current page only, without persistent storage");
check(!pwaRegister.includes("function isAndroidChrome()") && !pwaRegister.includes("ANDROID · CHROME"), "Chrome must not be shown a fake manual install guide when the browser has not supplied an install prompt");
check(pwaRegister.includes('prospec:install:dismissed-at:v6'), "new install-card release must use the current versioned dismissal key");
check(page.includes('"Offline ready"') && !page.includes('"App shell saved"'), "customer-facing offline status must avoid technical app-shell wording");
check(pwaRegister.includes('installState === "embedded"') && pwaRegister.includes("function openBrowser()"), "embedded-browser handoff must remain intact");
check(pwaRegister.includes('register("/sw.js", { updateViaCache: "none" })') && pwaRegister.includes("SKIP_WAITING") && pwaRegister.includes('className="pwaUpdate"'), "service-worker update lifecycle must remain intact");

if (failures.length) {
  console.error("Prospec offline/workflow verification failed:");
  failures.forEach(item => console.error(" - " + item));
  process.exit(1);
}
console.log("Prospec offline and customer/owner workflow checks passed.");
