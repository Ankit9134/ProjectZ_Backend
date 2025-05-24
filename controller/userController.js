const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const historyLogRecorder = require("../utils/historyLogRecorder");

const my_secret = process.env.JWT_SECRET || "";

const registerUser = async (req, res) => {
  try {
    let { username, email, password, role } = req.body;

    const existUser = await User.findOne({ email: email });
    if (existUser) {
      return res.status(403).json({ message: "User aleardy exist" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      role: role,
    });

    await newUser.save();
    res.status(201).json({ response: true, message: "New user created" });
  } catch (err) {
    console.log(err);
    // res.json({err})
    res.status(500).json({ response: false, error: "internal Server error" });
  }
};

// req.session.user = {
//   id: user._id,
//   email: user.email,
//   username: user.username,
// };

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existUser = await User.findOne({ email: email });
    const isSame = await bcrypt.compare(password, existUser.password);

    if (!existUser || !isSame) {
      return res
        .status(401)
        .json({ message: "User email or password is wrong" });
    }
    existUser.lastLogin = new Date();
    await existUser.save();

    const token = jwt.sign(
      {
        userId: existUser._id,
      },
      my_secret,
      { expiresIn: "1d" }
    );
    res
      .status(201)
      .json({ response: true, message: "user login successfully", token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ response: false, error: "Internal server Error" });
  }
};

//admin dashboard controllers ---------------
const changeMultiUserRoles = async (req, res) => {
  try {
    const { roles } = req.body;
    let users;
    if (roles.length <= 0) {
      users = await User.find().limit(100);
      return res.json({
        response: true,
        message: "clear filter",
        users: users,
      });
    }
    users = await User.find({ role: { $all: [...roles] } }).limit(100);
    const userArr = users.map((el) => el._id);
    historyLogRecorder(
      req,
      users.constructor.modelName,
      "UPDATE",
      userArr,
      `Change the role of multiple user`
    );
    res.json({ response: true, message: "filter applied", users: users });
  } catch (err) {
    console.log(err);
    res.json({ response: false, error: err.message });
  }
};

const changeSingleUserRoles = async (req, res) => {
  try {
    let { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role: role } },
      { new: true }
    );
    if (!user) {
      return res
        .status(404)
        .json({ response: false, message: "User not exist" });
    }
    historyLogRecorder(
      req,
      user.constructor.modelName,
      "UPDATE",
      user._id,
      `change user role with ${user._id}`
    );
    res.status(200).json({ response: true, message: "User data updated" });
  } catch (err) {
    console.log(err);
    res.json({ response: false, error: err.message });
  }
};

const toggleUserBanStatus = async (req, res) => {
  try {
    console.log("toggleUserBanStatus", req.session.user.email);
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ response: false, message: "User not exist" });
    }
    let msg;
    if (!user.isBanned) {
      user.isBanned = true;
      msg = "User is Banned";
    } else {
      user.isBanned = false;
      msg = "User's ban removed";
    }
    await user.save();

    historyLogRecorder(
      req,
      user.constructor.modelName,
      "UPDATE",
      user._id,
      `${msg} with ${user._id}`
    );
    res.status(200).json({ response: true, message: `${msg} successfully` });
  } catch (err) {
    console.log(err);
    res.json({ response: false, error: err.message });
  }
};

const searchUserByNameAndEmail = async (req, res) => {
  try {
    console.log("searchUserByNameAndEmail", req.session.user);
    const searchTerm = req.query.q;
    const users = await User.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ],
    });

    res.json({ users: users });
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};

