const Faq = require('../models/AdminDashboard/FaqSchema');
const asyncHandler = require('express-async-handler'); // Assuming you use this for error handling

// @desc    Get all FAQs
// @route   GET /api/faq (or wherever it's mounted)
// @access  Public (or Private depending on your auth)
const getFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find({}); // Fetch all FAQs
  // Consider adding filtering by category if needed from query params: const { category } = req.query;
  res.status(200).json({ faqs });
});

// @desc    Create a new FAQ
// @route   POST /api/faq (or wherever it's mounted)
// @access  Private/Admin (adjust based on your auth middleware)
const createFaq = asyncHandler(async (req, res) => {
  const { q, a, category } = req.body;

  if (!q || !a || !category) {
    res.status(400);
    throw new Error('Please provide question, answer, and category');
  }

  // Optional: Add validation to ensure category is one of the allowed enums
  const allowedCategories = Faq.schema.path('category').enumValues;
  if (!allowedCategories.includes(category)) {
      res.status(400);
      throw new Error(`Invalid category. Must be one of: ${allowedCategories.join(', ')}`);
  }

  const faq = await Faq.create({
    q,
    a,
    category,
  });

  if (faq) {
    res.status(201).json(faq); // Return the created FAQ
  } else {
    res.status(400);
    throw new Error('Invalid FAQ data');
  }
});

// Note: You might need update and delete controllers/routes as well

module.exports = {
  getFaqs,
  createFaq,
}; 