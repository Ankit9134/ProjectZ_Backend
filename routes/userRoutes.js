// import express from 'express';

// import { UserModel } from '../../database/allModels.js';

// const Router = express.Router();

// /*
// Route     /
// Des       Get a user data
// Params    _userId
// Access    Public
// Method    GET
// */

// Router.get('/:_userId', async (req, res) => {
//   try {
//     const { _userId } = req.params;
//     const getUser = await UserModel.findById(_userId);
//     return res.json({ user: getUser });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

// /*
// Route     /update
// Des       update a user data
// Params    _userId
// Body      userData
// Access    Public
// Method    put
// */

// Router.put('/update/:_userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { userData } = req.body;
//     const updateUserData = await UserModel.findByIdAndUpdate(
//       userId,
//       { $set: userData },
//       { new: true }
//     );
//     return res.json({ user: getUser });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

// export default Router;
// const express = require("express");

// const UserModel = require("../models/user");

// const Router = express.Router();

/*
Route     /
Des       Get a user data
Params    _userId
Access    Public
Method    GET  
*/

// Router.get("/:_userId", async (req, res) => {
//   try {
//     const { _userId } = req.params;
//     const getUser = await UserModel.findById(_userId);
//     return res.json({ user: getUser });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

/*
Route     /update
Des       update a user data
Params    _userId
Body      userData
Access    Public
Method    PUT  
*/

// Router.put("/update/:_userId", async (req, res) => {
//   try {
//     const { _userId } = req.params;
//     const { userData } = req.body;
//     const updateUserData = await UserModel.findByIdAndUpdate(
//       _userId,
//       { $set: userData },
//       { new: true }
//     );
//     return res.json({ user: updateUserData });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

/*
Route     /address
Des       Add a new address to user data
Params    _userId
Body      addressData
Access    Public
Method    PUT  
*/

// Router.put("api/address", async (req, res) => {
//   try {
//     const { _userId } = req.params;
//     const { addressData } = req.body;

//     if (!addressData || !addressData.detail || !addressData.for) {
//       return res
//         .status(400)
//         .json({ error: "Address detail and type are required." });
//     }

//     const updatedUser = await UserModel.findByIdAndUpdate(
//       _userId,
//       { $push: { address: addressData } },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     return res.json({
//       message: "Address added successfully.",
//       user: updatedUser,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

const { hasAdminRight } = require("../middleware/validateUser");
const userController = require("../controller/userController");
const { Router } = require("express");
const router = Router();
const User = require("../models/user.js");
const authMiddleware = require("../middleware/auth");

//to add or register user
router.post("/signup", userController.registerUser);
//to login user
router.post("/login", userController.loginUser);

//to change the role of multiple user
router.post("/mutli-role-filter", userController.changeMultiUserRoles);

//to change the access control of the user
router.post(
  "/change-control/:id",
  authMiddleware,
  // hasAdminRight,
  userController.changeSingleUserRoles
);

//banned and unbanned the user
router.put(
  "/ban-user/:id",
  authMiddleware,
  // hasAdminRight,
  userController.toggleUserBanStatus
);

//to search the user
router.get("/search", userController.searchUserByNameAndEmail);

//delete user from the database
router.delete(
  "/delete-user/:id",
  authMiddleware,
  // hasAdminRight,
  userController.deleteUser
);

//to get all details of user
router.get(
  "/all-user",
  authMiddleware,
  // hasAdminRight,
  userController.getAllUsers
);
// router.get("/all-user", userController.getAllUsers);
//filter the user on the basis of role they have
router.get("/filter", userController.roleBasedFilter);

router.get("/sort", userController.sortUser);

//banned many user
router.put("/banned-many", userController.bannedManyUser);

//banned many user
router.put("/access-many", userController.accessManyUser);

//to edit user detail
router.put("/:id", authMiddleware, userController.editUser);

router.delete("/delete-many", userController.deleteManyUser);

// router.post("/insert-many", async (req, res) => {
//   const manyUser = await User.insertMany(dummyInfo);
//   console.log("user feed in db");
//   res.json(manyUser);
// });

//to get the unique user
router.get(
  "/:userId",
  authMiddleware,
  hasAdminRight,
  userController.getUserById
);

// router.post("/feed/:userId", async (req, res) => {
//   const id = "67a1fe47c8fde48f4fe57b71";
//   const d = await User.findByIdAndUpdate(
//     req.params.userId,
//     { $push: { firms: id } },
//     { new: true }
//   );
//   res.status(200).json({ response: "ok", user: d });
// });

let dummyInfo = [
  {
    username: "alex_morris",
    password: "hashed_password_1",
    email: "alex.morris@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [], // Associated with a firm
    kitchens: [],
    events: [],
    role: ["user"],
  },
  {
    username: "sophia_reed",
    password: "hashed_password_2",
    email: "sophia.reed@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [], // Works in a firm
    kitchens: [],
    events: [],
    role: ["admin"],
  },
  {
    username: "liam_anderson",
    password: "hashed_password_3",
    email: "liam.anderson@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [], // Event Creator
    role: ["eventCreator"],
  },
  {
    username: "olivia_knight",
    password: "hashed_password_4",
    email: "olivia.knight@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [], // Tiffin Owner
    events: [],
    role: ["kitchenOwner"],
  },
  {
    username: "henry_wilson",
    password: "hashed_password_5",
    email: "henry.wilson@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["moderator"],
  },
  {
    username: "ava_collins",
    password: "hashed_password_6",
    email: "ava.collins@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["restaurantOwner"],
  },
  {
    username: "daniel_walker",
    password: "hashed_password_7",
    email: "daniel.walker@example.com",
    isBanned: true, // Banned user
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["user"],
  },
  {
    username: "emma_dixon",
    password: "hashed_password_8",
    email: "emma.dixon@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [], // Event Organizer
    role: ["eventCreator", "user"],
  },
  {
    username: "noah_jenkins",
    password: "hashed_password_9",
    email: "noah.jenkins@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["admin", "moderator"],
  },
  {
    username: "isabella_clark",
    password: "hashed_password_10",
    email: "isabella.clark@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["kitchenOwner"],
  },
  {
    username: "ethan_murphy",
    password: "hashed_password_11",
    email: "ethan.murphy@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["eventCreator"],
  },
  {
    username: "mia_hudson",
    password: "hashed_password_12",
    email: "mia.hudson@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["restaurantOwner"],
  },
  {
    username: "lucas_martin",
    password: "hashed_password_13",
    email: "lucas.martin@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["kitchenOwner"],
  },
  {
    username: "harper_king",
    password: "hashed_password_14",
    email: "harper.king@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["moderator"],
  },
  {
    username: "benjamin_taylor",
    password: "hashed_password_15",
    email: "benjamin.taylor@example.com",
    isBanned: false,
    lastLogin: new Date(),
    firms: [],
    kitchens: [],
    events: [],
    role: ["user"],
  },
];

module.exports = router;
