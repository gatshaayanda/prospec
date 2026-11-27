import type {Metadata,Viewport} from "next";
import {headers} from "next/headers";
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import Script from "next/script";
import "./globals.css"; import "./pwa.css"; import "./install-card.css";
const siteUrl=process.env.NEXT_PUBLIC_BASE_URL;
const EMBEDDED_BROWSER_PATTERN=/WhatsApp|Instagram|FBAN|FBAV|Messenger|Line[/]|Twitter|TikTok|Snapchat/i;
export const metadata:Metadata={metadataBase:siteUrl?new URL(siteUrl):undefined,title:{default:"Prospec Group | Pitbulls of Branding",template:"%s | Prospec Group"},description:"Prospec Group is a Botswana youth citizen-owned business group across marketing, advertising, procurement, NFC digital identity and printing.",applicationName:"Prospec Group",keywords:["Prospec Group","Prospec AG","Prospec Supplies","Prospec NFC","Prospec AG Printing","Botswana marketing","branding","printing","procurement","NFC business cards"],openGraph:{type:"website",siteName:"Prospec Group",title:"Prospec Group | Pitbulls of Branding",description:"We keep our noses in other people’s business. Four divisions. One sharp team."},twitter:{card:"summary",title:"Prospec Group | Pitbulls of Branding",description:"Marketing, procurement, NFC and printing in Botswana."},icons:{icon:[{url:"/prospec-icon.svg",type:"image/svg+xml"}],apple:{url:"/prospec-icon-192.png",type:"image/png",sizes:"192x192"}},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"Prospec",statusBarStyle:"black-translucent"}};
export const viewport:Viewport={themeColor:"#00B9C7",colorScheme:"dark"};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const requestHeaders=await headers();
 const userAgent=requestHeaders.get("user-agent")||"";
 const requestedWith=requestHeaders.get("x-requested-with")||"";
 // A social referrer does not prove this browser is embedded: Chrome opened from WhatsApp
 // must not be trapped in the in-app-browser install gate.
 const embedded=EMBEDDED_BROWSER_PATTERN.test(userAgent)
   || (/Android/i.test(userAgent)&&/\bwv\b/i.test(userAgent))
   || /^(com\.whatsapp|com\.instagram\.android|com\.facebook\.katana|com\.facebook\.lite|com\.facebook\.orca)$/i.test(requestedWith);
 const android=/Android/i.test(userAgent);
 return <html lang="en"><body style={embedded?{overflow:"hidden"}:undefined}><Script id="iteration13-early-install-capture" strategy="beforeInteractive">{`
(function () {
  window.addEventListener("beforeinstallprompt", function (event) {
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (standalone || window.__iteration13PwaListenerReady === true) return;
    event.preventDefault();
    window.__iteration13InstallPrompt = event;
  });
})();
`}</Script><PwaRegister initialEmbedded={embedded} initialAndroid={android}/>{children}<Analytics/><SpeedInsights/></body></html>
}
