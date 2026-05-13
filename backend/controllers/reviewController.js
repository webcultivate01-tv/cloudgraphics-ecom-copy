const Review = require("../models/Review");

// @desc  Submit a new review
// @route POST /api/review
// @access Public
const createReview = async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;

    if (!name || !email || !rating || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = await Review.create({ name, email, rating: parsedRating, message });
    res.status(201).json({ message: "Review submitted successfully. It will appear after approval.", review });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Get all approved reviews (public homepage)
// @route GET /api/review
// @access Public
const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .select("-email");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Get all reviews for admin
// @route GET /api/review/admin
// @access Admin
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Approve a review
// @route PATCH /api/review/:id/approve
// @access Admin
const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.status = "approved";
    await review.save();

    res.json({ message: "Review approved", review });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Delete a review
// @route DELETE /api/review/:id
// @access Admin
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { createReview, getApprovedReviews, getAllReviews, approveReview, deleteReview };
