'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Mail, Clock, Send, CheckCircle, Instagram, Twitter, Music2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Category, Brand, Collection } from '@/lib/database.types';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    topic: '',
    orderNumber: '',
    message: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    async function fetchHeaderData() {
      const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase
          .from('collections')
          .select('*')
          .eq('display_on_home', true)
          .order('sort_order'),
      ]);

      setCategories(categoriesResult.data || []);
      setBrands(brandsResult.data || []);
      setCollections(collectionsResult.data || []);
    }

    fetchHeaderData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const fullName = `${formData.firstName.trim()}${formData.lastName.trim() ? ' ' + formData.lastName.trim() : ''}`;
      const subject = formData.topic || '';
      let message = formData.message.trim();
      if (formData.orderNumber.trim()) {
        message = `[Order: ${formData.orderNumber.trim()}] ${message}`;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email: formData.email,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        topic: '',
        orderNumber: '',
        message: '',
      });

      toast({
        title: 'Message sent!',
        description: data.message || "We'll get back to you soon.",
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid var(--light-gray)',
    borderRadius: '8px',
    fontFamily: 'var(--font-manrope), var(--body-font)',
    fontSize: '14px',
    color: 'var(--charcoal)',
    background: 'white',
    transition: 'border-color 0.2s',
    outline: 'none',
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--soft-rose)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--light-gray)';
    },
  };

  return (
    <>
      <Header categories={categories} brands={brands} collections={collections} />

      {/* Page Hero */}
      <div
        className="page-hero text-center"
        style={{ background: 'var(--blush-pink)', padding: '64px 5%' }}
      >
        <h1
          className="font-heading"
          style={{ fontSize: '42px', fontWeight: 700, marginBottom: '12px' }}
        >
          Contact Us
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--charcoal)',
            opacity: 0.75,
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          We&apos;re here to help. Reach out and we&apos;ll get back to you within 24 hours.
        </p>
      </div>

      {/* Body layout */}
      <div
        className="contact-body grid grid-cols-1 md:grid-cols-[1fr_1.4fr]"
        style={{ gap: '64px', maxWidth: '1100px', margin: '0 auto', padding: '72px 5% 80px' }}
      >
        {/* Left: Info */}
        <div className="contact-info">
          <h2
            className="font-heading"
            style={{ fontSize: '26px', fontWeight: 700, marginBottom: '8px' }}
          >
            Get in touch
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.8, marginBottom: '36px' }}>
            Whether you have a question about your order, membership, or just want to say hi —
            we&apos;d love to hear from you.
          </p>

          <div className="contact-method flex items-start" style={{ gap: '16px', marginBottom: '28px' }}>
            <div
              className="contact-method-icon flex items-center justify-center"
              style={{
                width: '44px',
                height: '44px',
                background: 'var(--blush-pink)',
                borderRadius: '10px',
                flexShrink: 0,
              }}
            >
              <Mail size={20} style={{ color: 'var(--charcoal)' }} />
            </div>
            <div className="contact-method-text">
              <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Email</h4>
              <a
                href="mailto:support@cosclub.com"
                style={{ fontSize: '13px', color: 'var(--coral)', fontWeight: 600 }}
              >
                support@cosclub.com
              </a>
              <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6 }}>
                We respond within 24 hours on business days.
              </p>
            </div>
          </div>

          <div className="contact-method flex items-start" style={{ gap: '16px', marginBottom: '28px' }}>
            <div
              className="contact-method-icon flex items-center justify-center"
              style={{
                width: '44px',
                height: '44px',
                background: 'var(--blush-pink)',
                borderRadius: '10px',
                flexShrink: 0,
              }}
            >
              <Clock size={20} style={{ color: 'var(--charcoal)' }} />
            </div>
            <div className="contact-method-text">
              <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Support Hours</h4>
              <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6 }}>
                Monday – Friday, 9am – 6pm EST
              </p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '32px 0' }} />

          <div className="social-row">
            <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>Follow us</h4>
            <div className="social-links flex" style={{ gap: '12px' }}>
              <div
                className="social-link flex items-center justify-center"
                title="Instagram"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--light-gray)',
                  color: 'var(--charcoal)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Instagram size={18} />
              </div>
              <div
                className="social-link flex items-center justify-center"
                title="TikTok"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--light-gray)',
                  color: 'var(--charcoal)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Music2 size={18} />
              </div>
              <div
                className="social-link flex items-center justify-center"
                title="Twitter / X"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--light-gray)',
                  color: 'var(--charcoal)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Twitter size={18} />
              </div>
            </div>
          </div>

          <div
            className="faq-nudge"
            style={{ background: '#f0f7ff', borderRadius: '12px', padding: '20px', marginTop: '32px' }}
          >
            <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.7 }}>
              Looking for quick answers? Check out our{' '}
              <Link href="/faq" style={{ color: 'var(--coral)', fontWeight: 700 }}>
                FAQ page
              </Link>{' '}
              — we cover membership, shipping, returns, and more.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div
          className="contact-form-wrap"
          style={{
            background: 'white',
            border: '1px solid var(--light-gray)',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <h2
            className="font-heading"
            style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}
          >
            Send us a message
          </h2>

          {success ? (
            <div className="form-success text-center" style={{ padding: '40px 20px' }}>
              <CheckCircle size={40} style={{ color: 'var(--coral)', marginBottom: '16px' }} />
              <h3 className="font-heading" style={{ fontSize: '22px', marginBottom: '8px' }}>
                Message received!
              </h3>
              <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
                Thanks for reaching out. We&apos;ll get back to you at your email within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* First Name + Last Name row */}
              <div
                className="form-row grid grid-cols-1 sm:grid-cols-2"
                style={{ gap: '16px', marginBottom: '16px' }}
              >
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="firstName"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jane"
                    required
                    disabled={loading}
                    style={inputStyle}
                    {...focusHandlers}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="lastName"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Kim"
                    disabled={loading}
                    style={inputStyle}
                    {...focusHandlers}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  required
                  disabled={loading}
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>

              {/* Topic */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="topic"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
                >
                  Topic
                </label>
                <select
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  disabled={loading}
                  style={inputStyle}
                  {...focusHandlers}
                >
                  <option value="">Select a topic...</option>
                  <option value="Order Issue">Order Issue</option>
                  <option value="Return Request">Return Request</option>
                  <option value="Membership Question">Membership Question</option>
                  <option value="Product Question">Product Question</option>
                  <option value="Shipping Question">Shipping Question</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Order Number */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="orderNumber"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
                >
                  Order Number (optional)
                </label>
                <input
                  id="orderNumber"
                  name="orderNumber"
                  type="text"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  placeholder="CC-00001"
                  disabled={loading}
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>

              {/* Message */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="message"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind..."
                  required
                  disabled={loading}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                  {...focusHandlers}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-submit flex items-center justify-center"
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'var(--charcoal)',
                  color: 'white',
                  fontFamily: 'var(--font-manrope), var(--body-font)',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  gap: '8px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <>
                    <span
                      className="inline-block border-2 border-white border-t-transparent rounded-full animate-spin"
                      style={{ width: '16px', height: '16px' }}
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
              <p style={{ fontSize: '12px', color: 'var(--gray)', textAlign: 'center', marginTop: '12px' }}>
                We typically respond within 1 business day.
              </p>
            </form>
          )}
        </div>
      </div>

      <Footer />
      <Toaster />
    </>
  );
}
