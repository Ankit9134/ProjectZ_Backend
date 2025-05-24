// const mongoose = require("mongoose");
// const Cart = require("../../models/TakeAwayOrder"); // Adjust the path to your Cart model
// const historyLogRecorder = require("../../utils/historyLogRecorder");
// /**
//  * Adds an item to the user's cart.
//  */
// // const addItemToCart = async (req, res) => {
// //   try {
// //     const user = req.session?.user?.id;
// //     if (!user) return res.status(401).json({ message: "User not authenticated" });

// //     const { productId, restaurantId, quantity, price, foodType,img } = req.body.itemToAdd;
// //     if (!productId || !restaurantId || !quantity || !price) {
// //       return res.status(400).json({ message: "Missing required fields" });
// //     }

// //     const formattedPrice = parseFloat(price.replace("$", ""));
// //     if (isNaN(formattedPrice) || formattedPrice <= 0 || quantity <= 0) {
// //       return res.status(400).json({ message: "Invalid price or quantity" });
// //     }

// //     let cart = await Cart.findOne({ userId: user });
// //     if (!cart) {
// //       // Create a new cart
// //       cart = new Cart({
// //         userId: user,
// //         items: [{ productId, restaurantName:restaurantId, quantity, price: formattedPrice, foodType,img }],
// //         subtotal: quantity * formattedPrice,
// //       });
// //     } else {
// //       // Check if the item exists in the cart
// //       const existingItem = cart.items.find(
// //         (item) =>
// //           item.productId.toString() === productId &&
// //           item.restaurantName.toString() === restaurantId
// //       );

// //       if (existingItem) {
// //         existingItem.quantity += quantity;
// //         existingItem.price = formattedPrice;
// //       } else {
// //         cart.items.push({ productId, restaurantName:restaurantId, quantity, price: formattedPrice, foodType,img });
// //       }

// //       cart.subtotal = cart.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
// //     }

// //     await cart.save();
// //     res.status(200).json(cart);
// //   } catch (error) {
// //     console.error("Error adding item to cart:", error);
// //     res.status(500).json({ message: "Internal server error", error });
// //   }
// // };

// const addItemToCart = async (req, res) => {
//   try {
//     console.log(req.body.itemToAdd)
//     let user = req.session?.user?.id || req.body.itemToAdd.userId;

//     if (!user) {
//       return res.status(401).json({ message: "User not authenticated" });
//     }

//     const { productId, restaurantId, quantity, price, foodType, img } = req.body.itemToAdd;

//     if (!productId || !restaurantId || !quantity || !price) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const formattedPrice = parseFloat(price.replace("$", ""));
//     if (isNaN(formattedPrice) || formattedPrice <= 0 || quantity <= 0) {
//       return res.status(400).json({ message: "Invalid price or quantity" });
//     }

//     let cart = await Cart.findOne({ userId: user });
//     if (!cart) {

//       cart = new Cart({
//         userId: user,
//         items: [{ productId, restaurantName: restaurantId, quantity, price: formattedPrice, foodType, img }],
//         subtotal: quantity * formattedPrice,
//       });
//     } else {

//       const existingItem = cart.items.find(
//         (item) =>
//           item.productId.toString() === productId &&
//           item.restaurantName.toString() === restaurantId
//       );

//       if (existingItem) {
//         existingItem.quantity += quantity;
//       } else {
//         cart.items.push({ productId, restaurantName: restaurantId, quantity, price: formattedPrice, foodType, img });
//       }

//       // Recalculate subtotal
//       cart.subtotal = cart.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
//     }

//     await cart.save();
//     historyLogRecorder(
//       req,
//       Cart.modelName, // Log for Cart entity
//       "CREATE", // Action
//       cart._id, // New Cart ID
//       `New cart created for user ${user} with initial item from restaurant '${restaurantId}'.`
//     );

//     res.status(200).json(cart);
//   } catch (error) {
//     console.error("Error adding item to cart:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

// /**
//  * Increases the quantity of a specific cart item.
//  */

// /**
//  * Fetches the user's cart details.
//  */
// const fetchCart = async (req, res) => {
//   try {
//     const user = req.session?.user?.id;
//     if (!user) {
//       return res.status(401).json({ message: "User not authenticated" });
//     }

//     const cart = await Cart.findOne({ userId: user })
//       .populate({
//         path: "items.productId",
//         model: "MenuItem", // Name of the MenuItem model
//         select: "name price description variations category group bestSeller",
//       })
//       .populate({
//         path: "items.restaurantName",
//         model: "Firm", // Name of the Firm model
//         select: "restaurantInfo.name restaurantInfo.additionalInfo  restaurantInfo.city restaurantInfo.address image_urls", // Adjust fields as per your Firm schema
//       });

