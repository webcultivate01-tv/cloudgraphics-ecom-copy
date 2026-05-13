import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { fetchCategories } from "../features/categories/categorySlice";
import ProductCard from "../components/ProductCard";
import { useSearchParams } from "react-router-dom";

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function Products() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((s) => s.products);
  const { items: categoryItems } = useSelector((s) => s.categories);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState("newest");
  const [expandedCats, setExpandedCats] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeCategory = searchParams.get("category") || "";
  const activeSubcategory = searchParams.get("subcategory") || "";

  useEffect(() => {
    dispatch(fetchCategories());
    const filters = {};
    if (activeCategory) filters.category = activeCategory;
    if (activeSubcategory) filters.subcategory = activeSubcategory;
    if (search) filters.search = search;
    dispatch(fetchProducts(filters));
  }, [dispatch, activeCategory, activeSubcategory, search]);

  useEffect(() => {
    if (activeCategory) setExpandedCats((prev) => ({ ...prev, [activeCategory]: true }));
  }, [activeCategory]);

  const toggleCat = (name) => setExpandedCats((prev) => ({ ...prev, [name]: !prev[name] }));

  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const pageLabel = activeSubcategory ? `${activeCategory} › ${activeSubcategory}` : activeCategory || "All Products";

  const filterBtn = (active) => `w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer border-none transition-colors ${active ? "bg-red-50 text-red-700 font-bold" : "bg-transparent text-gray-600 hover:bg-gray-50"}`;

  const SidebarContent = () => (
    <>
      <div className="mb-6">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Search</h3>
        <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-red-600"
          placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="mb-6">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Categories</h3>
        <div className="flex flex-col gap-1">
          <button className={filterBtn(activeCategory === "")} onClick={() => setSearchParams({})}>All Products</button>
          {categoryItems.map((cat) => {
            const isOpen = !!expandedCats[cat.name];
            const isCatActive = activeCategory === cat.name && !activeSubcategory;
            const hasSubs = cat.subcategories?.filter((s) => s.isActive).length > 0;
            return (
              <div key={cat._id}>
                <div className="flex items-center gap-1">
                  <button className={`${filterBtn(isCatActive)} flex-1`}
                    onClick={() => { setSearchParams({ category: cat.name }); if (hasSubs) toggleCat(cat.name); }}>
                    {cat.icon} {cat.name}
                  </button>
                  {hasSubs && (
                    <button className="text-gray-400 text-xs px-1.5 py-1 bg-transparent border-none cursor-pointer" onClick={() => toggleCat(cat.name)}>
                      {isOpen ? "▲" : "▼"}
                    </button>
                  )}
                </div>
                {isOpen && hasSubs && (
                  <div className="pl-3 flex flex-col gap-0.5 mt-0.5">
                    {cat.subcategories.filter((s) => s.isActive).map((sub) => {
                      const isSubActive = activeCategory === cat.name && activeSubcategory === sub.name;
                      return (
                        <button key={sub._id} className={filterBtn(isSubActive)}
                          onClick={() => setSearchParams({ category: cat.name, subcategory: sub.name })}>
                          └ {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Product Type</h3>
        <div className="flex flex-col gap-1">
          <button className={filterBtn(false)} onClick={() => dispatch(fetchProducts({ requiresCustomImage: false }))}>Direct Sale Products</button>
          <button className={filterBtn(false)} onClick={() => dispatch(fetchProducts({ requiresCustomImage: true }))}>🎨 Customize Products</button>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-white min-h-[80vh]">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            {pageLabel}
            <span className="bg-gray-100 text-gray-500 text-sm font-semibold px-3 py-0.5 rounded-full">{products.length}</span>
          </h1>
          {/* Mobile filter toggle */}
          <button className="md:hidden ml-auto flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white"
            onClick={() => setSidebarOpen(true)}>
            ☰ Filters
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-1">Home / Products{activeCategory ? ` / ${activeCategory}` : ""}{activeSubcategory ? ` / ${activeSubcategory}` : ""}</p>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar — desktop */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-gray-200 px-4 py-6">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute top-0 left-0 bottom-0 w-72 bg-white overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <span className="font-black text-gray-900 text-sm uppercase tracking-wide">Filters</span>
                <button className="text-gray-400 text-lg font-bold bg-transparent border-none cursor-pointer" onClick={() => setSidebarOpen(false)}>✕</button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 px-4 md:px-8 py-5">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
            <p className="text-gray-500 text-sm">Showing {sorted.length} products</p>
            <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white cursor-pointer outline-none"
              value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-5xl">🔍</span>
              <p className="text-gray-500 mt-3 text-sm">No products found. Try a different filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sorted.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
