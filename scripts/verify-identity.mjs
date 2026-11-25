import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git","node_modules",".next","coverage"]);
const failures = [];
const read = (file) => fs.readFileSync(path.join(root,file),"utf8");
const manifest = JSON.parse(read("public/manifest.webmanifest"));
const appManifest = read("src/app/manifest.ts");
const layout = read("src/app/layout.tsx");
const pwaRegister = read("src/app/pwa-register.tsx");
const sw = read("public/sw.js");
const installCss = read("src/app/install-card.css");
const page = read("src/app/page.tsx");

if (manifest.name !== "Prospec Group | Pitbulls of Branding") failures.push("manifest: wrong Prospec application name");
if (manifest.short_name !== "Prospec") failures.push("manifest: wrong short name");
if (manifest.theme_color !== "#00B9C7") failures.push("manifest: wrong theme colour");
if (!manifest.icons?.some((icon) => icon.src === "/prospec-icon.svg")) failures.push("manifest: Prospec icon missing");
if (!appManifest.includes('name: "Prospec Group | Pitbulls of Branding"')) failures.push("app manifest: wrong application name");
if (!layout.includes('applicationName:"Prospec Group"')) failures.push("layout: wrong application name");
if (!layout.includes('title:{default:"Prospec Group | Pitbulls of Branding"')) failures.push("layout: wrong default title");
if (!layout.includes('appleWebApp:{capable:true,title:"Prospec"')) failures.push("layout: Apple web app title missing");
if (!fs.existsSync(path.join(root,"public/prospec-icon.svg"))) failures.push("Prospec icon asset missing");
if (!fs.existsSync(path.join(root,"public/prospec-wordmark.svg"))) failures.push("Prospec wordmark asset missing");
if (!sw.includes('const CACHE_VERSION = "prospec-shell-v1"')) failures.push("service worker: Prospec shell cache namespace missing");
if (!sw.includes('const MEDIA_CACHE = "prospec-media-v1"')) failures.push("service worker: Prospec media cache namespace missing");
if (!sw.includes("/prospec-icon.svg")) failures.push("service worker: Prospec icon missing from app shell");
if (!sw.includes("/iphone-install") || !sw.includes("/iphone-install.svg")) failures.push("service worker: iPhone installation guide missing from app shell");
if (!layout.includes("__iteration13InstallPrompt") || !layout.includes("beforeinstallprompt")) failures.push("PWA layout: early native install-prompt capture missing");
if (!layout.includes('<PwaRegister initialEmbedded={embedded} initialAndroid={android}/>{children}')) failures.push("PWA layout: install card must remain mounted before page content");
if (!/\.i13-install-card\s*\{[^}]*position:\s*relative[^}]*max-width:\s*390px[^}]*margin:\s*12px auto 0/s.test(installCss)) failures.push("PWA install card: protected inline compact placement changed");
if (!pwaRegister.includes("await prompt.prompt()") || !pwaRegister.includes("setCanInstall(true)")) failures.push("PWA install: native prompt no longer connected to explicit action");
if (!pwaRegister.includes("(canInstall || canShowManualInstall)") || !pwaRegister.includes("isIosSafari()")) failures.push("PWA install: native prompt / iOS Safari visibility gate changed");
if (!pwaRegister.includes('className="i13-install-card"') || !pwaRegister.includes('className="i13-install-close"') || !pwaRegister.includes("setInstallCardDismissed(true)")) failures.push("PWA install: dismissible branded card missing");
if (!pwaRegister.includes("PROSPEC GROUP")) failures.push("PWA install: Prospec branding missing");
if (!page.includes('const STORAGE_KEY = "prospec:service-preview:v1"')) failures.push("application storage namespace not isolated for Prospec");
if (!page.includes("prospecCatalogue") || !page.includes("Quote on request")) failures.push("Prospec catalogue and unpriced enquiry labels missing");
if (!page.includes('fetch("/api/admin/session"')) failures.push("owner login is not server validated");
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx|js|mjs|css|json|webmanifest|md|yml|yaml|txt|html|svg)$/i.test(entry.name)) {
      const content = fs.readFileSync(full,"utf8");
      if (/boemo-joos-food-deals|namane-tyres\.vercel\.app|yusuf-clothing-line\.vercel\.app|BOEMO_REMINDER_CRON_SECRET|boemoMedia|the-plug-pearl\.vercel\.app|plug-icon\.svg|THE_PLUG_PUBLIC_URL/i.test(content)) failures.push(path.relative(root,full)+": inherited client identity, credential, storage path or production URL remains");
    }
  }
}
walk(root);
if (failures.length) {
  console.error("Prospec identity verification failed:");
  failures.forEach(item=>console.error(" - "+item));
  process.exit(1);
}
console.log("Prospec identity and protected PWA checks passed.");
