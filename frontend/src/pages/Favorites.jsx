import { useDispatch, useSelector } from "react-redux";
import { clearFavorites } from "../features/favorites/favoritesSlice";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Favorites() {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.favorites);

  const handleClearAll = () => {
    if (!window.confirm("Remove all favourites?")) return;
    dispatch(clearFavorites());
    toast.success("Favourites cleared");
  };

  return (
    <div className="bg-white min-h-[80vh] max-w-7xl mx-auto px-4 md:px-12 py-8 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 m-0">
            ❤️ My Favourites
            {items.length > 0 && <span className="bg-red-700 text-white text-sm font-bold px-3 py-0.5 rounded-full">{items.length}</span>}
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">Products you have saved for later</p>
        </div>
        {items.length > 0 && (
          <button onClick={handleClearAll} className="bg-white border border-gray-200 text-red-700 px-4 py-2 rounded-lg cursor-pointer font-semibold text-sm hover:bg-red-50 transition-colors">
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🤍</div>
          <p className="text-lg font-bold text-gray-900 mb-2">No favourites yet</p>
          <p className="text-gray-400 text-sm mb-6">Tap the heart icon on any product to save it here.</p>
          <Link to="/products" className="inline-block bg-red-700 hover:bg-red-800 text-white px-7 py-3 rounded-lg font-bold text-sm transition-colors">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      )}
    </div>
  );
}
