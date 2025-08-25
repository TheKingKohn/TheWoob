import Nav from "../components/Nav";

export default function Help() {
  return (
    <>
      <Nav authed={true} />
      <main className="woob-container py-8 max-w-2xl mx-auto">
        <h1 className="text-heading-3 mb-6">Trust & Safety</h1>
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-2 text-green-600">Buyer Protection</h2>
          <ul className="list-disc ml-6 text-white/80">
            <li>All payments are securely processed and held until the item is received.</li>
            <li>If your item does not arrive or is not as described, you are eligible for a full refund.</li>
            <li>Our support team is available to help resolve any disputes quickly and fairly.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-2 text-blue-600">Seller Protection</h2>
          <ul className="list-disc ml-6 text-white/80">
            <li>Verified sellers receive priority placement and increased buyer trust.</li>
            <li>Funds are released promptly after successful delivery and buyer confirmation.</li>
            <li>We offer guidance and support for shipping, returns, and resolving issues.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-2 text-purple-600">Refund & Return Policy</h2>
          <ul className="list-disc ml-6 text-white/80">
            <li>Buyers may request a refund within 7 days of receiving an item if it is not as described.</li>
            <li>Sellers must accept returns for items that are damaged, counterfeit, or not as listed.</li>
            <li>All refund and return requests are reviewed by our support team for fairness.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2 text-yellow-500">Contact & Support</h2>
          <p className="text-white/80">For any questions or issues, please contact our support team at <a href="mailto:support@thewoob.com" className="underline text-woob-accent">support@thewoob.com</a>.</p>
        </section>
      </main>
    </>
  );
}
