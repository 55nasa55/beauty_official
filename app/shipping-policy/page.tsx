import React from "react";
import { Clock3, MapPin, Package } from "lucide-react";

export default function ShippingPolicyPage() {
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Shipping Policy</h1>
        <p className="text-center text-gray-600 mb-12">
          We're committed to getting your order to you as quickly and reliably as possible.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-10 mb-16">
          <div className="flex flex-col items-center text-center">
            <Clock3 className="w-12 h-12 text-blue-500 mb-2" />
            <p className="font-semibold">1–3 Business Days Processing</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <MapPin className="w-12 h-12 text-blue-500 mb-2" />
            <p className="font-semibold">U.S. Shipping Only</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Package className="w-12 h-12 text-blue-500 mb-2" />
            <p className="font-semibold">Tracking Included</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="border rounded-lg p-6 shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4">Order Processing</h2>
            <p className="mb-4">
              Orders are typically processed within 1–3 business days after payment is confirmed.
            </p>
            <p className="mb-2">Processing times may be longer during:</p>
            <ul className="list-disc list-inside mb-4">
              <li>Holidays</li>
              <li>Promotions</li>
              <li>High order volume periods</li>
              <li>Product restocks</li>
            </ul>
            <p>
              Once your order ships, you will receive a confirmation email with tracking information (when available).
            </p>
          </div>

          <div className="border rounded-lg p-6 shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4">Shipping Rates</h2>
            <p className="mb-2">Shipping rates are calculated at checkout based on:</p>
            <ul className="list-disc list-inside mb-4">
              <li>Delivery address</li>
              <li>Package weight and size</li>
              <li>Shipping method selected</li>
            </ul>
            <p className="mb-4">
              Any applicable shipping charges will be shown before you place your order.
            </p>
            <h3 className="text-lg font-semibold mb-2">Delivery Times</h3>
            <p className="mb-2">
              Estimated delivery times vary depending on the shipping method and destination.
            </p>
            <p className="mb-2">Please note:</p>
            <ul className="list-disc list-inside">
              <li>Delivery time estimates are not guaranteed</li>
              <li>Carrier delays may occur due to weather, holidays, or other factors outside our control</li>
            </ul>
          </div>

          <div className="border rounded-lg p-6 shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4">Shipping Availability</h2>
            <p className="mb-4">We currently ship within the United States.</p>
            <p className="mb-4">At this time, we do not offer international shipping.</p>
            <p>
              If your address is not available during checkout, please contact us and we'll let you know if shipping can
              be arranged within the U.S.
            </p>
          </div>

          <div className="border rounded-lg p-6 shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4">Incorrect Shipping Information</h2>
            <p className="mb-4">
              Please make sure your shipping address is correct before placing your order.
            </p>
            <p className="mb-2">CosClub is not responsible for delays or delivery issues caused by:</p>
            <ul className="list-disc list-inside mb-4">
              <li>Incorrect addresses</li>
              <li>Missing apartment/unit numbers</li>
              <li>Undeliverable addresses entered at checkout</li>
            </ul>
            <p>
              If an order is returned to us due to an address issue, additional shipping charges may apply to reship the
              order.
            </p>
          </div>

        </div>

        <div className="border rounded-lg p-6 shadow-sm bg-white mt-8">
          <h2 className="text-xl font-semibold mb-4">Lost, Delayed, or Damaged Packages</h2>
          <p className="mb-4">
            If your package is delayed, lost, or arrives damaged, please contact us as soon as possible.
          </p>
          <p className="mb-2">We will do our best to help by:</p>
          <ul className="list-disc list-inside">
            <li>Reviewing the shipment status</li>
            <li>Assisting with a carrier claim (if applicable)</li>
            <li>Providing next steps based on the issue</li>
          </ul>
        </div>

        <div className="text-center py-12 mt-12 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Contact</h2>
          <p className="mb-6">
            If you have any shipping questions, please contact us through our Contact page and include your order number
            for faster support.
          </p>
          <a
            href="/contact"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
          >
            Visit Our Contact Page
          </a>
        </div>
      </div>
    </div>
  );
}
