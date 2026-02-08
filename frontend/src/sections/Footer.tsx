import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail, CreditCard, Truck, Shield } from 'lucide-react';

const footerLinks = {
  shop: [
    { label: 'Dresses', href: '#products' },
    { label: 'Jewelry', href: '#products' },
    { label: 'Beauty Electronics', href: '#products' },
    { label: 'New Arrivals', href: '#products' },
    { label: 'Sale', href: '#products' },
  ],
  help: [
    { label: 'Track Order', href: '#' },
    { label: 'Returns & Exchanges', href: '#' },
    { label: 'Shipping Info', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'Contact Us', href: '#' },
  ],
  company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Sustainability', href: '#' },
    { label: 'Affiliates', href: '#' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/evara_ind/', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

const paymentMethods = [
  { icon: CreditCard, label: 'Credit Card' },
  { icon: Truck, label: 'Cash on Delivery' },
  { icon: Shield, label: 'Secure Payment' },
];

export default function Footer() {
  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="section-padding py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-3xl font-bold mb-4">Evara</h2>
              <p className="text-gray-400 mb-6 max-w-sm">
                Your destination for premium fashion, exquisite jewelry, and innovative beauty electronics. Elevating style for the modern Indian woman.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-5 h-5 text-coral-400" />
                  <span className="text-sm">123 Fashion Street, Mumbai, India</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5 text-coral-400" />
                  <span className="text-sm">+91 1800 123 4567</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5 text-coral-400" />
                  <span className="text-sm">support@evara.com</span>
                </div>
              </div>
            </div>

            {/* Shop Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Shop</h3>
              <ul className="space-y-3">
                {footerLinks.shop.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-400 hover:text-coral-400 transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Help</h3>
              <ul className="space-y-3">
                {footerLinks.help.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-400 hover:text-coral-400 transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-400 hover:text-coral-400 transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="section-padding py-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-gray-500 text-sm text-center md:text-left">
              © 2026 Evara. All rights reserved. Designed with love in India.
            </p>

            {/* Social Links */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="text-sm text-gray-400">Follow us on Instagram</p>
              <a
                href="https://www.instagram.com/evara_ind/"
                target="_blank"
                rel="noreferrer"
                className="text-coral-300 text-sm hover:text-white transition-colors"
              >
                @evara_ind
              </a>
              <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-coral-400 transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.label}
                  className="flex items-center gap-2 text-gray-500 text-sm"
                >
                  <method.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{method.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