const deleteUser = async (req, res) => {
  try {
    // let { role } = req.body;
    const fetchUser = await User.findByIdAndDelete(req.params.id);
    if (!fetchUser) {
      return res.status(403).json({
        response: false,
        message: "Something went wrong, user not accessible",
      });
    }
    historyLogRecorder(
      req,
      fetchUser.constructor.modelName,
      "DELETE",
      fetchUser._id,
      `Delete user with ${fetchUser._id}`
    );
    res
      .status(200)
      .json({ response: true, message: "User deleted from database" });
  } catch (err) {
    console.log(err);
    res.json({ error: "You are not admin" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    console.log("all user", req.session.user);
    const allUser = await User.find()
      .sort({ username: 1 })
      .populate("firms", "firmName")
      // .populate("kitchens", "kitchenName")
      .populate("events", "eventName");

    historyLogRecorder(
      req,
      allUser.constructor.modelName,
      "READ",
      [],
      `Read all the user`
    );
    res.status(200).json({ response: true, users: allUser });
  } catch (err) {
    console.log(err);
    res.status(400).json({ err: "You need to request again" });
  }
};

const roleBasedFilter = async (req, res) => {
  try {
    const word = req.query.word;
    if (word.length === 0) {
      const users = await User.find();
      return res.status(200).json({ response: true, users: users });
    }

    let users;
    switch (word) {
      case "user":
        users = await User.find({ role: { $in: [word] } });
        break;
      case "restaurantOwner":
        users = await User.find({ role: { $in: [word] } });
        break;
      case "kitchenOwner":
        users = await User.find({ role: { $in: [word] } });
        break;
      case "eventCreator":
        users = await User.find({ role: { $in: [word] } });
        break;
      case "moderator":
        users = await User.find({ role: { $in: [word] } });
        break;
      case "marketingPerson":
        users = await User.find({ role: { $in: [word] } });
        break;
      case "admin":
        users = await User.find({ role: { $in: [word] } });
        break;
      default:
        users = await User.find({});
    }

    historyLogRecorder(
      req,
      users.constructor.modelName,
      "READ",
      [],
      `Read all the user with ${word} role`
    );

    res.status(200).json({ response: true, users: users });
  } catch (err) {
    res.json({ response: false, error: err.message });
  }
};

const sortUser = async (req, res) => {
  try {
    const word = req.query.word;
    let users;
    switch (word) {
      case "newest":
        users = await User.find().sort({ createdAt: 1 }).limit(100);
        break;
      case "oldest":
        users = await User.find().sort({ createdAt: -1 }).limit(100);
        break;
      case "lastLogin":
        users = await User.find().sort({ lastLogin: 1 }).limit(100);
        break;
      case "alphabet":
        users = await User.aggregate([
          {
            $addFields: {
              lowerUsername: { $toLower: "$username" }, // Create a new field for case-insensitive sorting
            },
          },
          { $sort: { lowerUsername: 1 } }, // Sort by the lowercase username
          { $limit: 100 },
          { $project: { lowerUsername: 0 } }, // Remove temporary field before returning results
        ]);
        break;
      case "clear":
        users = await User.find({});
        break;
      default:
        users = await User.find({});
    }

    historyLogRecorder(
      req,
      users.constructor.modelName,
      "READ",
      [],
      `Read all the user with ${word} role`
    );

    res.status(200).json({ response: true, users: users });
  } catch (err) {
    res.json({ response: false, error: err.message });
  }
};

const bannedManyUser = async (req, res) => {
  try {
    const mode = req.query.mode;
    console.log(mode);
    const arrayIds = req.body.data;
    console.log(arrayIds);
    const updateUsers = await User.updateMany(
      { _id: { $in: [...arrayIds] } },
      { $set: { isBanned: mode === "allow" ? false : true } },
      {
        new: true,
      }
    );

    if (!updateUsers) {
      return res
        .status(404)
        .json({ response: false, messsage: "Users not found" });
    }

    historyLogRecorder(
      req,
      updateUsers.constructor.modelName,
      "DELETE",
      updateUsers.map((el) => el._id),
      `ban multiple user with respective ids`
    );

    res
      .status(201)
      .json({ response: true, message: "Users banned successfully" });
  } catch (err) {
    res.status(403).json({ response: false, error: err.message });
  }
};

const accessManyUser = async (req, res) => {
  try {
    const { arrayIds, newRole } = req.body;
    console.log({ arrayIds, newRole });
    const updateUsers = await User.updateMany(
      { _id: { $in: [...arrayIds] } },
      { $addToSet: { role: newRole } },
      {
        new: true,
      }
    );

    if (!updateUsers) {
      return res
        .status(404)
        .json({ response: false, messsage: "Users not found" });
    }

    historyLogRecorder(
      req,
      updateUsers.constructor.modelName,
      "DELETE",
      updateUsers.map((el) => el._id),
      `Add role to multiple user with respective ids`
    );

    res
      .status(201)
      .json({ response: true, message: "Users roles updated successfully" });
  } catch (err) {
    res.status(403).json({ response: false, error: err.message });
  }
};

const editUser = async (req, res) => {
  try {
    let { email, password, username, role } = req.body;
    const existUser = await User.findOne({ email: email });
    const isSame = await bcrypt.compare(password, existUser.password);

    if (!existUser || !isSame) {
      return res
        .status(401)
        .json({ message: "User email or password is wrong" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(req.params.id, {
      email,
      username,
      role,
      password: hashedPassword,
    });

    historyLogRecorder(
      req,
      updatedUser.constructor.modelName,
      "DELETE",
      updatedUser._id,
      `Edit user with ${updatedUser._id}`
    );

    res.status(200).json({
      response: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.log(err);
    res.status(403).json({ response: false, error: err.message });
  }
};

const deleteManyUser = async (req, res) => {
  try {
    const arrayIds = req.body;
    const deletedUser = await User.deleteMany(
      { _id: { $in: [...arrayIds] } },
      {
        new: true,
      }
    );

    if (!deletedUser) {
      return res
        .status(404)
        .json({ response: false, messsage: "Users not found" });
    }

    historyLogRecorder(
      req,
      deletedUser.constructor.modelName,
      "DELETE",
      deletedUser.map((el) => el._id),
      `Delete users with ${deletedUser.map((el) => el._id)}`
    );
    res
      .status(201)
      .json({ response: true, message: "Users deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(403).json({ response: false, error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res
        .status(404)
        .json({ response: false, message: "User not found" });
    }
    res.status(200).json({ response: true, message: "We go the user", user });
  } catch (err) {
    res.status(403).json({ response: false, message: err.message });
  }
};
//--------------------------------
module.exports = {
  registerUser,
  loginUser,
  changeMultiUserRoles,
  changeSingleUserRoles,
  toggleUserBanStatus,
  searchUserByNameAndEmail,
  deleteUser,
  getAllUsers,
  roleBasedFilter,
  sortUser,
  bannedManyUser,
  accessManyUser,
  editUser,
  deleteManyUser,
  getUserById,
};
