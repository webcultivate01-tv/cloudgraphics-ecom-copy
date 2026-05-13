import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitInquiry } from "../features/inquiry/inquirySlice";
import { toast } from "react-toastify";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };
const SUBJECTS = ["Order / Delivery Issue","Custom Printing Query","Bulk Order Enquiry","Product Information","Payment / Refund","Other"];

export default function Contact() {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.inquiry);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    if (!form.subject) e.subject = "Please select a subject";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = await dispatch(submitInquiry(form));
    if (!result.error) {
      toast.success("Inquiry submitted! Check your email for confirmation.");
      setForm(EMPTY); setErrors({}); setSubmitted(true);
    } else { toast.error(result.payload || "Failed to submit. Please try again."); }
  };

  const inputCls = (err) => `w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none font-[inherit] transition-colors box-border ${err ? "border-red-600 bg-red-50" : "border-gray-200 bg-white focus:border-red-700"}`;

  if (submitted) return (
    <div className="bg-gray-50 min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Inquiry Sent!</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-7">Thank you for reaching out. We've received your inquiry and sent a confirmation to your email. Our team will get back to you within <strong>24–48 hours</strong>.</p>
        <button onClick={() => setSubmitted(false)} className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-xl font-bold text-sm border-none cursor-pointer transition-colors">Send Another Inquiry</button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-[80vh]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-red-700 to-red-900 text-white text-center px-6 py-14">
        <h1 className="text-3xl md:text-4xl font-black mb-3 -tracking-wide">Contact Us</h1>
        <p className="text-white/90 text-base max-w-lg mx-auto">Have a question or need help? Drop us a message and we'll get back to you shortly.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.8fr] gap-8 items-start">
          {/* Info Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <h2 className="text-lg font-black text-gray-900 mb-3">Get in Touch</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">We're here to help with any questions about our products, custom printing, bulk orders, or anything else.</p>
            {[
              { icon: "📍", label: "Address", value: "Cloud Graphics Amravati, Maharashtra, India" },
              { icon: "📞", label: "Phone", value: "+91 XXXXX XXXXX" },
              { icon: "📧", label: "Email", value: "cloudgraphics@example.com" },
              { icon: "🕐", label: "Hours", value: "Mon – Sat: 10 AM – 7 PM" },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3.5 mb-5">
                <span className="text-xl mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-gray-700 text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-100 mt-6 pt-5">
              <p className="text-gray-500 text-sm leading-relaxed">⚡ We typically respond within <strong>24–48 hours</strong> on business days.</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 md:p-9">
            <h2 className="text-lg font-black text-gray-900 mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">Full Name *</label>
                  <input type="text" name="name" placeholder="Your full name" value={form.name} onChange={handleChange} className={inputCls(errors.name)} />
                  {errors.name && <span className="text-red-600 text-xs font-semibold">{errors.name}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">Email Address *</label>
                  <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className={inputCls(errors.email)} />
                  {errors.email && <span className="text-red-600 text-xs font-semibold">{errors.email}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">Phone Number *</label>
                  <input type="tel" name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} className={inputCls(errors.phone)} />
                  {errors.phone && <span className="text-red-600 text-xs font-semibold">{errors.phone}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">Subject *</label>
                  <select name="subject" value={form.subject} onChange={handleChange} className={inputCls(errors.subject)}>
                    <option value="">— Select a subject —</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <span className="text-red-600 text-xs font-semibold">{errors.subject}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600">Message *</label>
                <textarea name="message" rows={5} placeholder="Describe your inquiry in detail..." value={form.message} onChange={handleChange} className={`${inputCls(errors.message)} resize-y min-h-28`} />
                {errors.message && <span className="text-red-600 text-xs font-semibold">{errors.message}</span>}
                <span className="text-gray-300 text-xs text-right">{form.message.length} characters</span>
              </div>
              <button type="submit" disabled={loading}
                className={`px-7 py-3.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer transition-colors ${loading ? "bg-red-300 cursor-not-allowed" : "bg-red-700 hover:bg-red-800"}`}>
                {loading ? "Sending…" : "Send Inquiry ✉️"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
