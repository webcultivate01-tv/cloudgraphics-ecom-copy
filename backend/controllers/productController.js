const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

const parseJSON = (val, fallback = []) => {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
};

// @desc    Get all available products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, subcategory, search } = req.query;
    let filter = { isAvailable: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new product (admin uploads image via Cloudinary)
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res) => {
  try {
    const {
      name, description, price, originalPrice,
      brand, sku, category, stock,
      allowCustomImage, requiresCustomImage,
      weight, returnPolicy,
    } = req.body;

    const uploadedImages = req.files?.length
      ? req.files.map((f) => f.path)
      : req.file
      ? [req.file.path]
      : [];

    const highlights     = parseJSON(req.body.highlights, []);
    const specifications = parseJSON(req.body.specifications, []);
    const tags           = parseJSON(req.body.tags, []);

    const product = await Product.create({
      name,
      description,
      price,
      originalPrice: Number(originalPrice) || 0,
      brand: brand || "",
      sku: sku || "",
      category,
      stock,
      allowCustomImage,
      requiresCustomImage,
      image: uploadedImages[0] || "",
      images: uploadedImages,
      highlights,
      specifications,
      tags,
      weight: weight || "",
      returnPolicy: returnPolicy || "",
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      name, description, price, originalPrice,
      brand, sku, category, stock,
      isAvailable, allowCustomImage, requiresCustomImage,
      weight, returnPolicy,
    } = req.body;

    if (req.files?.length) {
      const newImages = req.files.map((f) => f.path);
      product.images = newImages;
      product.image = newImages[0];
    } else if (req.file) {
      product.images = [req.file.path];
      product.image = req.file.path;
    }

    product.name               = name               ?? product.name;
    product.description        = description        ?? product.description;
    product.price              = price              ?? product.price;
    product.originalPrice      = originalPrice !== undefined ? Number(originalPrice) : product.originalPrice;
    product.brand              = brand              ?? product.brand;
    product.sku                = sku                ?? product.sku;
    product.category           = category           ?? product.category;
    product.stock              = stock              ?? product.stock;
    product.isAvailable        = isAvailable        ?? product.isAvailable;
    product.allowCustomImage   = allowCustomImage   ?? product.allowCustomImage;
    product.requiresCustomImage= requiresCustomImage?? product.requiresCustomImage;
    product.weight             = weight             ?? product.weight;
    product.returnPolicy       = returnPolicy       ?? product.returnPolicy;

    if (req.body.highlights !== undefined)
      product.highlights = parseJSON(req.body.highlights, product.highlights);
    if (req.body.specifications !== undefined)
      product.specifications = parseJSON(req.body.specifications, product.specifications);
    if (req.body.tags !== undefined)
      product.tags = parseJSON(req.body.tags, product.tags);

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products (including unavailable) for admin
// @route   GET /api/products/admin/all
// @access  Admin
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
};