//     if (!cart) {
//       return res.status(404).json({ message: "Cart not found" });
//     }

//     res.status(200).json(cart);
//   } catch (error) {
//     console.error("Error fetching cart data:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

// // const cartLength=async(req,res)=>{
// //   try{
// //     const user = req.session?.user?.id ?? null;
// //     if(!user){
// //       res.status(200).json({message:"Please Login to show the cart details"});
// //     }
// //     const cart = await Cart.findOne({ userId: user });
// //     if (!cart) {
// //       return res.status(200).json({ length: 0, message: "Cart is empty" });
// //     }

// //     const cartLength = cart.items.length;
// //     console.log(cartLength) // Calculate the number of unique items
// //     res.status(200).json({ length: cartLength });
// //   } catch (error) {
// //     console.error("Error calculating cart length:", error);
// //     res.status(500).json({ message: "Internal server error", error });
// //   }

// // }

// const cartLength = async (req, res) => {
//   try {
//     const user = req.session?.user?.id ?? null;

//     // Check if the user is logged in
//     if (!user) {
//       return res.status(200).json({ message: "Please login to show the cart details" });
//     }

//     // Find the user's cart
//     const cart = await Cart.findOne({ userId: user });

//     // Check if the cart exists
//     if (!cart) {
//       return res.status(200).json({ length: 0, message: "Cart is empty" });
//     }

//     // Calculate the number of unique items in the cart
//     const cartLength = cart.items.length;
//     console.log("Cart Length:", cartLength);

//     // Send the cart length in the response
//     return res.status(200).json({ length: cartLength });
//   } catch (error) {
//     console.error("Error calculating cart length:", error);
//     return res.status(500).json({ message: "Internal server error", error });
//   }
// };

// const updateCart = async (req, res) => {
//   try {
//     const { items } = req.body;
//     const userId = req.session?.user?.id || req.body.userId;
//     if (!userId) return res.status(401).json({ message: "User not authenticated" });

//     const cart = await Cart.findOne({ userId });
//     if (!cart) return res.status(404).json({ message: "Cart not found" });

//     cart.items = items;
//     cart.subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

//     await cart.save();
//     res.status(200).json(cart);
//   } catch (error) {
//     console.error("Error updating cart:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
// module.exports = {
//   addItemToCart,
//   fetchCart,
//   cartLength,
//   updateCart
// };

const mongoose = require("mongoose");
const Cart = require("../../models/TakeAwayOrder"); // Adjust the path to your Cart model
const TaxesAndChargesModel = require("../../models/TaxAndCharges"); // Import the tax model
const historyLogRecorder = require("../../utils/historyLogRecorder");

/**
 * Fetches the user's cart details with tax calculation based on restaurant country.
 */
