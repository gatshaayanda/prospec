"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GoogleAuthProvider, linkWithPopup, signInWithPopup } from "firebase/auth";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getProspecAuth, getProspecDb, ensureCustomerAuth } from "@/lib/firebase/client";
import ReceiptDocument, { type ReceiptProfile } from "@/app/ReceiptDocument";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export type AccountAttachment = { name: string; url: string; type: string; size: number };
export type AccountMessage = { id: string; from: "customer" | "studio"; text: string; createdAt: string; attachment?: AccountAttachment };
export type WorkspaceOrder = { id: string; customerId?: string; serviceId: string; serviceName: string; serviceItems?: { id: string; name: string; price: number; custom?: boolean }[]; quoteRequired?: boolean; whatsapp?: string; notificationOptIn?: boolean; price: number; quotedPrice?: number; originalPrice?: number; discountAmount?: number; discountCode?: string; receiptNo?: string; paidAmount?: number; paidAt?: string; paymentStatus?: "Unpaid" | "Partially paid (preview)" | "Paid (preview)"; dueDate: string; customerName: string; email: string; brief: string; status: string; createdAt: string; statusUpdatedAt?: string; messages?: AccountMessage[] };

type DiscountClaim = { id: string; email: string; code: string; amount: number; lapTime: number; createdAt: string; status: "Available" | "Redeemed" };
type Props = {
  businessName: string;
  currency: string;
  orders: WorkspaceOrder[];
  discountClaims: DiscountClaim[];
  receiptProfile?: ReceiptProfile;
  accentColor: string;
  secondaryColor: string;
  highlightColor: string;
  availability: "available" | "limited" | "unavailable";
  customerName?: string;
  setCustomerName: (name: string) => void;
  email: string;
  whatsapp: string;
  setWhatsapp: (phone: string) => void;
  customerUid: string;
  setEmail: (email: string) => void;
  online: boolean;
  syncStatus: "connecting" | "synced" | "offline" | "error";
  announcement: string;
  announcementActive: boolean;
  onBrowse: () => void;
  onUpdateOrder: (orderId: string, update: (order: WorkspaceOrder) => WorkspaceOrder, notice: string) => void;
  children?: ReactNode;
  requestForm?: ReactNode;
  onNewRequest: () => void;
  selectedServices: { id: string; name: string; price: number; custom?: boolean }[];
  onRemoveSelected: (id: string) => void;
  onContinueRequest: () => void;
};

const prettyDate = (value: string) => { try { return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); } catch { return value; } };

