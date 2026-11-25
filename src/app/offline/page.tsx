import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="orderPage">
      <div className="orderWrap">
        <div className="orderHeader">
          <Link href="/" className="logo"><span className="logoMark">P</span><span>Prospec Group</span></Link>
        </div>
        <section className="orderCard confirm">
          <div className="confirmIcon">📶</div>
          <span className="kicker">Offline mode</span>
          <h1>Prospec Group is still here.</h1>
          <p>The Store can reopen on this device without an internet connection. You may see older product details until you reconnect and refresh.</p>
          <p>Customer requests and messages you send while offline are saved on this device and sent when your connection returns. Changes made in the owner preview stay on this device and are not shared with customers or other devices.</p>
          <p>Sending photos or videos, opening external links and other online services still need internet.</p>
          <p><strong>Before going offline:</strong> open the Store while connected so the latest pages and available images are ready on this device.</p>
          <div className="actions centered">
            <Link className="button buttonPrimary" href="/#service-order">Try customer journey</Link>
            <Link className="button buttonLight" href="/">Open home</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
