import React from "react";
import { Lock, Heart, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabasePublic } from "@/lib/supabase/public";

export default async function PrivacyPolicyPage() {
  const { data: categories } = await supabasePublic.from("categories").select("*");
  const { data: brands } = await supabasePublic.from("brands").select("*");
  const { data: collections } = await supabasePublic.from("collections").select("*");

  return (
    <>
      <Header categories={categories ?? []} brands={brands ?? []} collections={collections ?? []} />
      <main className="w-full">
        <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-2">Privacy Policy</h1>
        <p className="text-center text-gray-600 mb-10">
          Last updated: February 23, 2026
        </p>

        <p className="text-gray-700 mb-12 text-center">
          CosClub ("CosClub," "we," "our," or "us") values your privacy. This Privacy Policy explains
          how we collect, use, and protect your information when you visit our website, create an
          account, place an order, or contact us.
          <br />
          By using our website, you agree to the practices described in this Privacy Policy.
        </p>

        {/* Privacy Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-16">
          <div className="flex flex-col items-center gap-3">
            <Lock className="w-10 h-10 text-[#9DCBF3]" />
            <p className="font-semibold">Secure Payments</p>
            <p className="text-gray-600 text-sm">We never store your full card details.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Heart className="w-10 h-10 text-[#9DCBF3]" />
            <p className="font-semibold">No Selling</p>
            <p className="text-gray-600 text-sm">We never sell your personal information.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Eye className="w-10 h-10 text-[#9DCBF3]" />
            <p className="font-semibold">Transparent Use</p>
            <p className="text-gray-600 text-sm">We only collect what we need to serve you.</p>
          </div>
        </div>

        {/* Information We Collect */}
        <h2 className="text-2xl font-bold mb-6">Information We Collect</h2>

        {/* Section A & B */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Information You Provide */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-3">1) Information You Provide to Us</h3>
            <p className="mb-3">
              We may collect information you provide directly, including:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Name</li>
              <li>Email address</li>
              <li>Shipping and billing address</li>
              <li>Phone number (if provided)</li>
              <li>Account login information</li>
              <li>Membership information</li>
              <li>Order details</li>
              <li>Messages submitted through our Contact page</li>
              <li>Product reviews, ratings, and uploaded review images</li>
            </ul>
          </div>

          {/* Automatic Collection */}
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-3">3) Information Collected Automatically</h3>
            <p className="mb-3">
              When you use our website, we may automatically collect certain technical and usage
              information, such as:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device type</li>
              <li>Pages visited</li>
              <li>Referring website</li>
              <li>Time spent on pages</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border rounded-lg p-6 bg-white shadow-sm mb-12">
          <h3 className="font-semibold mb-3">2) Payment Information</h3>
          <p>
            Payments are processed through third-party payment providers (such as Stripe or other
            secure payment processors). We do not store full payment card details on our servers.
          </p>
        </div>

        {/* How We Use */}
        <h2 className="text-2xl font-bold mb-6">How We Use Your Information</h2>

        <ul className="list-disc list-inside space-y-2 mb-12">
          <li>Create and manage your account</li>
          <li>Process and fulfill orders</li>
          <li>Provide member pricing and membership-related features</li>
          <li>Send order updates and service-related emails</li>
          <li>Respond to customer service requests</li>
          <li>Improve our website, products, and user experience</li>
          <li>Prevent fraud, abuse, or unauthorized activity</li>
          <li>Comply with legal obligations</li>
        </ul>

        {/* Cookies */}
        <div className="bg-[#F4F9FF] border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Cookies and Similar Technologies</h2>
          <p className="mb-3">
            We use cookies and similar technologies to support site functionality and improve your
            experience. For example, cookies may be used to:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Keep you logged in</li>
            <li>Remember your preferences</li>
            <li>Support shopping cart and checkout functionality</li>
            <li>Improve website performance and analytics</li>
          </ul>
          <p>
            You can manage cookies through your browser settings, but disabling cookies may affect
            certain website features.
          </p>
        </div>

        {/* Sharing */}
        <div className="border rounded-lg p-6 bg-white shadow-sm mb-12">
          <h2 className="text-xl font-semibold mb-4">How We Share Information</h2>

          <p className="font-semibold mb-3">We do not sell your personal information.</p>

          <p className="mb-3">
            We may share your information with trusted third parties only as needed to operate our
            business, including:
          </p>

          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Payment processors</li>
            <li>Shipping and fulfillment providers</li>
            <li>Email service providers</li>
            <li>Website hosting and analytics providers</li>
            <li>Customer support tools</li>
          </ul>

          <p>
            We may also share information if required by law or to protect our rights, users, or
            business operations.
          </p>
        </div>

        {/* Reviews */}
        <h2 className="text-2xl font-bold mb-4">Reviews and User Content</h2>
        <p className="mb-12">
          If you submit product reviews, ratings, or images, that content may be visible to other
          users on the website. Please avoid sharing sensitive personal information in public reviews
          or uploads.
        </p>

        {/* Data Security */}
        <h2 className="text-2xl font-bold mb-4">Data Security</h2>
        <p className="mb-12">
          We use reasonable administrative, technical, and organizational measures to protect your
          information. However, no method of transmission or storage is 100% secure, and we cannot
          guarantee absolute security.
        </p>

        {/* Data Retention */}
        <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
        <p className="mb-12">
          We retain personal information for as long as needed to:
          <br />
          Provide services
          <br />
          Complete transactions
          <br />
          Maintain business and legal records
          <br />
          Resolve disputes
          <br />
          Enforce agreements
        </p>

        {/* Your Choices */}
        <h2 className="text-2xl font-bold mb-4">Your Choices</h2>
        <p className="mb-12">
          You may:
          <br />
          Update certain account information by logging into your account
          <br />
          Contact us to request updates or corrections to your information
          <br />
          Unsubscribe from marketing emails (if applicable) using the unsubscribe link in those
          emails
          <br />
          Please note that we may still send service-related emails (such as order updates or account
          notices).
        </p>

        {/* Children */}
        <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
        <p className="mb-12">
          Our website is not intended for children under 13, and we do not knowingly collect personal
          information from children under 13.
        </p>

        {/* Third Party Links */}
        <h2 className="text-2xl font-bold mb-4">Third-Party Links</h2>
        <p className="mb-12">
          Our website may contain links to third-party websites or services. We are not responsible
          for the privacy practices of those third parties.
        </p>

        {/* US Service Area */}
        <h2 className="text-2xl font-bold mb-4">U.S. Shipping and Service Area</h2>
        <p className="mb-12">
          CosClub currently ships within the United States, including Puerto Rico. If you access the
          website from outside our service area, you do so at your own risk and are responsible for
          complying with local laws.
        </p>

        {/* Changes */}
        <h2 className="text-2xl font-bold mb-4">Changes to This Privacy Policy</h2>
        <p className="mb-12">
          We may update this Privacy Policy from time to time. When we do, we will update the "Last
          updated" date above. Continued use of the website after changes are posted means you accept
          the updated policy.
        </p>

        {/* Contact */}
        <div className="text-center bg-[#9DCBF3] text-white py-10 rounded-lg mb-12">
          <h2 className="text-xl font-semibold mb-4">Contact</h2>
          <p className="mb-6">
            If you have questions about this Privacy Policy, please contact us through our Contact
            page.
          </p>
          <a
            href="/contact"
            className="bg-white text-[#9DCBF3] px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition"
          >
            Contact Us with Questions
          </a>
        </div>
      </div>
      </main>
      <Footer />
    </>
  );
}
