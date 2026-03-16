"use client";

import React, { useState } from "react";
import {
  Tag,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

export function FAQContent() {
  const categories: FAQCategory[] = [
    {
      id: "membership",
      title: "Membership & Pricing",
      icon: <Tag className="w-6 h-6 text-blue-500" />,
      items: [
        {
          question: "Do I need a membership to shop?",
          answer:
            "No. You can browse and purchase as a guest at standard pricing.",
        },
        {
          question: "What is the difference between guest pricing and member pricing?",
          answer:
            "Guest pricing is available to everyone. Member pricing offers lower prices on eligible products for customers with an active membership.",
        },
        {
          question: "How do I become a member?",
          answer:
            "You can create an account and join through the membership prompts shown on the site, including product pages and your cart.",
        },
        {
          question: "Can I see member savings before joining?",
          answer:
            "Yes. We show pricing and savings clearly on eligible products so you can compare guest and member pricing before you decide.",
        },
      ],
    },
    {
      id: "orders",
      title: "Orders & Shipping",
      icon: <Truck className="w-6 h-6 text-blue-500" />,
      items: [
        {
          question: "How long does order processing take?",
          answer:
            "Most orders are processed within 1–3 business days after payment is confirmed.",
        },
        {
          question: "How much is shipping?",
          answer:
            "Shipping costs are calculated at checkout based on your delivery address, package size/weight, and the shipping method you select.",
        },
        {
          question: "Do you provide tracking?",
          answer:
            "Yes, tracking is provided when available. You will receive a shipping confirmation email once your order ships.",
        },
        {
          question: "What if my package is delayed?",
          answer:
            "Carrier delays can happen due to weather or peak seasons. If your order is significantly delayed, please Contact Us and we'll help review the shipment status.",
        },
      ],
    },
    {
      id: "returns",
      title: "Returns & Support",
      icon: <RotateCcw className="w-6 h-6 text-blue-500" />,
      items: [
        {
          question: "What is your return window?",
          answer: "Eligible items may be returned within 14 days of delivery.",
        },
        {
          question: "Can I return opened beauty products?",
          answer: (
            <span>
              <strong>
                For hygiene and safety reasons, opened or used beauty, skincare,
                and personal care products are not eligible for return.
              </strong>
            </span>
          ),
        },
        {
          question: "What if I received the wrong or damaged item?",
          answer:
            "Please contact us within 7 days of delivery with your order number and photos of the item. We'll help resolve it quickly.",
        },
        {
          question: "How do I contact support?",
          answer:
            "Please use our Contact Page and include your order number for faster support.",
        },
      ],
    },
    {
      id: "products",
      title: "Products",
      icon: <Sparkles className="w-6 h-6 text-blue-500" />,
      items: [
        {
          question: "Are all products eligible for member pricing?",
          answer:
            "Member pricing applies to most items in our catalog. Eligibility and pricing are clearly displayed on each individual product page.",
        },
        {
          question: "Will products go out of stock?",
          answer:
            "Some items may sell out. If inventory changes while an item is in your cart, the cart will automatically update and notify you.",
        },
        {
          question: "Can I leave a review?",
          answer:
            "Yes! We love hearing from our community. Customers who are logged in and have purchased the product are encouraged to leave reviews.",
        },
      ],
    },
  ];

  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenQuestion((prev) => (prev === key ? null : key));
  };

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-10">
          Frequently Asked Questions
        </h1>

        {/* Category Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 text-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className="flex flex-col items-center gap-2 py-3 hover:text-blue-500 transition"
            >
              {cat.icon}
              <span className="font-medium">{cat.title}</span>
            </button>
          ))}
        </div>

        {/* Category Sections */}
        {categories.map((cat) => (
          <div key={cat.id} id={cat.id} className="mb-14">
            <h2 className="text-2xl font-semibold mb-6">{cat.title}</h2>

            <div className="flex flex-col gap-4">
              {cat.items.map((item, idx) => {
                const key = `${cat.id}-${idx}`;
                const isOpen = openQuestion === key;

                return (
                  <div
                    key={key}
                    className="border rounded-lg bg-white shadow-sm overflow-hidden"
                  >
                    {/* Question */}
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex justify-between items-center px-4 py-4 font-medium text-left hover:text-blue-500 transition"
                    >
                      {item.question}
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Answer */}
                    {isOpen && (
                      <div className="px-4 pb-4 text-gray-700">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still Need Help */}
        <div className="mt-20 bg-[#F4F9FF] rounded-lg py-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">Still Need Help?</h2>
          <p className="mb-6">
            Can't find what you're looking for? Our team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-block bg-[#9DCBF3] text-white px-6 py-3 rounded-md hover:bg-blue-400 transition"
          >
            Contact Customer Support
          </a>
        </div>
      </div>
    </div>
  );
}
