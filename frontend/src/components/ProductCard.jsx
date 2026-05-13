import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import { toggleFavorite, selectFavoriteIds } from "../features/favorites/favoritesSlice";
import { toast } from "react-toastify";

export default function ProductCard({ product, badge }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const favoriteIds = useSelector(selectFavoriteIds);
  const isFav = favoriteIds.has(product._id);
  const cardImage = product.images?.[0] || product.image || null;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addToCart({ ...product, quantity: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  const handleFav = (e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(product));
    toast.success(isFav ? "Removed from favourites" : "Added to favourites ❤️");
  };

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={cardImage || "https://placehold.co/300x300/f5f5f5/999?text=No+Image"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Fav button */}
        <button
          onClick={handleFav}
          className="absolute top-2 right-2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10 border-none cursor-pointer text-base"
          title={isFav ? "Remove from favourites" : "Add to favourites"}
        >
          {isFav ? "❤️" : "🤍"}
        </button>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {badge && <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">{badge}</span>}
          {product.requiresCustomImage && <span className="bg-[#1a1a2e] text-white text-[10px] font-bold px-2 py-0.5 rounded">🎨 Custom Print</span>}
          {!product.isAvailable && <span className="bg-gray-400 text-white text-[10px] font-bold px-2 py-0.5 rounded">Out of Stock</span>}
        </div>

        {/* Quick Add */}
        {product.isAvailable && !product.requiresCustomImage && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-0 left-0 right-0 bg-red-700 text-white py-3 text-xs font-bold tracking-wide border-none cursor-pointer opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
          >
            + Add to Cart
          </button>
        )}
        {product.isAvailable && product.requiresCustomImage && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}`); }}
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] text-white py-3 text-xs font-bold tracking-wide border-none cursor-pointer opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
          >
            🎨 Customize Now
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">{product.category}</p>
        <h3 className="text-gray-900 text-sm font-semibold mb-2 leading-snug line-clamp-2">{product.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-red-700 text-base font-bold">₹{product.price.toLocaleString()}</span>
          {product.requiresCustomImage && (
            <span className="bg-red-50 text-red-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">Upload Design</span>
          )}
        </div>
      </div>
    </div>
  );
}
