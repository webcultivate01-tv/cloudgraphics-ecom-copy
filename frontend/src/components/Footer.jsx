import { Link } from "react-router-dom";

const CATEGORIES = ["Cup", "T-Shirt", "Diary", "Pen", "ID Card", "Frame", "Keychain"];

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 md:px-12 py-12">
        {/* Brand */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-3xl">🖨️</span>
            <div>
              <p className="text-white font-black text-base tracking-widest m-0">CLOUD GRAPHICS</p>
              <p className="text-red-600 text-[9px] tracking-[4px] m-0">AMRAVATI</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Premium custom gift printing in Amravati. Personalize cups, t-shirts, diaries, and more with your photos and designs.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mt-2">
            📍 Amravati, Maharashtra<br />
            📞 +91 00000 00000<br />
            ✉️ info@cloudgraphics.in
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-1.5">
          <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-2">Quick Links</h4>
          {[["Home", "/"], ["Products", "/products"], ["My Orders", "/orders"], ["Cart", "/cart"], ["Login", "/login"]].map(([label, to]) => (
            <Link key={to} to={to} className="text-gray-500 text-sm hover:text-white transition-colors leading-relaxed">{label}</Link>
          ))}
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-1.5">
          <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-2">Categories</h4>
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/products?category=${cat}`} className="text-gray-500 text-sm hover:text-white transition-colors leading-relaxed">{cat}</Link>
          ))}
        </div>

        {/* Information */}
        <div className="flex flex-col gap-1.5">
          <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-2">Information</h4>
          {["About Us", "Privacy Policy", "Terms & Conditions", "Shipping Policy", "Return Policy"].map((item) => (
            <span key={item} className="text-gray-500 text-sm leading-relaxed cursor-default">{item}</span>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 max-w-7xl mx-auto px-6 md:px-12 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Cloud Graphics Amravati. All rights reserved.</p>
        <div className="flex gap-3">
          {["💳 UPI", "🏦 Net Banking", "💵 COD"].map((m) => (
            <span key={m} className="bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded">{m}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
