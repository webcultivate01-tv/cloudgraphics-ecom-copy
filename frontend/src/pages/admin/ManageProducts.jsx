import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../features/products/productSlice";
import { fetchCategoriesAdmin } from "../../features/categories/categorySlice";
import { toast } from "react-toastify";

const TYPE_OPTIONS = [
  { value: "direct",   icon: "🛍️", name: "Direct Sale",    desc: "Customer buys as-is, no custom image." },
  { value: "optional", icon: "🎨", name: "Custom Optional", desc: "Customer can upload a design — not required." },
  { value: "required", icon: "🖼️", name: "Custom Required", desc: "Order blocked until design is uploaded." },
];

const typeBadge = (p) => {
  if (p.requiresCustomImage) return { label: "Custom Required", cls: "bg-violet-100 text-violet-700" };
  if (p.allowCustomImage)    return { label: "Custom Optional",  cls: "bg-indigo-100 text-indigo-700" };
  return { label: "Direct Sale", cls: "bg-emerald-100 text-emerald-700" };
};

export default function ManageProducts() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((state) => state.products);
  const { items: categoryItems }     = useSelector((state) => state.categories);
  const CATEGORIES = categoryItems.map((c) => c.name);

  const EMPTY_FORM = {
    name: "", description: "", price: "", originalPrice: "", brand: "", sku: "",
    category: CATEGORIES[0] || "", stock: "100",
    allowCustomImage: false, requiresCustomImage: false, isAvailable: true,
    weight: "", returnPolicy: "",
  };

  const [showForm, setShowForm]             = useState(false);
  const [editId, setEditId]                 = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles]         = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Highlights (bullet points)
  const [highlights, setHighlights]   = useState([]);
  const [hlInput, setHlInput]         = useState("");

  // Specifications (key-value pairs)
  const [specifications, setSpecifications] = useState([]);
  const [specKey, setSpecKey]               = useState("");
  const [specVal, setSpecVal]               = useState("");

  useEffect(() => {
    dispatch(fetchAllProductsAdmin());
    dispatch(fetchCategoriesAdmin());
  }, [dispatch]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFiles([]); setExistingImages([]); setEditId(null); setShowForm(false);
    setHighlights([]); setHlInput("");
    setSpecifications([]); setSpecKey(""); setSpecVal("");
  };

  const handleEdit = (p) => {
    setEditId(p._id);
    setForm({
      name: p.name, description: p.description, price: p.price,
      originalPrice: p.originalPrice || "", brand: p.brand || "", sku: p.sku || "",
      category: p.category, stock: p.stock,
      allowCustomImage: p.allowCustomImage,
      requiresCustomImage: p.requiresCustomImage || false, isAvailable: p.isAvailable,
      weight: p.weight || "", returnPolicy: p.returnPolicy || "",
    });
    setExistingImages(p.images?.length ? p.images : p.image ? [p.image] : []);
    setHighlights(p.highlights || []);
    setSpecifications(p.specifications || []);
    setImageFiles([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const result = await dispatch(deleteProduct(id));
    if (!result.error) toast.success("Product deleted");
    else toast.error("Delete failed");
  };

  const setProductType = (type) => {
    if (type === "direct")   setForm((f) => ({ ...f, allowCustomImage: false, requiresCustomImage: false }));
    if (type === "optional") setForm((f) => ({ ...f, allowCustomImage: true,  requiresCustomImage: false }));
    if (type === "required") setForm((f) => ({ ...f, allowCustomImage: true,  requiresCustomImage: true  }));
  };

  const productType = form.requiresCustomImage ? "required" : form.allowCustomImage ? "optional" : "direct";

  const addHighlight = () => {
    if (!hlInput.trim()) return;
    setHighlights((h) => [...h, hlInput.trim()]);
    setHlInput("");
  };

  const addSpec = () => {
    if (!specKey.trim() || !specVal.trim()) return;
    setSpecifications((s) => [...s, { key: specKey.trim(), value: specVal.trim() }]);
    setSpecKey(""); setSpecVal("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("highlights", JSON.stringify(highlights));
    fd.append("specifications", JSON.stringify(specifications));
    imageFiles.forEach((f) => fd.append("images", f));
    const result = editId
      ? await dispatch(updateProduct({ id: editId, formData: fd }))
      : await dispatch(createProduct(fd));
    if (!result.error) { toast.success(editId ? "Product updated!" : "Product created!"); resetForm(); }
    else toast.error(result.payload || "Operation failed");
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manage Products</h1>
          <p className="text-slate-400 text-sm mt-0.5">{products.length} products total</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm((v) => !v); }}
          className={`admin-btn ${showForm ? "admin-btn-ghost" : "admin-btn-primary"}`}
        >
          {showForm ? "✕ Cancel" : "+ Add Product"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="admin-card p-6 mb-6 animate-fade-in-up">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="text-xl">{editId ? "✏️" : "➕"}</span>
            {editId ? "Edit Product" : "Add New Product"}
          </h2>

          {/* Product Type */}
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Product Type</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TYPE_OPTIONS.map(({ value, icon, name, desc }) => {
                const active = productType === value;
                return (
                  <label
                    key={value}
                    className={`flex flex-col gap-1.5 p-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                      active
                        ? value === "required"
                          ? "border-red-400 bg-red-50 shadow-sm"
                          : "border-indigo-400 bg-indigo-50 shadow-sm"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    <input type="radio" name="productType" checked={active} onChange={() => setProductType(value)} className="hidden" />
                    <span className="text-2xl">{icon}</span>
                    <span className={`font-bold text-sm ${active ? (value === "required" ? "text-red-800" : "text-indigo-800") : "text-slate-700"}`}>{name}</span>
                    <span className="text-xs text-slate-400 leading-snug">{desc}</span>
                  </label>
                );
              })}
            </div>
            {productType === "required" && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                <span>⚠️</span>
                <span>Customers must upload their design image during checkout. Order will be blocked until they do.</span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Basic Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <input className="admin-input" placeholder="Product Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="admin-input" placeholder="Brand (e.g. Nike)" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <input className="admin-input" placeholder="SKU / Model No." value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <select className="admin-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <textarea
            className="admin-input h-20 resize-y mb-3"
            placeholder="Description *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          {/* Pricing & Stock */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2">Pricing & Stock</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
            <input className="admin-input" placeholder="Selling Price ₹ *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input className="admin-input" placeholder="Original Price ₹ (for discount)" type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} />
            <input className="admin-input" placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <input className="admin-input" placeholder="Weight (e.g. 500g)" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
            <div className="mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              🏷️ Discount: {Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)}% off — customers will see ₹{Number(form.originalPrice).toLocaleString()} struck out
            </div>
          )}

          {/* Highlights */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Key Highlights (bullet points)</p>
          <div className="flex gap-2 mb-2">
            <input
              className="admin-input flex-1"
              placeholder="e.g. Premium quality printing"
              value={hlInput}
              onChange={(e) => setHlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }}
            />
            <button type="button" onClick={addHighlight} className="admin-btn admin-btn-primary !py-1.5 !px-4 !text-sm flex-shrink-0">+ Add</button>
          </div>
          {highlights.length > 0 && (
            <ul className="mb-3 space-y-1">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 text-sm text-slate-700">
                  <span className="text-emerald-500">✓</span>
                  <span className="flex-1">{h}</span>
                  <button type="button" onClick={() => setHighlights((hl) => hl.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                </li>
              ))}
            </ul>
          )}

          {/* Specifications */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Product Specifications</p>
          <div className="flex gap-2 mb-2">
            <input className="admin-input flex-1" placeholder="Property (e.g. Material)" value={specKey} onChange={(e) => setSpecKey(e.target.value)} />
            <input className="admin-input flex-1" placeholder="Value (e.g. 100% Cotton)" value={specVal}
              onChange={(e) => setSpecVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }}
            />
            <button type="button" onClick={addSpec} className="admin-btn admin-btn-primary !py-1.5 !px-4 !text-sm flex-shrink-0">+ Add</button>
          </div>
          {specifications.length > 0 && (
            <div className="mb-3 border border-slate-200 rounded-xl overflow-hidden">
              {specifications.map((sp, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 text-sm ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                  <span className="font-semibold text-slate-600 w-36 flex-shrink-0">{sp.key}</span>
                  <span className="text-slate-700 flex-1">{sp.value}</span>
                  <button type="button" onClick={() => setSpecifications((s) => s.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Return Policy */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Return Policy</p>
          <textarea
            className="admin-input h-14 resize-y mb-4"
            placeholder="e.g. Custom printed products are non-returnable unless defective..."
            value={form.returnPolicy}
            onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
          />

          {/* Availability */}
          <label className="flex items-center gap-2 text-sm text-slate-600 mb-5 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-indigo-600"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            />
            Available to customers
          </label>

          {/* Image Upload */}
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Product Images (up to 10)</p>
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all text-sm text-slate-500 hover:text-indigo-600 w-fit">
              <span>📷</span> <span>Choose images</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImageFiles(Array.from(e.target.files))} />
            </label>

            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {imageFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(file)} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setImageFiles((p) => p.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >✕</button>
                    {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-indigo-600/85 text-white text-xs text-center py-0.5 rounded-b-xl font-medium">Main</span>}
                  </div>
                ))}
              </div>
            )}
            {editId && imageFiles.length === 0 && existingImages.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-2">Current images (upload new to replace):</p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                      {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-indigo-600/85 text-white text-xs text-center py-0.5 rounded-b-xl">Main</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="admin-btn admin-btn-primary disabled:opacity-60">
            {loading ? "Saving…" : editId ? "Update Product" : "Create Product"}
          </button>
        </form>
      )}

      {/* Table */}
      {loading && !showForm ? (
        <div className="flex items-center justify-center py-24">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
          </div>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Image", "Name", "Brand", "Category", "Type", "Price", "Stock", "Status", "Actions"].map((h) => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p) => {
                  const badge = typeBadge(p);
                  const imgs = p.images?.length ? p.images : p.image ? [p.image] : [];
                  const hasDiscount = p.originalPrice > 0 && p.originalPrice > p.price;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="td">
                        <div className="flex gap-1.5">
                          {imgs.slice(0, 3).map((img, i) => (
                            <img key={i} src={img} alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg shadow-sm"
                              style={{ opacity: i === 0 ? 1 : 0.5 }}
                            />
                          ))}
                          {imgs.length === 0 && (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs">—</div>
                          )}
                        </div>
                      </td>
                      <td className="td font-semibold text-slate-800">{p.name}</td>
                      <td className="td text-slate-500 text-xs">{p.brand || "—"}</td>
                      <td className="td text-slate-500">{p.category}</td>
                      <td className="td">
                        <span className={`status-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="td font-bold text-slate-800">
                        ₹{p.price}
                        {hasDiscount && (
                          <span className="block text-xs text-emerald-600 font-normal">
                            {Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% off
                          </span>
                        )}
                      </td>
                      <td className="td text-slate-600">{p.stock}</td>
                      <td className="td">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${p.isAvailable ? "text-emerald-600" : "text-slate-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.isAvailable ? "bg-emerald-500" : "bg-slate-300"}`} />
                          {p.isAvailable ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="td">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="admin-btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 !py-1.5 !px-3 !text-xs"
                          >Edit</button>
                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            className="admin-btn bg-red-50 hover:bg-red-100 text-red-600 !py-1.5 !px-3 !text-xs"
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p className="text-3xl mb-2">📦</p>
                No products yet. Click "+ Add Product" to create one.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