const fetchCart = async (req, res) => {
  try {
    const user = req.session?.user?.id;
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const cart = await Cart.findOne({ userId: user })
      .populate({
        path: "items.productId",
        model: "MenuItem", // Name of the MenuItem model
        select: "name price description variations category group bestSeller",
      })
      .populate({
        path: "items.restaurantName",
        model: "Firm", // Name of the Firm model
        select:
          "restaurantInfo.name restaurantInfo.additionalInfo restaurantInfo.city restaurantInfo.address restaurantInfo.country image_urls", // Added country
      });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Group items by restaurant
    const restaurantGroups = {};
    cart.items.forEach((item) => {
      const restaurantId = item.restaurantName?._id?.toString();
      if (!restaurantId) return; // Skip items with missing restaurant ID

      if (!restaurantGroups[restaurantId]) {
        // Extract country from address if possible
        let country = "default";
        const address = item.restaurantName?.restaurantInfo?.address || "";

        // Check for common countries in the address
        if (address.includes(", Canada") || address.includes(", Canada,")) {
          country = "Canada";
        } else if (
          address.includes(", India") ||
          address.includes(", India,")
        ) {
          country = "India";
        } else if (
          address.includes(", United States") ||
          address.includes(", USA") ||
          address.includes(", U.S.A.")
        ) {
          country = "United States";
        }
        // Add more countries as needed

        restaurantGroups[restaurantId] = {
          items: [],
          subtotal: 0,
          country: country, // Use extracted country instead of restaurantInfo.country
        };
      }

      restaurantGroups[restaurantId].items.push(item);

      // Safely calculate item price, ensuring we don't get NaN
      const price = item.price || 0; // Use the stored price directly
      const quantity = item.quantity || 0;
      console.log(
        `Item prices - stored price: ${price}, product price: ${item.productId?.price}, quantity: ${quantity}`
      );
      restaurantGroups[restaurantId].subtotal += quantity * price;
    });

    // Calculate GST based on restaurant countries
    let totalGst = 0;
    const restaurantTaxDetails = [];

    // Process each restaurant group
    for (const restaurantId in restaurantGroups) {
      const group = restaurantGroups[restaurantId];
      const country = group.country;

      try {
        // Find tax rate for this country
        // Add debug log to help identify issues
        console.log(`Looking up tax for country: ${country}`);
        const tax = await TaxesAndChargesModel.findOne({
          countryName: country,
          taxType: "GST",
        });
        console.log(`Tax found:`, tax);
        let taxRate = 0.05; // Default to 5% if not found

        if (tax && tax.rate) {
          // Handle different formats of tax rate (percentage or decimal)
          const rateStr = tax.rate.toString();
          console.log(`Parsing tax rate: "${rateStr}"`);

          if (rateStr.includes("%")) {
            taxRate = parseFloat(rateStr.replace("%", "")) / 100;
          } else {
            taxRate = parseFloat(rateStr);
            // If tax rate is stored as percentage (e.g., 18 instead of 0.18)
            if (taxRate > 1) {
              taxRate = taxRate / 100;
            }
          }
          console.log(`Calculated tax rate: ${taxRate}`);
        }

        // Ensure taxRate is a valid number
        if (isNaN(taxRate)) {
          console.error(`Invalid tax rate for country ${country}`);
          taxRate = 0.05; // Fallback to default
        }

        // Ensure subtotal is a valid number
        const subtotal = isNaN(group.subtotal) ? 0 : group.subtotal;
        const restaurantGst = subtotal * taxRate;
        console.log(
          `Subtotal: ${subtotal}, Tax Rate: ${taxRate}, GST Amount: ${restaurantGst}`
        );

        // Make sure we're adding a valid number to totalGst
        if (!isNaN(restaurantGst)) {
          totalGst += restaurantGst;
          console.log(`Running total GST: ${totalGst}`);

          restaurantTaxDetails.push({
            restaurantId,
            country,
            taxRate,
            subtotal: subtotal,
            gstAmount: restaurantGst,
          });
        }
      } catch (error) {
        console.error(
          `Error calculating tax for restaurant ${restaurantId}:`,
          error
        );
        // Continue with next restaurant instead of failing the whole operation
      }
    }

    // Ensure all values are valid numbers to prevent NaN errors
    const safeGst = isNaN(totalGst) ? 0 : totalGst;
    const safeSubtotal = isNaN(cart.subtotal) ? 0 : cart.subtotal;
    const safeDeliveryFee = cart.deliveryFee || 35; // Default if not set
    const safePlatformFee = cart.platformFee || 10; // Default if not set

    console.log(`Final GST calculation: ${safeGst}`);
    console.log(`Final total calculation:
    - Subtotal: ${safeSubtotal}
    - Delivery Fee: ${safeDeliveryFee}
    - Platform Fee: ${safePlatformFee}
    - GST: ${safeGst}
    - Total: ${safeSubtotal + safeDeliveryFee + safePlatformFee + safeGst}`);

    // Update cart with calculated values
    cart.gstCharges = safeGst;
    cart.deliveryFee = safeDeliveryFee;
    cart.platformFee = safePlatformFee;
    cart.totalPrice =
      safeSubtotal + safeDeliveryFee + safePlatformFee + safeGst;

    try {
      // Save the updated cart
      await cart.save();
    } catch (error) {
      console.error("Error saving cart:", error);
      // If saving fails, we still want to return the calculated data to the frontend
    }

    // Return the cart with tax details
    res.status(200).json({
      ...cart.toObject(),
      taxDetails: restaurantTaxDetails,
    });
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Update cart function also needs to be modified to handle GST calculation
const updateCart = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.session?.user?.id || req.body.userId;
    if (!userId)
      return res.status(401).json({ message: "User not authenticated" });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = items;

    // Safely calculate subtotal
    cart.subtotal = items.reduce((acc, item) => {
      const price = isNaN(item.price) ? 0 : item.price;
      const quantity = isNaN(item.quantity) ? 0 : item.quantity;
      return acc + quantity * price;
    }, 0);

    // Re-fetch the cart with populated data to calculate taxes
    const populatedCart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        model: "MenuItem",
      })
      .populate({
        path: "items.restaurantName",
        model: "Firm",
        select:
          "restaurantInfo.name restaurantInfo.additionalInfo restaurantInfo.city restaurantInfo.address restaurantInfo.country image_urls",
      });

    // Group items by restaurant
    const restaurantGroups = {};
    cart.items.forEach((item) => {
      const restaurantId = item.restaurantName?._id?.toString();
      if (!restaurantId) return; // Skip items with missing restaurant ID

      if (!restaurantGroups[restaurantId]) {
        // Extract country from address if possible
        let country = "default";
        const address = item.restaurantName?.restaurantInfo?.address || "";

        // Check for common countries in the address
        if (address.includes(", Canada") || address.includes(", Canada,")) {
          country = "Canada";
        } else if (
          address.includes(", India") ||
          address.includes(", India,")
        ) {
          country = "India";
        } else if (
          address.includes(", United States") ||
          address.includes(", USA") ||
          address.includes(", U.S.A.")
        ) {
          country = "United States";
        }
        // Add more countries as needed

        restaurantGroups[restaurantId] = {
          items: [],
          subtotal: 0,
          country: country, // Use extracted country instead of restaurantInfo.country
        };
      }

      restaurantGroups[restaurantId].items.push(item);

      // Safely calculate item price
      const itemPrice = item.productId?.price || item.price || 0;
      const quantity = item.quantity || 0;
      restaurantGroups[restaurantId].subtotal += quantity * itemPrice;
    });

    // Calculate GST based on restaurant countries
    let totalGst = 0;

    // Process each restaurant group
    for (const restaurantId in restaurantGroups) {
      const group = restaurantGroups[restaurantId];
      const country = group.country;

      try {
        // Find tax rate for this country
        console.log(`Looking up tax for country: ${country}`);
        const tax = await TaxesAndChargesModel.findOne({
          countryName: country,
          taxType: "GST",
        });
        console.log(`Tax found:`, tax);
        let taxRate = 0.05; // Default to 5% if not found

        if (tax && tax.rate) {
          // Handle different formats of tax rate
          const rateStr = tax.rate.toString();
          console.log(`Parsing tax rate: "${rateStr}"`);

          if (rateStr.includes("%")) {
            taxRate = parseFloat(rateStr.replace("%", "")) / 100;
          } else {
            taxRate = parseFloat(rateStr);
            // If tax rate is stored as percentage (e.g., 18 instead of 0.18)
            if (taxRate > 1) {
              taxRate = taxRate / 100;
            }
          }
          console.log(`Calculated tax rate: ${taxRate}`);
        }

        // Ensure taxRate is a valid number
        if (isNaN(taxRate)) {
          console.error(`Invalid tax rate for country ${country}`);
          taxRate = 0.05; // Fallback to default
        }

        // Ensure subtotal is a valid number
        const subtotal = isNaN(group.subtotal) ? 0 : group.subtotal;
        const restaurantGst = subtotal * taxRate;
        console.log(
          `Subtotal: ${subtotal}, Tax Rate: ${taxRate}, GST Amount: ${restaurantGst}`
        );

        // Make sure we're adding a valid number to totalGst
        if (!isNaN(restaurantGst)) {
          totalGst += restaurantGst;
          console.log(`Running total GST: ${totalGst}`);
        }
      } catch (error) {
        console.error(
          `Error calculating tax for restaurant ${restaurantId}:`,
          error
        );
        // Continue with next restaurant
      }
    }

    // Ensure all values are valid numbers to prevent NaN errors
    const safeGst = isNaN(totalGst) ? 0 : totalGst;
    const safeSubtotal = isNaN(cart.subtotal) ? 0 : cart.subtotal;
    const safeDeliveryFee = cart.deliveryFee || 35; // Default if not set
    const safePlatformFee = cart.platformFee || 10; // Default if not set

    console.log(`Final GST calculation: ${safeGst}`);
    console.log(`Final total calculation:
    - Subtotal: ${safeSubtotal}
    - Delivery Fee: ${safeDeliveryFee}
    - Platform Fee: ${safePlatformFee}
    - GST: ${safeGst}
    - Total: ${safeSubtotal + safeDeliveryFee + safePlatformFee + safeGst}`);

    // Update cart with calculated values
    cart.gstCharges = safeGst;
    cart.deliveryFee = safeDeliveryFee;
    cart.platformFee = safePlatformFee;
    cart.totalPrice =
      safeSubtotal + safeDeliveryFee + safePlatformFee + safeGst;

    try {
      await cart.save();
      res.status(200).json(cart);
    } catch (saveError) {
      console.error("Error saving cart:", saveError);
      // Return calculated data even if save fails
      res.status(200).json({
        ...cart.toObject(),
        message: "Warning: Cart calculated but not saved to database",
      });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Calculates cart length
 */
const cartLength = async (req, res) => {
  try {
    const user = req.session?.user?.id ?? null;

    // Check if the user is logged in
    if (!user) {
      return res
        .status(200)
        .json({ message: "Please login to show the cart details" });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId: user });

    // Check if the cart exists
    if (!cart) {
      return res.status(200).json({ length: 0, message: "Cart is empty" });
    }

    // Calculate the number of unique items in the cart
    const cartLength = cart.items.length;
    console.log("Cart Length:", cartLength);

    // Send the cart length in the response
    return res.status(200).json({ length: cartLength });
  } catch (error) {
    console.error("Error calculating cart length:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

/**
 * Adds an item to the cart
 */
const addItemToCart = async (req, res) => {
  try {
    console.log(req.body.itemToAdd);
    let user = req.session?.user?.id || req.body.itemToAdd.userId;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { productId, restaurantId, quantity, price, foodType, img } =
      req.body.itemToAdd;

    if (!productId || !restaurantId || !quantity || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const formattedPrice = parseFloat(price.replace("$", ""));
    if (isNaN(formattedPrice) || formattedPrice <= 0 || quantity <= 0) {
      return res.status(400).json({ message: "Invalid price or quantity" });
    }

    let cart = await Cart.findOne({ userId: user });
    if (!cart) {
      cart = new Cart({
        userId: user,
        items: [
          {
            productId,
            restaurantName: restaurantId,
            quantity,
            price: formattedPrice,
            foodType,
            img,
          },
        ],
        subtotal: quantity * formattedPrice,
      });
    } else {
      const existingItem = cart.items.find(
        (item) =>
          item.productId.toString() === productId &&
          item.restaurantName.toString() === restaurantId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          productId,
          restaurantName: restaurantId,
          quantity,
          price: formattedPrice,
          foodType,
          img,
        });
      }

      // Recalculate subtotal
      cart.subtotal = cart.items.reduce(
        (acc, item) => acc + item.quantity * item.price,
        0
      );
    }

    // Now calculate GST based on the restaurant
    try {
      // Populate the restaurant information to get the country
      await cart.populate({
        path: "items.restaurantName",
        model: "Firm",
        select: "restaurantInfo.country",
      });

      // Group items by restaurant for tax calculation
      const restaurantGroups = {};
      cart.items.forEach((item) => {
        const restaurantId = item.restaurantName?._id?.toString();
        if (!restaurantId) return;

        if (!restaurantGroups[restaurantId]) {
          restaurantGroups[restaurantId] = {
            subtotal: 0,
            country: item.restaurantName?.restaurantInfo?.country || "default",
          };
        }

        restaurantGroups[restaurantId].subtotal += item.quantity * item.price;
      });

      // Calculate GST for each restaurant
      let totalGst = 0;
      for (const restaurantId in restaurantGroups) {
        const group = restaurantGroups[restaurantId];
        const country = group.country;

        // Find tax rate for this country
        const tax = await TaxesAndChargesModel.findOne({
          countryName: country,
          taxType: "GST",
        });

        let taxRate = 0.05; // Default to 5% if not found
        if (tax && tax.rate) {
          const rateStr = tax.rate.toString();
          if (rateStr.includes("%")) {
            taxRate = parseFloat(rateStr.replace("%", "")) / 100;
          } else {
            taxRate = parseFloat(rateStr);
            if (taxRate > 1) {
              taxRate = taxRate / 100;
            }
          }
        }

        // Calculate GST
        const subtotal = group.subtotal;
        const restaurantGst = subtotal * taxRate;
        if (!isNaN(restaurantGst)) {
          totalGst += restaurantGst;
        }
      }

      // Update cart with tax information
      cart.gstCharges = totalGst;
      cart.deliveryFee = cart.deliveryFee || 35;
      cart.platformFee = cart.platformFee || 10;
      cart.totalPrice =
        cart.subtotal + cart.deliveryFee + cart.platformFee + cart.gstCharges;
    } catch (taxError) {
      console.error("Error calculating taxes during add to cart:", taxError);
      // Continue even if tax calculation fails
    }

    await cart.save();
    historyLogRecorder(
      req,
      Cart.modelName, // Log for Cart entity
      "CREATE", // Action
      cart._id, // New Cart ID
      `New cart created for user ${user} with initial item from restaurant '${restaurantId}'.`
    );

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = {
  addItemToCart,
  fetchCart,
  cartLength,
  updateCart,
};
