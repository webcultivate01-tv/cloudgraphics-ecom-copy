import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllInquiries,
  deleteInquiry,
  respondToInquiry,
} from "../../features/inquiry/inquirySlice";
import { toast } from "react-toastify";

const STATUS_CFG = {
  pending:    { cls: "bg-amber-100 text-amber-700",   label: "Pending" },
  responded:  { cls: "bg-emerald-100 text-emerald-700", label: "Responded" },
};

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function ManageInquiries() {
  const dispatch = useDispatch();
  const { inquiries, loading } = useSelector((s) => s.inquiry);

  const [detailInq,   setDetailInq]   = useState(null);   // view modal
  const [respondInq,  setRespondInq]  = useState(null);   // respond modal
  const [responseText, setResponseText] = useState("");
  const [responding,   setResponding]  = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search,        setSearch]      = useState("");

  useEffect(() => { dispatch(fetchAllInquiries()); }, [dispatch]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete inquiry from "${name}"? This cannot be undone.`)) return;
    const result = await dispatch(deleteInquiry(id));
    if (!result.error) toast.success("Inquiry deleted");
    else toast.error(result.payload);
    if (detailInq?._id === id) setDetailInq(null);
  };

  const openRespond = (inq) => {
    setRespondInq(inq);
    setResponseText(inq.adminResponse || "");
  };

  const handleRespond = async () => {
    if (!responseText.trim()) { toast.error("Response cannot be empty"); return; }
    setResponding(true);
    const result = await dispatch(respondToInquiry({ id: respondInq._id, adminResponse: responseText }));
    setResponding(false);
    if (!result.error) {
      toast.success("Response sent to user via email!");
      setRespondInq(null);
      setResponseText("");
      if (detailInq?._id === respondInq._id) {
        setDetailInq({ ...detailInq, status: "responded", adminResponse: responseText });
      }
    } else {
      toast.error(result.payload);
    }
  };

  // filtering
  const visible = inquiries.filter((inq) => {
    const matchStatus = filterStatus === "all" || inq.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      inq.name.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      inq.subject.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount = inquiries.filter((i) => i.status === "pending").length;

  return (
    <div className="animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Enquiries
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px]">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {inquiries.length} total · {pendingCount} pending
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="admin-input !py-1.5 !text-sm w-44"
            placeholder="Search name / email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="admin-input !py-1.5 !text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="responded">Responded</option>
          </select>
          <button
            className="admin-btn admin-btn-ghost !py-1.5 !text-sm"
            onClick={() => dispatch(fetchAllInquiries())}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="admin-card p-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500 font-medium">
            {inquiries.length === 0 ? "No inquiries yet." : "No results match your filter."}
          </p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {["Name", "Email", "Phone", "Subject", "Status", "Date", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((inq) => {
                  const cfg = STATUS_CFG[inq.status] || STATUS_CFG.pending;
                  return (
                    <tr key={inq._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{inq.name}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{inq.email}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{inq.phone}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate" title={inq.subject}>
                        {inq.subject}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{fmt(inq.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDetailInq(inq)}
                            className="admin-btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 !py-1 !px-2.5 !text-xs whitespace-nowrap"
                          >
                            👁 View
                          </button>
                          <button
                            onClick={() => openRespond(inq)}
                            className="admin-btn bg-emerald-50 hover:bg-emerald-100 text-emerald-700 !py-1 !px-2.5 !text-xs whitespace-nowrap"
                          >
                            ✉️ Reply
                          </button>
                          <button
                            onClick={() => handleDelete(inq._id, inq.name)}
                            className="admin-btn bg-red-50 hover:bg-red-100 text-red-600 !py-1 !px-2.5 !text-xs"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── View Detail Modal ───────────────────────────────── */}
      {detailInq && (
        <Modal onClose={() => setDetailInq(null)} title="Inquiry Details">
          <div className="space-y-4">
            <InfoRow label="Name"    value={detailInq.name} />
            <InfoRow label="Email"   value={detailInq.email} />
            <InfoRow label="Phone"   value={detailInq.phone} />
            <InfoRow label="Subject" value={detailInq.subject} />
            <InfoRow label="Date"    value={fmt(detailInq.createdAt)} />
            <InfoRow
              label="Status"
              value={
                <span className={`status-badge ${(STATUS_CFG[detailInq.status] || STATUS_CFG.pending).cls}`}>
                  {(STATUS_CFG[detailInq.status] || STATUS_CFG.pending).label}
                </span>
              }
            />

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Message</p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {detailInq.message}
              </div>
            </div>

            {detailInq.adminResponse && (
              <div>
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Admin Response Sent</p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {detailInq.adminResponse}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => { setDetailInq(null); openRespond(detailInq); }}
                className="admin-btn admin-btn-primary flex-1"
              >
                ✉️ Reply to User
              </button>
              <button
                onClick={() => handleDelete(detailInq._id, detailInq.name)}
                className="admin-btn bg-red-50 hover:bg-red-100 text-red-600"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Respond Modal ───────────────────────────────────── */}
      {respondInq && (
        <Modal onClose={() => { setRespondInq(null); setResponseText(""); }} title="Reply to Inquiry">
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="font-semibold text-slate-500">To:</span> {respondInq.name} ({respondInq.email})</p>
              <p><span className="font-semibold text-slate-500">Re:</span> {respondInq.subject}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Their Message</p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                {respondInq.message}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Your Response *
              </label>
              <textarea
                rows={6}
                className="admin-input resize-y"
                placeholder="Write your reply here… It will be sent to the user via email."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                This response will be emailed to <strong>{respondInq.email}</strong> and the inquiry status will change to "Responded".
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleRespond}
                disabled={responding}
                className="admin-btn admin-btn-primary flex-1 disabled:opacity-60"
              >
                {responding ? "Sending…" : "✉️ Send Response"}
              </button>
              <button
                onClick={() => { setRespondInq(null); setResponseText(""); }}
                className="admin-btn admin-btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function Modal({ children, title, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-slate-700 text-sm">{value}</span>
    </div>
  );
}
