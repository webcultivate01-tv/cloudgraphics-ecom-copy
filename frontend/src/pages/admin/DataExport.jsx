import { useState } from "react";
import { toast } from "react-toastify";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DATE_RANGES = [
  { label: "All Time",     value: "" },
  { label: "Today",        value: "today" },
  { label: "Last 7 Days",  value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "Custom",       value: "custom" },
];

const ORDER_STATUSES = ["all", "Pending", "Processing", "Printing", "Shipped", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  all: "bg-slate-100 text-slate-600 border-slate-200",
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
  Printing: "bg-purple-50 text-purple-700 border-purple-200",
  Shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

const EXPORT_TYPES = [
  {
    key: "orders",
    label: "Orders",
    desc: "Order records, payments & tracking",
    gradient: "from-blue-500 to-indigo-600",
    ring: "ring-blue-400",
    activeBg: "bg-blue-50",
    activeBorder: "border-blue-400",
    activeText: "text-blue-700",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    key: "users",
    label: "Users",
    desc: "Customer accounts & contact info",
    gradient: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-400",
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-400",
    activeText: "text-emerald-700",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: "products",
    label: "Products",
    desc: "Catalogue, pricing & stock levels",
    gradient: "from-amber-500 to-orange-500",
    ring: "ring-amber-400",
    activeBg: "bg-amber-50",
    activeBorder: "border-amber-400",
    activeText: "text-amber-700",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
];

function SectionLabel({ step, label, sub }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
        {step}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800 leading-tight">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DataExport() {
  const [exportType, setExportType]   = useState("orders");
  const [format, setFormat]           = useState("excel");
  const [dateRange, setDateRange]     = useState("");
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [loading, setLoading]         = useState(false);
  const [lastExport, setLastExport]   = useState(null);

  const activeType = EXPORT_TYPES.find((t) => t.key === exportType);

  const handleExport = async () => {
    if (dateRange === "custom" && (!fromDate || !toDate)) {
      toast.error("Please select both From and To dates"); return;
    }
    if (dateRange === "custom" && new Date(fromDate) > new Date(toDate)) {
      toast.error("From date cannot be after To date"); return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ format });
      if (dateRange) params.set("range", dateRange);
      if (dateRange === "custom") { params.set("from", fromDate); params.set("to", toDate); }
      if (exportType === "orders" && orderStatus !== "all") params.set("status", orderStatus);

      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE}/export/${exportType}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Export failed"); }

      const blob = await res.blob();
      const ext  = format === "excel" ? "xlsx" : "pdf";
      const filename = `${exportType}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), { href: url, download: filename }).click();
      URL.revokeObjectURL(url);

      setLastExport({ filename, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) });
      toast.success(`${filename} downloaded!`);
    } catch (err) {
      toast.error(err.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const dateLabel =
    dateRange === "" ? "All Time"
    : dateRange === "custom" ? (fromDate && toDate ? `${fromDate} → ${toDate}` : "Custom (incomplete)")
    : DATE_RANGES.find((r) => r.value === dateRange)?.label;

  return (
    <div className="animate-fade-in-up">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
        <div>
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Admin Tools</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Data Export</h1>
          <p className="text-slate-400 text-sm mt-1">Filter and download your data as Excel or PDF</p>
        </div>
        {lastExport && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2 rounded-xl text-xs font-medium shrink-0">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <span><strong>{lastExport.filename}</strong> at {lastExport.time}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

        {/* ── Left Column ────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Step 1 — Data Type */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionLabel step="1" label="What do you want to export?" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {EXPORT_TYPES.map((t) => {
                const active = exportType === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setExportType(t.key)}
                    className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer group
                      ${active ? `${t.activeBorder} ${t.activeBg}` : "border-slate-100 hover:border-slate-200 bg-slate-50/60"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white shadow-sm`}>
                      {t.icon}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${active ? t.activeText : "text-slate-700"}`}>{t.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{t.desc}</p>
                    </div>
                    {active && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Format */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionLabel step="2" label="Choose file format" />
            <div className="grid grid-cols-2 gap-3">

              {/* Excel */}
              <button
                onClick={() => setFormat("excel")}
                className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${format === "excel" ? "border-emerald-400 bg-emerald-50" : "border-slate-100 bg-slate-50/60 hover:border-slate-200"}`}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <p className={`font-bold text-sm ${format === "excel" ? "text-emerald-700" : "text-slate-700"}`}>Excel</p>
                  <p className="text-slate-400 text-xs truncate">.xlsx — sortable & filterable</p>
                </div>
                {format === "excel" && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
                  </span>
                )}
              </button>

              {/* PDF */}
              <button
                onClick={() => setFormat("pdf")}
                className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${format === "pdf" ? "border-red-400 bg-red-50" : "border-slate-100 bg-slate-50/60 hover:border-slate-200"}`}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm shrink-0">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <p className={`font-bold text-sm ${format === "pdf" ? "text-red-700" : "text-slate-700"}`}>PDF</p>
                  <p className="text-slate-400 text-xs truncate">.pdf — print-ready A4</p>
                </div>
                {format === "pdf" && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Step 3 — Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionLabel step="3" label="Apply filters" sub="Optional — leave blank to export all data" />

            {/* Date Range */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Date Range</p>
              <div className="flex flex-wrap gap-2">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setDateRange(r.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                      ${dateRange === r.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">From</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">To</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="admin-input" />
                  </div>
                </div>
              )}
            </div>

            {/* Order Status */}
            {exportType === "orders" && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Order Status</p>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer capitalize
                        ${orderStatus === s
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : `${STATUS_COLORS[s]} hover:opacity-80`}`}
                    >
                      {s === "all" ? "All Statuses" : s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column — Sticky Panel ─────────────────── */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">

          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Card top accent */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${activeType.gradient}`} />
            <div className="p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Export Preview</p>

              {/* Active type pill */}
              <div className={`flex items-center gap-3 p-3 rounded-xl ${activeType.activeBg} border ${activeType.activeBorder} mb-4`}>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${activeType.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                  {activeType.icon}
                </div>
                <div>
                  <p className={`font-bold text-sm ${activeType.activeText}`}>{activeType.label}</p>
                  <p className="text-slate-400 text-xs">{activeType.desc}</p>
                </div>
              </div>

              {/* Details rows */}
              <div className="space-y-0 divide-y divide-slate-50">
                {[
                  {
                    label: "Format",
                    value: format === "excel"
                      ? <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold">Excel .xlsx</span>
                      : <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">PDF</span>,
                  },
                  { label: "Date Range", value: <span className="text-xs font-semibold text-slate-700">{dateLabel}</span> },
                  ...(exportType === "orders" ? [{ label: "Status", value: <span className="text-xs font-semibold text-slate-700 capitalize">{orderStatus === "all" ? "All" : orderStatus}</span> }] : []),
                  { label: "Includes", value: <span className="text-xs font-semibold text-slate-700">Summary + Table</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-slate-400">{label}</span>
                    {value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm
              ${loading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-md hover:-translate-y-0.5 active:scale-95"}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download {activeType.label}
              </>
            )}
          </button>

          {/* What's included */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-600 mb-2.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              What's included
            </p>
            <ul className="space-y-1.5">
              {[
                "Summary section with totals",
                "Full data table with all fields",
                "Filtered by your criteria",
                "Branded Cloud Graphics header",
                format === "excel" ? "Two sheets: Summary + Data" : "Print-ready A4 layout",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                  <svg className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 border border-amber-100 rounded-xl">
            <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p className="text-xs text-amber-600 leading-relaxed">Admin-only export. Contains sensitive data — do not share publicly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
