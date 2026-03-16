import React from "react";
import { ShieldCheck, AlertTriangle, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabasePublic } from "@/lib/supabase/public";

export default async function ReturnPolicyPage() {
  const { data: categories } = await supabasePublic.from("categories").select("*");
  const { data: brands } = await supabasePublic.from("brands").select("*");
  const { data: collections } = await supabasePublic.from("collections").select("*");

  return (
    <>
      <Header categories={categories ?? []} brands={brands ?? []} collections={collections ?? []} />
      <main className="w-full">
        <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-4">Return Policy</h1>
        <p className="text-center text-gray-700 mb-12">
          We want you to feel confident shopping with CosClub. If there is an issue with your order, we're here to help.
        </p>

        {/* Eligibility Section */}
        <h2 className="text-2xl font-semibold mb-6">Return Eligibility</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* General Eligibility */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-3">General Eligibility</h3>
            <p className="mb-3">We accept return requests for eligible items within 14 days of delivery.</p>
            <p className="mb-2">To be eligible for a return, items must be:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Unopened</li>
              <li>Unused</li>
              <li>In original condition</li>
              <li>In original packaging (if applicable)</li>
            </ul>
          </div>

          {/* Hygiene & Safety Policy */}
          <div className="rounded-lg p-6 shadow-sm border-2 border-[#9DCBF3] bg-[#E8F2FF]">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-6 h-6 text-[#337ACC]" />
              <h3 className="text-xl font-semibold">Hygiene & Safety Policy (Beauty and Personal Care Items)</h3>
            </div>

            <p className="mb-3">
              To protect all customers and maintain product safety standards, opened or used beauty, skincare, personal care, and health-related items are not eligible for return or refund.
            </p>

            <p className="mb-2">These items are only eligible for return if they are:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Unopened</li>
              <li>Unused</li>
              <li>In original condition</li>
            </ul>
          </div>
        </div>

        {/* Damaged or Incorrect */}
        <div className="mt-12 mb-10 p-6 bg-[#F8FAFF] border rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-semibold">Damaged, Defective, or Incorrect Items</h3>
          </div>
          <p>
            If your order arrives damaged, defective, or incorrect, please contact us within 7 days of delivery.
          </p>
        </div>

       {/* Procedure Section */}
        <h2 className="text-2xl font-semibold mb-6">Return (Refund) Request Procedure</h2>

        <p className="mb-6">
          To request a return or refund, please contact CosClub Customer Support through our Contact page and include the required information below.
          <br />
          Failure to provide the required information may result in delays or denial of your return (refund) request.
        </p>

        <h3 className="text-xl font-semibold mb-3">Required Information</h3>
        <ul className="list-disc list-inside space-y-2 mb-10">
          <li>Order number</li>
          <li>Item(s) you want to return</li>
          <li>Brief description of the issue or reason for return</li>
          <li>Photos of the damaged, defective, or incorrect item (if applicable)</li>
          <li>
            If you received the wrong item, please also include a photo of the shipping label attached to the package.
          </li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Review Process</h3>
        <p className="mb-12">
          Once your request is submitted, our team will review the details and determine the appropriate resolution based on the issue and item condition.
          <br />
          If approved, we will provide next steps, which may include a return, replacement, store credit, or refund.
        </p>

        {/* Non-Eligibility */}
        <h2 className="text-2xl font-semibold mb-6">Non-Eligibility for Returns (Refunds)</h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <ul className="space-y-2">
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>The item was not purchased from CosClub</span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>
                The package was returned due to customer-related reasons (for example: incorrect address, incomplete address, recipient unavailable, or refused delivery)
              </span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>The request is due to a change of mind</span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>The wrong item or option was ordered by the customer</span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>The return request is made more than 14 days after delivery</span>
            </li>
          </ul>

         <ul className="space-y-2">
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>A damaged, defective, or incorrect item claim is made more than 7 days after delivery</span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>The product was intentionally damaged</span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>The product has been used, opened, or is not in original condition</span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>
                The return is requested only to change a color, scent, shade, size, or product option
              </span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>The item is marked as final sale</span>
            </li>
            <li className="flex gap-2 items-start">
              <X className="w-5 h-5 text-red-500 mt-1" />
              <span>The item is a gift card (if applicable)</span>
            </li>
          </ul>
        </div>

        {/* Shipping & Refunds */}
        <h2 className="text-2xl font-semibold mb-6">Return Shipping</h2>
        <p className="mb-12">
          Customers are responsible for return shipping costs unless:
          <br />
          The item arrived damaged
          <br />
          The item is defective
          <br />
          We sent the wrong item
          <br />
          <br />
          We recommend using a trackable shipping method for all returns.
        </p>

        <h2 className="text-2xl font-semibold mb-6">Refunds</h2>
        <p className="mb-12">
          Once your return is received and inspected, we will notify you of the refund status.
          <br />
          If approved, refunds will be issued to your original payment method. Please allow additional processing time for your bank or card provider to complete the refund.
        </p>

        <h2 className="text-2xl font-semibold mb-6">Exchanges</h2>
        <p className="mb-12">
          CosClub does not offer exchange services at this time.
        </p>

        <h2 className="text-2xl font-semibold mb-6">Product Color & Appearance Disclaimer</h2>
        <p className="mb-12">
          Actual product colors and appearance may vary slightly depending on your device screen settings, lighting, and individual use. Please review product details carefully before purchasing.
        </p>

        <h2 className="text-2xl font-semibold mb-6">Refused or Undeliverable Packages</h2>
        <p className="mb-12">
          If an order is returned to us because it was refused or undeliverable due to an address issue, shipping charges may be non-refundable and additional shipping fees may apply to reship the order.
        </p>

        {/* Contact CTA */}
        <div className="text-center bg-[#9DCBF3] text-white py-12 rounded-lg mt-16">
          <h2 className="text-xl font-semibold mb-4">Contact</h2>
          <p className="mb-6">
            If you need help with a return, please contact us through our Contact page and we'll be happy to assist.
          </p>
          <a
            href="/contact"
            className="bg-white text-[#9DCBF3] px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition"
          >
            Contact Support for Help
          </a>
        </div>
      </div>
      </main>
      <Footer />
    </>
  );
}
