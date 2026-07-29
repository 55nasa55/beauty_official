"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Tag,
  Package,
  Truck,
  RefreshCw,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

export function FAQContent() {
  const sections: FAQSection[] = [
    {
      id: "membership",
      title: "Membership",
      icon: <BadgeCheck size={20} style={{ color: "var(--coral)" }} />,
      items: [
        {
          question: "How does CosClub membership work?",
          answer:
            "CosClub is a membership-based beauty store. You pay a low monthly or annual fee, and in return you unlock wholesale pricing on every product we carry. No gimmicks, no point systems — just consistently lower prices on products you already buy.",
        },
        {
          question: "How much does membership cost?",
          answer: (
            <>
              Membership is <strong>$6.99/month</strong> or{" "}
              <strong>$59.99/year</strong> (billed annually). The annual plan
              works out to about $5.00/mo and saves you $23.89 compared to
              paying monthly. Both plans include the same member pricing on all
              products.
            </>
          ),
        },
        {
          question: "Can I cancel my membership?",
          answer:
            "Yes. Monthly members can cancel at any time and retain access through the end of their billing period. Annual plans are non-refundable — if you cancel, your membership remains active through the end of the paid year and will not auto-renew.",
        },
        {
          question: "Can I switch between Monthly and Annual?",
          answer:
            "You can upgrade from Monthly to Annual at any time from your account page — the switch takes effect immediately. Annual plans are non-refundable; if you switch from Annual to Monthly, your monthly plan will begin at your next renewal date after the paid year ends.",
        },
        {
          question: "Is there a free trial?",
          answer:
            "We don't offer a free trial, but at $6.99/mo the membership pays for itself on your first order. Most members save more in their first purchase than the cost of an entire year.",
        },
        {
          question: "Can I share my membership with someone else?",
          answer:
            "Memberships are tied to a single account and are not shareable. Purchasing through a CosClub account for purposes of resale is also prohibited under our membership terms.",
        },
      ],
    },
    {
      id: "pricing",
      title: "Pricing & Savings",
      icon: <Tag size={20} style={{ color: "var(--coral)" }} />,
      items: [
        {
          question: "How is member pricing determined?",
          answer:
            "We source products directly from distributors and pass the savings on to members. We always show both the standard retail price and the member price so you can see exactly how much you're saving on every product.",
        },
        {
          question: "Can non-members still shop?",
          answer:
            "Yes — anyone can shop on CosClub. Non-members pay the standard retail price. Members unlock wholesale pricing on every product, which is where the real savings come in. All prices are shown transparently on every product page so you can see exactly what you'd save with a membership.",
        },
        {
          question: "Do you run additional sales or promotions?",
          answer: (
            <>
              Member pricing is already our best price. We occasionally run
              limited-time promotions on specific products — check the{" "}
              <Link
                href="/browse?category=Sale"
                style={{ color: "var(--coral)", fontWeight: 600 }}
              >
                Sale
              </Link>{" "}
              section and keep an eye on your email for member-only offers.
            </>
          ),
        },
      ],
    },
    {
      id: "orders",
      title: "Orders",
      icon: <Package size={20} style={{ color: "var(--coral)" }} />,
      items: [
        {
          question: "How do I track my order?",
          answer: (
            <>
              Once your order ships, you'll receive a confirmation email with a
              tracking number. You can also view all order history and tracking
              links from your{" "}
              <Link
                href="/account"
                style={{ color: "var(--coral)", fontWeight: 600 }}
              >
                account page
              </Link>{" "}
              under the Orders tab.
            </>
          ),
        },
        {
          question: "Can I change or cancel an order after placing it?",
          answer: (
            <>
              We process orders quickly, so changes may not always be possible.
              Contact us as soon as possible at{" "}
              <a
                href="mailto:support@cosclub.com"
                style={{ color: "var(--coral)", fontWeight: 600 }}
              >
                support@cosclub.com
              </a>{" "}
              and we'll do our best to help before the order ships.
            </>
          ),
        },
        {
          question: "What if my order arrives damaged or incorrect?",
          answer: (
            <>
              We're sorry to hear that. Please{" "}
              <Link
                href="/contact"
                style={{ color: "var(--coral)", fontWeight: 600 }}
              >
                contact us
              </Link>{" "}
              within 7 days of delivery with a photo of the issue and your order
              number. We'll make it right with a replacement or refund.
            </>
          ),
        },
      ],
    },
    {
      id: "shipping",
      title: "Shipping",
      icon: <Truck size={20} style={{ color: "var(--coral)" }} />,
      items: [
        {
          question: "How long does shipping take?",
          answer:
            "We ship via USPS Ground Advantage (2–5 business days) or UPS Ground (1–5 business days). We do not offer expedited or overnight shipping. Processing time is 1–2 business days before your order ships.",
        },
        {
          question: "Do you offer free shipping?",
          answer:
            "Yes. Members get free shipping on orders over $55. Non-members get free shipping on orders over $75. Everyone pays a flat $8.95 S&H on orders below their threshold. One more reason the membership pays for itself fast.",
        },
        {
          question: "Do you ship internationally?",
          answer:
            "Currently we ship within the United States only. International shipping is something we're actively working toward — follow us on social or subscribe to our emails to be notified when it launches.",
        },
      ],
    },
    {
      id: "returns",
      title: "Returns & Refunds",
      icon: <RefreshCw size={20} style={{ color: "var(--coral)" }} />,
      items: [
        {
          question: "What is your return policy?",
          answer:
            "We accept returns on unopened, unused products within 30 days of delivery. The following are not eligible for return: opened beauty products (hygiene), skincare and serums, and sale/clearance items. All sales on ineligible items are final. We do not offer exchanges.",
        },
        {
          question: "How do I start a return?",
          answer: (
            <>
              Email us at{" "}
              <a
                href="mailto:support@cosclub.com"
                style={{ color: "var(--coral)", fontWeight: 600 }}
              >
                support@cosclub.com
              </a>{" "}
              with your order number and reason for return. We'll send you a
              prepaid return label. Once we receive and inspect the item, your
              refund will be processed within 5–7 business days.
            </>
          ),
        },
      ],
    },
    {
      id: "products",
      title: "Products",
      icon: <Sparkles size={20} style={{ color: "var(--coral)" }} />,
      items: [
        {
          question: "Are your products authentic?",
          answer:
            "100%. We source directly from authorized distributors. Every product we carry is genuine — never counterfeit, grey market, or tampered with.",
        },
        {
          question: "What if a product I want isn't in the catalogue?",
          answer: (
            <>
              Submit a request on our{" "}
              <Link
                href="/#suggest"
                style={{ color: "var(--coral)", fontWeight: 600 }}
              >
                homepage
              </Link>
              . We take every suggestion seriously — we don't decide what goes
              on our shelves, our members do. If enough members request the same
              product, we'll source it.
            </>
          ),
        },
        {
          question: "Are your products cruelty-free?",
          answer:
            "Many of the brands we carry are cruelty-free. We're working on adding cruelty-free and vegan filter tags to make it easier to shop by your values. In the meantime, you can check each brand's individual policy on their website.",
        },
      ],
    },
  ];

  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <>
      {/* Page Hero */}
      <div
        className="text-center"
        style={{ background: "var(--blush-pink)", padding: "64px 5%" }}
      >
        <h1
          className="font-heading"
          style={{ fontSize: "42px", fontWeight: 700, marginBottom: "12px" }}
        >
          Frequently Asked Questions
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--charcoal)",
            opacity: 0.75,
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          Everything you need to know about CosClub. Can&apos;t find your
          answer?{" "}
          <Link
            href="/contact"
            style={{ color: "var(--coral)", fontWeight: 700 }}
          >
            Contact us.
          </Link>
        </p>
      </div>

      {/* FAQ Body */}
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "64px 5%" }}>
        {sections.map((section) => (
          <div key={section.id} style={{ marginBottom: "48px" }}>
            <div
              className="font-heading flex items-center"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--charcoal)",
                marginBottom: "16px",
                paddingBottom: "10px",
                borderBottom: "2px solid var(--blush-pink)",
                gap: "10px",
              }}
            >
              {section.icon} {section.title}
            </div>

            {section.items.map((item, idx) => {
              const key = `${section.id}-${idx}`;
              const isOpen = openKey === key;

              return (
                <div
                  key={key}
                  style={{ borderBottom: "1px solid var(--light-gray)" }}
                >
                  <button
                    onClick={() => toggle(key)}
                    aria-expanded={isOpen}
                    className="flex justify-between items-center w-full"
                    style={{
                      padding: "20px 0",
                      fontWeight: 600,
                      fontSize: "15px",
                      cursor: "pointer",
                      transition: "color 0.2s",
                      color: isOpen ? "var(--coral)" : "var(--charcoal)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--coral)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isOpen
                        ? "var(--coral)"
                        : "var(--charcoal)";
                    }}
                  >
                    {item.question}
                    <ChevronDown
                      size={18}
                      style={{
                        flexShrink: 0,
                        transition: "transform 0.3s",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: isOpen ? "var(--coral)" : "var(--gray)",
                      }}
                    />
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? "400px" : "0",
                      overflow: "hidden",
                      fontSize: "14px",
                      color: "var(--gray)",
                      lineHeight: 1.8,
                      transition: "max-height 0.35s ease, padding 0.3s",
                      paddingBottom: isOpen ? "20px" : "0",
                    }}
                  >
                    {item.answer}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Still have questions CTA */}
      <div
        style={{
          background: "var(--charcoal)",
          color: "white",
          borderRadius: "16px",
          padding: "48px",
          textAlign: "center",
          margin: "0 auto 80px",
          maxWidth: "780px",
        }}
      >
        <h2
          className="font-heading"
          style={{ fontSize: "28px", marginBottom: "12px" }}
        >
          Still have questions?
        </h2>
        <p style={{ color: "#A0A0A0", marginBottom: "28px", fontSize: "15px" }}>
          Our team typically responds within 24 hours.
        </p>
        <Link
          href="/contact"
          className="btn-cta inline-block"
          style={{
            background: "var(--blush-pink)",
            color: "var(--charcoal)",
            padding: "14px 32px",
            fontWeight: 700,
            borderRadius: "8px",
            fontSize: "15px",
            transition: "background 0.2s",
          }}
        >
          Contact Us
        </Link>
      </div>
    </>
  );
}