export default function AccountWorkspace({ businessName, currency, customerUid, orders, discountClaims, receiptProfile, accentColor, secondaryColor, highlightColor, availability, customerName, setCustomerName, email, whatsapp, setWhatsapp, setEmail, online, syncStatus, announcement, announcementActive, onBrowse, onUpdateOrder, children, requestForm, onNewRequest, selectedServices, onRemoveSelected, onContinueRequest }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [uploadingOrder, setUploadingOrder] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadNotice, setUploadNotice] = useState("");
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [basketOpen, setBasketOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const money = (amount: number) => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  useEffect(() => { const timer = window.setInterval(() => setClockNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  const normalizedEmail = email.trim().toLowerCase();
  const filteredOrders = useMemo(() => orders.filter(order => order.customerId ? order.customerId === customerUid : Boolean(normalizedEmail) && order.email.trim().toLowerCase() === normalizedEmail), [orders, customerUid, normalizedEmail]);
  const matchingRewards = useMemo(() => normalizedEmail ? discountClaims.filter(claim => claim.email.trim().toLowerCase() === normalizedEmail) : [], [discountClaims, normalizedEmail]);
  const openOrders = filteredOrders.filter(order => !["Completed", "Declined", "Cancelled"].includes(order.status)).length;
  const currentOrder = filteredOrders.find(order => !["Completed", "Declined", "Cancelled"].includes(order.status)) || filteredOrders[0];
  const newUpdates = filteredOrders.reduce((count, order) => count + (order.messages || []).filter(message => message.from === "studio").length, 0);
  const accountUpdates = useMemo(() => filteredOrders.flatMap(order => [
    { id: order.id + ":status", title: order.serviceName + " · " + order.status, detail: order.status === "New request" ? "Your request is saved in this account and is awaiting review." : "Current request status", createdAt: order.statusUpdatedAt || order.createdAt, kind: "status" as const },
    ...(order.messages || []).filter(message => message.from === "studio").map(message => ({ id: message.id, title: "Message from " + businessName, detail: message.text || (message.attachment ? "A file was shared with your request." : "A new request message is available."), createdAt: message.createdAt, kind: "message" as const }))
  ]).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 6), [filteredOrders, businessName]);
  const monogram = businessName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "B";

  useEffect(() => {
    let active = true;
    if (!customerUid) return;
    void ensureCustomerAuth().then(async user => {
      if (!active || user.uid !== customerUid) return;
      setGoogleConnected(user.providerData.some(item => item.providerId === "google.com"));
      const profileSnapshot = await getDoc(doc(getProspecDb(), "prospecCustomers", customerUid));
      if (!active || !profileSnapshot.exists()) return;
      const profile = profileSnapshot.data();
      if (typeof profile.name === "string" && profile.name) setCustomerName(profile.name);
      if (typeof profile.email === "string" && profile.email) setEmail(profile.email);
      if (typeof profile.phone === "string" && profile.phone) setWhatsapp(profile.phone);
    }).catch(() => { /* the account remains usable while profile data reconnects */ });
    return () => { active = false; };
  }, [customerUid, setCustomerName, setEmail, setWhatsapp]);

  async function connectGoogleAccount() {
    if (googleBusy || googleConnected) return;
    setGoogleBusy(true);
    setUploadNotice("");
    const auth = getProspecAuth();
    let accountChanged = false;
    try {
      const currentUser = await ensureCustomerAuth();
      const guestIdToken = currentUser.isAnonymous ? await currentUser.getIdToken() : null;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      let user = currentUser;
      if (!currentUser.providerData.some(item => item.providerId === "google.com")) {
        try {
          user = (await linkWithPopup(currentUser, provider)).user;
        } catch (error) {
          const code = (error as { code?: string }).code;
          if (code !== "auth/credential-already-in-use" && code !== "auth/email-already-in-use") throw error;
          user = (await signInWithPopup(auth, provider)).user;
          accountChanged = user.uid !== currentUser.uid;
          if (accountChanged && guestIdToken) {
            const googleIdToken = await user.getIdToken();
            const response = await fetch("/api/customer/migrate-guest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ guestIdToken, googleIdToken }),
            });
            const result = await response.json().catch(() => ({})) as { error?: string };
            if (!response.ok) throw new Error(result.error || "Google sign-in worked, but your previous guest requests could not be moved safely. Contact Prospec before continuing on this device.");
          }
        }
      }
      const profileRef = doc(getProspecDb(), "prospecCustomers", user.uid);
      const existingSnapshot = await getDoc(profileRef);
      const existing = existingSnapshot.exists() ? existingSnapshot.data() : {};
      const profile = {
        uid: user.uid,
        name: user.displayName || (typeof existing.name === "string" ? existing.name : customerName || ""),
        email: user.email || (typeof existing.email === "string" ? existing.email : email),
        phone: typeof existing.phone === "string" && existing.phone ? existing.phone : whatsapp,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(profileRef, profile, { merge: true });
      setCustomerName(profile.name);
      setEmail(profile.email);
      setWhatsapp(profile.phone);
      setGoogleConnected(user.providerData.some(item => item.providerId === "google.com"));
      setUploadNotice("Your Google account is connected. Your contact details can now be restored when you sign in on another device.");
      if (accountChanged) window.location.reload();
    } catch (error) {
      setUploadNotice(error instanceof Error ? error.message : "Google sign-in could not be completed. Check your connection and try again.");
      if (accountChanged) window.location.reload();
    } finally {
      setGoogleBusy(false);
    }
  }

  const { startUpload, isUploading } = useUploadThing("fileUploader", {
    onUploadProgress: progress => setUploadProgress(Math.max(0, Math.min(100, Math.round(progress)))),
    onUploadError: error => { setUploadNotice(error.message || "Upload failed. Your message has not been sent."); setUploadingOrder(null); setUploadProgress(0); },
  });

  function sendMessage(order: WorkspaceOrder, attachment?: AccountAttachment) {
    const messageText = (drafts[order.id] || "").trim();
    if (!messageText && !attachment) { setUploadNotice("Write a message or attach a file before sending."); return; }
    const message: AccountMessage = { id: "MSG-" + Date.now().toString(36), from: "customer", text: messageText, createdAt: new Date().toISOString(), ...(attachment ? { attachment } : {}) };
    void ensureCustomerAuth().then(() => updateDoc(doc(getProspecDb(), "prospecEnquiries", order.id), { messages: arrayUnion(message), updatedAt: message.createdAt })).catch(() => setUploadNotice("This message could not sync. Reconnect and try again."));
    onUpdateOrder(order.id, current => ({ ...current, messages: [...(current.messages || []), message] }), "Message added to your Prospec request. It will sync when you are online.");
    setDrafts(current => ({ ...current, [order.id]: "" }));
    setUploadNotice("Message added to your Prospec request. It will sync when you are online.");
    setOpenThread(order.id);
  }

  async function attachFile(order: WorkspaceOrder, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const accepted = file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf";
    if (!accepted) { setUploadNotice("Choose an image, video or PDF file."); event.target.value = ""; return; }
    const max = file.type.startsWith("video/") ? 16 * 1024 * 1024 : 4 * 1024 * 1024;
    if (file.size > max) { setUploadNotice(file.type.startsWith("video/") ? "Videos must be 16 MB or smaller." : "Images and PDFs must be 4 MB or smaller."); event.target.value = ""; return; }
    if (!online || !navigator.onLine) { setUploadNotice("Offline: your text message can sync when the connection returns. File uploads need internet. Nothing was uploaded."); event.target.value = ""; return; }
    setUploadingOrder(order.id); setUploadProgress(0); setUploadNotice("Uploading attachment. Keep this page open.");
    try {
      const uploaded = await startUpload([file]);
      const result = uploaded?.[0];
      const url = result?.ufsUrl || result?.url;
      if (!url) { setUploadNotice("Upload completed without a file link. Please try again."); setUploadingOrder(null); return; }
      sendMessage(order, { name: file.name, url, type: file.type, size: file.size });
      setUploadNotice("Attachment uploaded and added to your Prospec request.");
    } catch {
      setUploadNotice("Upload failed. Check your connection and try again; the message was not sent.");
    } finally {
      setUploadingOrder(null); setUploadProgress(0); event.target.value = "";
    }
  }

  const availabilityLabel = availability === "available" ? "Business available" : availability === "limited" ? "Limited availability" : "Currently unavailable";
  const availabilityColor = availability === "available" ? "#16866a" : availability === "limited" ? "#b7791f" : "#c04444";
  const customerGreeting = customerName?.trim() || currentOrder?.customerName || "there";
  const careMessage = !currentOrder ? "Your next request will appear here once you send it." : ["New request", "Received"].includes(currentOrder.status) ? "We've received your request. The business will review it and keep you updated." : ["Completed", "Declined", "Cancelled"].includes(currentOrder.status) ? "This request has reached its latest status. You can open the details whenever you need them." : "Your request is with the business. We'll let you know when there's an update.";
  const lastBusinessUpdate = currentOrder ? [...(currentOrder.messages || [])].filter(message => message.from === "studio").sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt || currentOrder.statusUpdatedAt : undefined;
  const formatShortDate = (value: string) => { try { return new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return value; } };
  const timeAgo = (value: string) => { const minutes = Math.max(0, Math.floor((clockNow - new Date(value).getTime()) / 60000)); if (!Number.isFinite(minutes)) return formatShortDate(value); if (minutes < 1) return "just now"; if (minutes < 60) return minutes + " min ago"; const hours = Math.floor(minutes / 60); if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago"); const days = Math.floor(hours / 24); return days + (days === 1 ? " day ago" : " days ago"); };

  return <section className="sd-account sd-account-inside sd-wrap sd-account-compact" style={{ "--account-brand": accentColor, "--account-secondary": secondaryColor, "--account-highlight": highlightColor } as React.CSSProperties}>
    <header className="sd-account-masthead">
      <div className="sd-account-brand-lockup">
        <span className="sd-account-brand-mark" aria-hidden="true">{monogram}<span className="sd-account-heart">♥</span></span>
        <div><span className="sd-account-overline">{businessName}</span><strong>Customer account</strong></div>
      </div>
      <span className="sd-account-ready"><span aria-hidden="true">●</span> {syncStatus === "synced" ? "Synced with Prospec" : syncStatus === "offline" ? "Offline · will sync" : syncStatus === "connecting" ? "Connecting account…" : "Sync needs attention"}</span>
    </header>

    <div className="sd-google-account-row">
      <div><strong>{googleConnected ? "Google account connected" : "Keep your account with you"}</strong><small>{googleConnected ? "Your saved contact details can follow you to another device." : "Sign in once to recover your customer details and requests on another device."}</small></div>
      <button type="button" className="sd-google-account-button" onClick={connectGoogleAccount} disabled={googleBusy || googleConnected}>
        <svg viewBox="0 0 48 48" width="19" height="19" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.6 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.9c-.58 2.96-2.25 5.47-4.72 7.16l7.62 5.91c4.45-4.11 7.18-10.16 7.18-17.54Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.91l-7.62-5.91c-2.12 1.43-4.84 2.27-8.28 2.27-6.26 0-11.57-4.1-13.47-9.72l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
        {googleBusy ? "Connecting…" : googleConnected ? "Connected" : "Continue with Google"}
      </button>
    </div>

    <div className="sd-account-compact-intro">
      <div><span className="sd-kicker">YOUR SPACE WITH {businessName.toUpperCase()}</span><h1>Dumela, {customerGreeting}.</h1><p>Your Prospec enquiries, in one place.</p></div>
      <button className="sd-account-store-link" onClick={onBrowse}>← Store</button>
    </div>

    <section className="sd-care-card" aria-labelledby="sd-care-title">
      <div className="sd-care-topline"><div className="sd-care-heading"><span className="sd-kicker">YOUR CUSTOMER SPACE</span><h2 id="sd-care-title">Current request</h2></div><span className="sd-availability" style={{ "--availability-color": availabilityColor } as React.CSSProperties}><i />{availabilityLabel}</span></div>
      {currentOrder ? <>
        <div className="sd-care-request"><div><span className="sd-care-label">REQUEST DETAILS</span><h3>{currentOrder.serviceItems?.length ? currentOrder.serviceItems.map(item => item.name).join(" + ") : currentOrder.serviceName}</h3><p>Received {timeAgo(currentOrder.createdAt)} · {formatShortDate(currentOrder.createdAt)} · {typeof currentOrder.quotedPrice === "number" ? "Proposed quote · " + money(currentOrder.quotedPrice) : currentOrder.serviceItems?.some(item => item.price === 0) ? "Quote to be confirmed" : "Catalogue estimate · " + money(currentOrder.price)}</p></div><span className="sd-care-status">{currentOrder.status}</span></div>
        <div className="sd-care-next"><span className="sd-care-label">WHAT HAPPENS NEXT</span><strong>{currentOrder.status === "New request" ? "Business review" : currentOrder.status === "Completed" ? "Request completed" : currentOrder.status === "Declined" ? "Request closed" : currentOrder.status === "Quote ready" ? "Your review" : currentOrder.status === "Reviewing" ? "Business reviewing" : currentOrder.status === "In progress" ? "Business working" : "Business handling"}</strong><p>{careMessage}</p>{lastBusinessUpdate && <small>Last business update · {formatShortDate(lastBusinessUpdate)}</small>}</div>
        <button type="button" className="sd-care-conversation" onClick={() => { setOpenThread(currentOrder.id); document.getElementById("care-request-" + currentOrder.id)?.scrollIntoView({behavior:"smooth",block:"start"}); }}>Open conversation <span>↗</span></button>
      </> : <div className="sd-care-next sd-care-empty-state"><strong>Your next step starts here.</strong><p>{careMessage}</p><button type="button" className="sd-care-empty-action" onClick={selectedServices.length ? onContinueRequest : onBrowse}><span className="sd-care-action-mark" aria-hidden="true">{selectedServices.length ? "✓" : "＋"}</span><span className="sd-care-action-copy"><strong>{selectedServices.length ? `Continue with ${selectedServices.length} selected ${selectedServices.length === 1 ? "item" : "items"}` : "Browse the Store"}</strong><small>{selectedServices.length ? selectedServices.some(item => item.custom || item.price <= 0) ? "Review your request · Price to be confirmed" : `Review your request · ${money(selectedServices.reduce((sum, item) => sum + item.price, 0))}` : "Tap here to explore services and add items to your request."}</small></span><span className="sd-care-action-arrow" aria-hidden="true">→</span></button></div>}
    </section>

    <div className={"sd-account-quick-stats" + (!currentOrder || selectedServices.length ? " has-no-action" : "")} aria-label="Account summary">
      <div><strong>{openOrders}</strong><span>Active {openOrders === 1 ? "request" : "requests"}</span></div>
      <div><strong>{newUpdates}</strong><span>Business {newUpdates === 1 ? "message" : "messages"}</span></div>
      {currentOrder && !selectedServices.length && <button type="button" onClick={onNewRequest}>＋ Start another request</button>}
    </div>

    {selectedServices.length > 0 && <details className="sd-account-basket" open={basketOpen} onToggle={event => setBasketOpen(event.currentTarget.open)}>
      <summary><span>Selected for your next request · {selectedServices.length} {selectedServices.length === 1 ? "item" : "items"} · {selectedServices.some(item=>item.custom) ? "Quote required" : money(selectedServices.reduce((sum,item)=>sum+item.price,0))}</span><b>Edit</b></summary>
      <div className="sd-account-basket-body"><ul>{selectedServices.map(item=><li key={item.id}><span><strong>{item.name}</strong><small>{item.custom ? "Custom item · quote required" : item.price > 0 ? money(item.price) : "Price to be confirmed"}</small></span><button type="button" onClick={()=>onRemoveSelected(item.id)} aria-label={`Remove ${item.name}`}>Remove</button></li>)}</ul><div className="sd-account-basket-actions"><button type="button" className="sd-button sd-primary" onClick={onContinueRequest}>Continue with selected items →</button><button type="button" className="sd-account-secondary-action" onClick={onBrowse}>＋ Add another service</button></div></div>
    </details>}

    {requestForm}

    <nav className="sd-account-quick-links" aria-label="Your account">
      <div><span className="sd-kicker">YOUR ACCOUNT</span><strong>View details</strong></div>
      <a href="#care-requests">Requests</a>
      <button type="button" onClick={() => { if (currentOrder) { setOpenThread(currentOrder.id); window.setTimeout(() => document.getElementById("care-messages-" + currentOrder.id)?.scrollIntoView({behavior:"smooth",block:"start"}), 120); } else document.getElementById("care-requests")?.scrollIntoView({behavior:"smooth"}); }}>Messages</button>
      <button type="button" onClick={() => { if (currentOrder) { setOpenThread(currentOrder.id); window.setTimeout(() => document.getElementById("care-receipts-" + currentOrder.id)?.scrollIntoView({behavior:"smooth",block:"start"}), 120); } else document.getElementById("care-requests")?.scrollIntoView({behavior:"smooth"}); }}>Receipts</button>
      <button type="button" onClick={() => { setRewardsOpen(true); window.setTimeout(() => document.getElementById("care-rewards")?.scrollIntoView({behavior:"smooth",block:"start"}), 80); }}>Rewards</button>
    </nav>

    <section className="sd-account-detail-section" id="care-requests">
      <div className="sd-account-detail-heading"><div><span className="sd-kicker">RECENT ACTIVITY</span><h2>Your updates</h2></div><span>{accountUpdates.length} updates</span></div>
      {accountUpdates.length ? <ol className="sd-care-feed">{accountUpdates.slice(0,5).map(update=><li key={update.id}><span className={update.kind === "message" ? "is-message" : "is-status"} aria-hidden="true">{update.kind === "message" ? "✉" : "♥"}</span><div><strong>{update.title}</strong><p>{update.detail}</p>{update.createdAt && <time>{formatShortDate(update.createdAt)}</time>}</div></li>)}</ol> : <p className="sd-account-notification-empty">Your updates will appear here when the business responds or changes your request status.</p>}
      {filteredOrders.length > 0 && <div className="sd-care-request-list">{filteredOrders.map(order => {
        const messages = order.messages || [];
        const expanded = openThread === order.id;
        return <details className="sd-care-request-detail" id={"care-request-" + order.id} key={order.id} open={expanded}>
          <summary><span><strong>{order.serviceName}</strong><small>{order.id} · {order.status}</small></span><b>View details</b></summary>
          <div className="sd-care-request-body">
            <p><strong>Submitted:</strong> {prettyDate(order.createdAt)}</p>
            {order.serviceItems?.length ? <p><strong>Selected:</strong> {order.serviceItems.map(item => `${item.name} · ${item.price > 0 ? money(item.price) : order.quotedPrice ? "included in quote" : "price to be confirmed"}`).join(", ")}</p> : null}
            {order.whatsapp ? <p><strong>WhatsApp:</strong> {order.whatsapp}</p> : null}
            {order.dueDate && <p><strong>Requested date:</strong> {order.dueDate}</p>}
            {order.brief && <p>{order.brief}</p>}
            {order.discountAmount ? <p className="sd-account-reward-line">Store reward · {money(order.discountAmount)} off</p> : null}
            <div className="sd-account-order-actions"><span>{messages.length} {messages.length === 1 ? "message" : "messages"}</span><button className="sd-account-secondary-action" type="button" aria-expanded={expanded} onClick={() => setOpenThread(expanded ? null : order.id)}>{expanded ? "Close conversation" : "Open conversation →"}</button></div>
            <div id={"care-receipts-" + order.id}><ReceiptDocument businessName={businessName} currency={currency} accentColor={accentColor} receiptProfile={receiptProfile} order={order} /></div>
            {expanded && <section className="sd-account-conversation" id={"care-messages-" + order.id} aria-label={`Conversation for ${order.serviceName}`}>
              <div className="sd-account-conversation-heading"><div><span className="sd-kicker">YOUR CONVERSATION</span><h4>{order.serviceName}</h4></div></div>
              <p className="sd-account-demo-explainer">Messages are linked to this request and synchronise with Prospec when connected.</p>
              <div className="sd-account-messages" aria-live="polite">{messages.length ? messages.map(message => <article key={message.id} className={`sd-account-message is-${message.from}`}><div><strong>{message.from === "customer" ? "You" : businessName}</strong><time>{prettyDate(message.createdAt)}</time></div>{message.text && <p>{message.text}</p>}{message.attachment && <a href={message.attachment.url} target="_blank" rel="noreferrer">↗ {message.attachment.name} · Open attachment</a>}</article>) : <p className="sd-account-message-empty">No messages yet. Send a question to start the conversation.</p>}</div>
              <form className="sd-account-composer" onSubmit={event => { event.preventDefault(); sendMessage(order); }}>
                <label htmlFor={`account-message-${order.id}`}>Write a message<textarea id={`account-message-${order.id}`} rows={3} maxLength={1200} value={drafts[order.id] || ""} onChange={event => setDrafts(current => ({ ...current, [order.id]: event.target.value }))} placeholder="Ask a question about this request…" /></label>
                <div className="sd-account-composer-actions"><label className="sd-account-attach">＋ Attach file<input type="file" accept="image/*,video/*,application/pdf" disabled={isUploading || !online} onChange={event => attachFile(order, event)} /></label><button className="sd-button sd-primary" type="submit" disabled={isUploading || !(drafts[order.id] || "").trim()}>Send message</button></div>
                {uploadingOrder === order.id && <div className="sd-media-progress" role="status"><div className="sd-media-progress-copy"><strong>Uploading attachment</strong><span>{uploadProgress}%</span></div><div className="sd-media-progress-track" role="progressbar" aria-label="Attachment upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}><span style={{ width: uploadProgress + "%" }} /></div></div>}
              </form>
            </section>}
          </div>
        </details>;
      })}</div>}
    </section>

{matchingRewards.length > 0 && <details className="sd-account-collapsible" id="care-rewards" open={rewardsOpen} onToggle={event => setRewardsOpen(event.currentTarget.open)}><summary><span>Rewards</span><b>{matchingRewards.length ? `${matchingRewards.length} available` : "View details"}</b></summary><div><p>Rewards earned in the Store are linked to this email.</p>{matchingRewards.map(claim => <article key={claim.id}><strong>{claim.code}</strong><b>{money(claim.amount)} off</b><span>{claim.status}</span></article>)}{matchingRewards.length === 0 && <p className="sd-account-notification-empty">Rewards earned in the Store will appear here when linked to your email address.</p>}</div></details>}

    {announcementActive && announcement.trim() && <aside className="sd-account-announcement"><span className="sd-kicker">FROM {businessName.toUpperCase()}</span><h3>Business update</h3><p>{announcement}</p></aside>}
    {uploadNotice && <p className="sd-account-feedback" role="status">{uploadNotice}</p>}

    <details className="sd-account-lookup-compact" open={lookupOpen} onToggle={event => setLookupOpen(event.currentTarget.open)}><summary>{normalizedEmail ? "Contact email · " + email : "Add a contact email"} <b>Edit details</b></summary><div><label htmlFor="account-email">Contact email for your requests</label><input id="account-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Enter your email address" autoComplete="email" /><p>Your requests are linked to your secure customer sign-in. A Google account lets you recover this profile on another device; changing the email alone does not move requests.</p></div></details>

    {children && <details className="sd-account-collapsible sd-account-optional-feature"><summary><span>Optional rewards experience</span><b>Explore</b></summary><div>{children}</div></details>}
    <p className="sd-account-boundary">{googleConnected ? "Your Google-linked customer identity can be used to recover this account on another device." : "Guest access remains linked to this device until you connect Google sign-in."} Firestore keeps an offline cache and syncs supported request and message changes when you are back online; attachments need internet.</p>
  </section>;
}
