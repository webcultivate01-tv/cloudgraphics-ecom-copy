import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SLIDES = [
  { bg: "from-red-700 to-red-400", tag: "New Collection", title: "Custom Printed\nGifts & Merchandise", sub: "Personalized Cups, T-Shirts, Diaries & More", cta: "Shop Now", link: "/products", accent: "text-white border-white" },
  { bg: "from-[#1a1a2e] to-red-700", tag: "Best Sellers", title: "Photo Print\nOn Everything", sub: "Upload your photo — we'll print it on any product", cta: "Explore Products", link: "/products?category=Cup", accent: "text-yellow-300 border-yellow-300" },
  { bg: "from-[#2d1b69] to-red-700", tag: "Corporate Gifts", title: "Bulk Orders\nFor Businesses", sub: "ID Cards, Pens, Diaries with your company branding", cta: "View Corporate", link: "/products?category=ID+Card", accent: "text-white border-white" },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const t = setInterval(() => go((current + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [current]);

  const go = (idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 200);
  };

  const slide = SLIDES[current];

  return (
    <div className={`relative bg-gradient-to-br ${slide.bg} min-h-[280px] md:min-h-[460px] flex items-center overflow-hidden px-6 md:px-20 py-12 md:py-16 transition-opacity duration-300 ${animating ? "opacity-70" : "opacity-100"}`}>
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-16 -right-16" />
        <div className="absolute w-44 h-44 rounded-full bg-white/10 bottom-5 right-28" />
        <div className="absolute w-20 h-20 rounded-full bg-white/20 top-10 right-48" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-xl">
        <span className={`text-xs font-bold tracking-[3px] uppercase ${slide.accent}`}>{slide.tag}</span>
        <h1 className="text-white text-3xl md:text-5xl font-black leading-tight my-3 md:my-4 -tracking-wide">
          {slide.title.split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
        </h1>
        <p className="text-white/85 text-sm md:text-base mb-6 md:mb-8 leading-relaxed">{slide.sub}</p>
        <Link to={slide.link} className={`inline-block border-2 px-6 md:px-8 py-3 rounded font-bold text-sm tracking-wide bg-white/15 hover:bg-white/25 transition-all duration-200 ${slide.accent}`}>
          {slide.cta} →
        </Link>
      </div>

      {/* Arrows */}
      <button className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/35 text-white border-none w-10 h-10 rounded-full flex items-center justify-center text-2xl z-20 transition-colors" onClick={() => go((current - 1 + SLIDES.length) % SLIDES.length)}>‹</button>
      <button className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/35 text-white border-none w-10 h-10 rounded-full flex items-center justify-center text-2xl z-20 transition-colors" onClick={() => go((current + 1) % SLIDES.length)}>›</button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)} className={`h-2 rounded-full border-none cursor-pointer transition-all duration-300 ${i === current ? "w-6 bg-white" : "w-2 bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}
