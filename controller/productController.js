// const { mongoose } = require("mongoose");
const Firm = require("../models/Firm");
// const Product = require("../models/Product");
const multer = require("multer");
const Fuse = require("fuse.js");
const path = require("path");
// const Product = require("../models/product");
// const Firm = require("../models/Firm");
const mongoose = require("mongoose");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); //Folder where the images uploaded images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Generating a unique file name
  },
});
const upload = multer({ storage: storage });

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { category, orderType, bestSeller } = req.query;
    const query = {};

    if (category && ["veg", "non-veg"].includes(category)) {
      query.category = category;
    }

    if (orderType) {
      const validOrderTypes = ["order-online", "dine-out", "night-life"];
      const orderTypesArray = orderType
        .split(",")
        .filter((type) => validOrderTypes.includes(type));
      if (orderTypesArray.length) query.orderType = { $in: orderTypesArray };
    }

    if (bestSeller !== undefined) {
      query.bestSeller = bestSeller === "true";
    }

    const products = await Product.find(query).populate(
      "firm",
      "_id firmName image"
    );

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for the given filters." });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error while fetching products" });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid Product ID" });
    }

    const product = await Product.findById(productId).populate(
      "firm",
      "_id firmName image"
    );
    if (!product) {
      return res
        .status(404)
        .json({ message: `Product with ID ${productId} not found` });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error while fetching product" });
  }
};

// Add a new product
const addProduct = async (req, res) => {
  try {
    const { productName, price, category, bestSeller, description, orderType } =
      req.body;
    const firmId = req.params.firmId;

    if (!mongoose.Types.ObjectId.isValid(firmId)) {
      return res.status(400).json({ error: "Invalid Firm ID" });
    }

    const firm = await Firm.findById(firmId);
    if (!firm) {
      return res.status(404).json({ error: "Firm not found" });
    }

    if (category && !["veg", "non-veg"].includes(category)) {
      return res.status(400).json({
        error: 'Invalid category. Allowed values are "veg" or "non-veg".',
      });
    }

    if (
      orderType &&
      (!Array.isArray(orderType) ||
        !orderType.every((type) =>
          ["order-online", "dine-out", "night-life"].includes(type)
        ))
    ) {
      return res.status(400).json({
        error:
          'Invalid orderType values. Allowed values are "order-online", "dine-out", and "night-life".',
      });
    }

    const image = req.file ? req.file.filename : undefined;

    const product = new Product({
      productName,
      price,
      category,
      bestSeller: bestSeller === "true",
      description,
      image,
      orderType,
      firm: firm._id,
    });

    const savedProduct = await product.save();

    await Firm.updateOne(
      { _id: firm._id },
      { $addToSet: { product: savedProduct._id } }
    );

    res.status(201).json({
      message: "Product added successfully!",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error while adding product" });
  }
};

// Update product by ID
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid Product ID" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error while updating product" });
  }
};

// Get products by firm ID
const getProductByFirm = async (req, res) => {
  try {
    const { firmId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(firmId)) {
      return res.status(400).json({ error: "Invalid Firm ID" });
    }

    const firm = await Firm.findById(firmId).lean();
    if (!firm) {
      return res.status(404).json({ error: "Firm not found" });
    }

    const products = await Product.find({ firm: firmId }).lean();
    res.status(200).json({ firmName: firm.firmName, products });
  } catch (error) {
    console.error("Error fetching products by firm:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error while fetching products by firm" });
  }
};

// method to delete products
const deleteProductById = async (req, res) => {
  try {
    const productId = req.params.productId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid Product ID" });
    }

    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      res.status(404).json({ error: "Product Not Found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error while deleting product" });
  }
};

// search function implementation
const searchByDishOrFirm = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res
        .status(400)
        .json({ message: "Please provide a search query." });
    }
    const firms = await Firm.find({});
    const products = await Product.find({}).populate("firm", "firmName area");
    const fuseOptions = {
      keys: ["firmName"],
      threshold: 0.3,
    };
    const fuseProductsOptions = {
      keys: ["productName"],
      threshold: 0.3, // Fuzziness control
    };
    const fuseFirms = new Fuse(firms, fuseOptions);
    const firmResults = fuseFirms.search(query).map((result) => result.item);
    const fuseProducts = new Fuse(products, fuseProductsOptions);
    const productResults = fuseProducts
      .search(query)
      .map((result) => result.item);

    res.status(200).json({
      firms: firmResults.length ? firmResults : [],
      dishes: productResults.length ? productResults : [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// get all products

// const addProduct = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Validate Firm ID
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ error: "Invalid Firm ID" });
//     }

//     // Find the Firm by ID
//     const firm = await Firm.findById(id);
//     if (!firm) {
//       return res.status(404).json({ error: "Firm not found" });
//     }

//     // Parse formData and handle nested dietary array properly
//     const formData = req.body;

//     // Handle images uploaded via FormData
//     const files = req.files || [];
//     const imageDetails = files.map((file) => ({
//       filename: file.filename,
//       url: file.path, // Assuming the file path is already a valid URL
//     }));

//     // Ensure dietary field is parsed correctly if received as a comma-separated string
//     if (formData.dietary && typeof formData.dietary === "string") {
//       formData.dietary = formData.dietary.split(",").map((item) => item.trim());
//     }

//     // Create the new product object
//     const newProduct = new Product({
//       ...formData,
//       images: imageDetails,
//       firm: firm._id,
//     });

//     // Add the product reference to the firm document
//     firm.product.push(newProduct._id);
//     await firm.save();

//     // Save the new product in the database
//     await newProduct.save();

//     console.log("Response after saving the req.body to db", newProduct);

//     res
//       .status(201)
//       .json({ response: "ok", message: "Product saved successfully" });
//   } catch (err) {
//     console.error("Error adding product:", err.message);
//     res.status(400).json({ error: err.message });
//   }
// };

// Route to get all products under a specific firm
const getAllProduct = async (req, res) => {
  const { id } = req.params;

  // Validate the firm ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid firm ID" });
  }

  try {
    // Fetch products where firm_id matches the provided firmId
    const products = await Product.find({ firm: id });
    // console.log(products);
    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this firm to list yet" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addProduct: [upload.single("image"), addProduct],
  getAllProducts,
  getProductById,
  updateProduct,
  getProductByFirm,
  deleteProductById,
  searchByDishOrFirm,
  getAllProduct,
};
