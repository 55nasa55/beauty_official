'use client';

import { useState } from 'react';
import { Megaphone, Send, CircleCheck as CheckCircle } from 'lucide-react';

export function SuggestionForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    brand: '',
    product: '',
    category: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.email || 'Anonymous Member',
          email: form.email || 'noreply@cosclub.com',
          subject: 'Product Suggestion',
          message: `Brand: ${form.brand}\nProduct: ${form.product}\nCategory: ${form.category}`,
        }),
      });
      setSubmitted(true);
      setForm({ brand: '', product: '', category: '', email: '' });
    } catch {
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-[780px] mx-auto">
      <div className="text-center mb-12">
        <Megaphone className="w-8 h-8 mx-auto mb-4 text-coral" />
        <h2 className="text-section-h2 mb-3">What should we carry next?</h2>
        <p className="text-[17px] text-gray leading-[1.6]">
          We don&apos;t decide what goes on our shelves — you do. CosClub exists to serve our members,
          and every product we carry is here because someone like you asked for it. Tell us what you
          want and we&apos;ll make it happen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="brand-name" className="text-form-label">Brand Name</label>
            <input
              type="text"
              id="brand-name"
              placeholder="e.g. Laneige, Sulwhasoo, Shiseido"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="cosclub-input"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="product-name" className="text-form-label">Product (optional)</label>
            <input
              type="text"
              id="product-name"
              placeholder="e.g. Water Sleeping Mask"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              className="cosclub-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className="text-form-label">Category</label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="cosclub-input"
              required
            >
              <option value="" disabled>Select a category</option>
              <option>Skincare</option>
              <option>Makeup</option>
              <option>Haircare</option>
              <option>Face Masks</option>
              <option>Bath &amp; Body</option>
              <option>Tools &amp; Brushes</option>
              <option>Sunscreen</option>
              <option>Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-form-label">Your Email (optional)</label>
            <input
              type="email"
              id="email"
              placeholder="We'll notify you if we add it!"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="cosclub-input"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-solid self-start"
          style={{ padding: '14px 32px', fontSize: 16 }}
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Suggestion
        </button>
      </form>

      {submitted && (
        <div className="flex items-center gap-3 mt-4 text-[16px] font-semibold text-charcoal">
          <CheckCircle className="w-6 h-6 text-coral" />
          <span>Thanks! We&apos;ll take a look.</span>
        </div>
      )}
    </div>
  );
}
