"use client";

import React from "react";

const toc = [
  { label: "Use of Website", id: "use-website" },
  { label: "Account Registration", id: "account" },
  { label: "Membership Terms", id: "membership" },
  { label: "Product Information & Availability", id: "product-availability" },
  { label: "Orders & Acceptance", id: "orders" },
  { label: "Payment", id: "payment" },
  { label: "Shipping", id: "shipping" },
  { label: "Returns, Refunds & Exchanges", id: "returns" },
  { label: "Reviews & User Content", id: "user-content" },
  { label: "Intellectual Property", id: "intellectual-property" },
  { label: "DISCLAIMER OF Warranties", id: "disclaimer" },
  { label: "LIMITATION OF LIABILITY", id: "liability" },
  { label: "Indemnification", id: "indemnification" },
  { label: "Changes to These Terms", id: "changes" },
  { label: "Governing Law", id: "governing-law" },
  { label: "Contact", id: "contact" },
];

export function TermsContent() {
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-2">Terms of Service</h1>
        <p className="text-center text-gray-600 mb-10">Last updated: February 23, 2026</p>

        <p className="text-gray-700 mb-12 text-center max-w-3xl mx-auto">
          These Terms of Service ("Terms") govern your use of the CosClub website and
          services. By accessing or using our website, creating an account, or placing an
          order, you agree to these Terms.
          <br />
          If you do not agree to these Terms, please do not use our website.
        </p>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar / TOC */}
          <div className="md:col-span-1 border rounded-lg p-4 h-fit sticky top-6 bg-white shadow-sm">
            <ul className="space-y-2 text-sm">
              {toc.map((t) => (
                <li key={t.id}>
                  <button
                    className="text-left hover:text-[#9DCBF3] transition"
                    onClick={() => handleScroll(t.id)}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-14">
            {/* SECTION 1 */}
            <section id="use-website">
              <h2 className="text-2xl font-semibold mb-4">1. Use of the Website</h2>
              <p className="mb-3">
                You agree to use the website only for lawful purposes and in accordance with
                these Terms.
              </p>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Use the website in any way that violates applicable laws or regulations</li>
                <li>Interfere with the website's operation or security</li>
                <li>Attempt to gain unauthorized access to accounts or systems</li>
                <li>Submit false, misleading, or fraudulent information</li>
                <li>Abuse reviews, ratings, or user-submitted content features</li>
              </ul>
              <p>We reserve the right to suspend or terminate access for violations of these Terms.</p>
            </section>

            {/* SECTION 2 */}
            <section id="account">
              <h2 className="text-2xl font-semibold mb-4">2. Account Registration</h2>
              <p className="mb-3">Some features may require an account. You are responsible for:</p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Providing accurate information</li>
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>All activity that occurs under your account</li>
              </ul>
              <p>
                If you believe your account has been compromised, please contact us promptly.
              </p>
            </section>

          {/* SECTION 3 — LIGHT BLUE BLOCK */}
            <section
              id="membership"
              className="border border-[#9DCBF3] rounded-lg p-6 bg-[#F7FAFF]"
            >
              <h2 className="text-2xl font-semibold mb-4">3. Membership Terms</h2>

              <p className="mb-4">
                CosClub may offer membership-based pricing and benefits on eligible products.
                By purchasing or using a CosClub membership, you agree to the membership terms
                below.
              </p>

              <h3 className="text-xl font-semibold mb-2">3.1 Membership Benefits</h3>
              <p className="mb-4">
                Membership benefits may include access to lower member pricing and other
                membership-related features on eligible products.
                <br />
                Membership benefits, pricing, and feature availability may change from time to
                time at CosClub's discretion.
              </p>

              <h3 className="text-xl font-semibold mb-2">3.2 Membership Billing and Renewal</h3>
              <p className="mb-4">
                If CosClub offers recurring memberships, your membership may automatically renew
                at the billing interval selected during signup (for example, monthly or
                annually), unless canceled before the renewal date.
                <br />
                By enrolling in a recurring membership, you authorize CosClub (and its payment
                processor) to charge your payment method for recurring membership fees until
                canceled.
                <br />
                CosClub will display membership pricing, billing frequency, and renewal terms at
                checkout or before purchase.
              </p>

             <h3 className="text-xl font-semibold mb-2">3.3 Membership Fees and Refunds</h3>
              <p className="mb-4">
                Membership fees are non-refundable, except where required by law.
                <br />
                CosClub does not provide full or partial refunds for:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Unused membership time</li>
                <li>Change of mind</li>
                <li>Cancellation after a membership charge has been processed</li>
                <li>Failure to use membership benefits</li>
              </ul>
              <p className="mb-4">
                If you believe you were charged in error (for example, duplicate billing or a
                technical issue), please contact CosClub through our Contact page. We will review
                billing issues and, if appropriate, issue a correction or refund.
              </p>

              <h3 className="text-xl font-semibold mb-2">3.4 Membership Cancellation</h3>
              <p className="mb-4">
                You may cancel your membership at any time.
                <br />
                If you cancel a recurring membership, your membership benefits will remain active
                through the end of your current billing period, and your membership will not
                renew after that.
                <br />
                Canceling a membership does not entitle you to a refund for membership fees
                already paid.
              </p>

              <h3 className="text-xl font-semibold mb-2">3.5 Membership Eligibility and Account Use</h3>
              <p className="mb-4">
                Memberships are intended for the account holder only and may not be shared,
                transferred, or resold.
                <br />
                CosClub reserves the right to suspend or terminate membership access if we detect
                misuse, abuse, fraud, or violations of these Terms.
              </p>

              <h3 className="text-xl font-semibold mb-2">3.6 Changes to Membership Programs</h3>
              <p>
                CosClub may modify, suspend, or discontinue membership plans, fees, benefits, or
                eligibility requirements at any time. Any changes will apply prospectively unless
                otherwise required by law.
              </p>
            </section>

          {/* SECTION 4 */}
            <section id="product-availability">
              <h2 className="text-2xl font-semibold mb-4">
                4. Product Information and Availability
              </h2>
              <p className="mb-4">
                We make reasonable efforts to display product descriptions, pricing, and
                availability accurately. However:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Product availability may change without notice</li>
                <li>Pricing errors may occur</li>
                <li>
                  Product images and colors may vary based on screen settings, lighting, and
                  product batch differences
                </li>
              </ul>
              <p className="text-sm text-gray-600">
                We reserve the right to correct errors, update product information, and cancel
                orders affected by pricing or listing errors.
              </p>
            </section>

            {/* SECTION 5 */}
            <section id="orders">
              <h2 className="text-2xl font-semibold mb-4">5. Orders and Acceptance</h2>
              <p className="mb-4">
                Placing an order does not guarantee acceptance. We reserve the right to refuse,
                cancel, or limit any order for reasons including, but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Product unavailability</li>
                <li>Payment issues</li>
                <li>Suspected fraud or abuse</li>
                <li>Errors in product or pricing information</li>
              </ul>
              <p>
                If an order is canceled after payment is authorized, we will issue a refund to the
                original payment method as applicable.
              </p>
            </section>

          {/* SECTION 6 */}
            <section id="payment">
              <h2 className="text-2xl font-semibold mb-4">6. Payment</h2>
              <p className="mb-3">
                Payments are processed through third-party payment providers. By submitting payment
                information, you represent that you are authorized to use the payment method
                provided.
              </p>
              <p>
                We are not responsible for errors caused by third-party payment processors, but we
                will work with you to help resolve order-related issues.
              </p>
            </section>

            {/* SECTION 7 */}
            <section id="shipping">
              <h2 className="text-2xl font-semibold mb-4">7. Shipping</h2>
              <p className="mb-3">
                CosClub currently ships within the United States, including Puerto Rico.
              </p>
              <p className="mb-3">
                Shipping times are estimates only and are not guaranteed. Delays may occur due to
                carriers, weather, holidays, or other factors outside our control.
              </p>
              <p>
                Customers are responsible for providing accurate shipping information. CosClub is
                not responsible for delays or failed delivery due to incorrect or incomplete
                addresses provided at checkout.
              </p>
            </section>

            {/* SECTION 8 */}
            <section id="returns">
              <h2 className="text-2xl font-semibold mb-4">
                8. Returns, Refunds, and Exchanges
              </h2>
              <p className="mb-3">Returns and refunds are subject to our Return Policy.</p>
              <p className="mb-3">
                Beauty, skincare, personal care, and health-related items may be subject to hygiene
                and safety restrictions, including non-return eligibility for opened or used items.
              </p>
              <p>CosClub does not offer exchange services at this time.</p>
            </section>


            {/* SECTION 9 */}
            <section id="user-content">
              <h2 className="text-2xl font-semibold mb-4">9. Reviews and User Content</h2>
              <p className="mb-3">
                If you submit reviews, ratings, images, or other content to the website, you grant
                CosClub a non-exclusive, royalty-free, worldwide license to use, display,
                reproduce, and publish that content in connection with our business and website
                operations.
              </p>
              <p className="mb-3">You agree not to submit content that:</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Is false, misleading, or defamatory</li>
                <li>Infringes another party's rights</li>
                <li>Contains unlawful, abusive, or offensive material</li>
                <li>Includes sensitive personal information of yourself or others</li>
              </ul>
              <p>
                We reserve the right to remove or moderate user content at our discretion.
              </p>
            </section>

            {/* SECTION 10 */}
            <section id="intellectual-property">
              <h2 className="text-2xl font-semibold mb-4">10. Intellectual Property</h2>
              <p className="mb-3">
                All content on the website, including text, graphics, logos, images, and site
                design, is owned by CosClub or its licensors and is protected by applicable
                intellectual property laws.
              </p>
              <p>
                You may not copy, reproduce, distribute, or use website content without prior
                written permission, except for personal, non-commercial use.
              </p>
            </section>

            {/* SECTION 11 */}
            <section id="disclaimer">
              <h2 className="text-2xl font-semibold mb-4">11. Disclaimer of Warranties</h2>
              <p className="mb-3">
                The website and services are provided on an "as is" and "as available" basis.
              </p>
              <p>
                To the fullest extent permitted by law, CosClub disclaims all warranties, express
                or implied, including warranties of merchantability, fitness for a particular
                purpose, and non-infringement.
                <br />
                We do not guarantee that the website will be uninterrupted, error-free, or free
                from harmful components.
              </p>
            </section>

         {/* SECTION 12 */}
            <section id="liability">
              <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
              <p className="mb-3">
                To the fullest extent permitted by law, CosClub will not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising from or related to
                your use of the website, products, or services.
              </p>
              <p>
                Our total liability for any claim relating to an order or use of the website shall
                not exceed the amount paid by you for the applicable order, to the extent permitted
                by law.
              </p>
            </section>

            {/* SECTION 13 */}
            <section id="indemnification">
              <h2 className="text-2xl font-semibold mb-4">13. Indemnification</h2>
              <p className="mb-3">
                You agree to defend, indemnify, and hold harmless CosClub and its affiliates,
                officers, employees, and service providers from claims, liabilities, damages, and
                expenses arising from:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Your use of the website</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another person or entity</li>
              </ul>
            </section>


            {/* SECTION 14 */}
            <section id="changes">
              <h2 className="text-2xl font-semibold mb-4">14. Changes to These Terms</h2>
              <p>
                We may update these Terms from time to time. When we do, we will update the "Last
                updated" date above. Continued use of the website after changes are posted means you
                accept the updated Terms.
              </p>
            </section>

            {/* SECTION 15 */}
            <section id="governing-law">
              <h2 className="text-2xl font-semibold mb-4">15. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of California, without regard to
                conflict of law principles.
              </p>
            </section>

            {/* SECTION 16 — CONTACT */}
            <section id="contact" className="mb-20">
              <h2 className="text-2xl font-semibold mb-4">16. Contact</h2>
              <p className="mb-6">
                If you have questions about these Terms, please contact us through our Contact page.
              </p>

              <div className="text-center bg-[#9DCBF3] text-white py-10 rounded-lg">
                <a
                  href="/contact"
                  className="bg-white text-[#9DCBF3] px-6 py-3 rounded-md font-medium hover:bg-gray-200 transition"
                >
                  Contact Us About Our Terms
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
