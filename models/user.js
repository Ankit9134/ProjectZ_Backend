const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const Firm = require("./Firm");
const Tiffin = require("./Tiffin");
const Event = require("./event");

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: new Date(),
    },
    firms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Firm",
      },
    ],
    kitchens: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tiffin", //we need to utilize user schema over here
      },
    ],

    events: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    role: {
      type: [String],
      default: ["user"],
      enum: [
        "user",
        "admin",
        "moderator",
        "kitchenOwner",
        "restaurantOwner",
        "eventCreator",
        "marketingPerson",
      ],
    },
    // activeRole: {
    //   type: String,
    //   enum: [
    //     "user",
    //     "admin",
    //     "moderator",
    //     "kitchenOwner",
    //     "restaurantOwner",
    //     "eventCreator",
    //     "marketingPerson",
    //   ],
    //   // required: true,
    //   default: "user",
    //   validate: {
    //     validator: function (value) {
    //       return this.role.includes(value); // Ensure activeRole is one of the roles
    //     },
    //     message: "activeRole must be one of the user's assigned roles",
    //   },
    // },
  },

  {
    timestamps: true,
  }
);

userSchema.post("findOneAndDelete", async function (req, res, next) {
  try {
    await Firm.deleteMany({ _id: { $in: [...this.firms] } });
    await Tiffin.deleteMany({ _id: { $in: [...this.kitchens] } });
    await Event.deleteMany({ _id: { $in: [...this.events] } });
    next();
  } catch (err) {
    console.log(err);
    res.staus(400).json({ response: false, message: "User data not deleted" });
  }
});

// userSchema.methods.generateJwtToken = function () {
//   return jwt.sign({ user: this._id.toString() }, "ZomatoApp");
// };

// userSchema.statics.findByEmailAndPhone = async ({ email, phoneNumber }) => {
//   //check whether user exist
//   const checkUserByEmail = await UserModel.findOne({ email });
//   // const checkUserByPhone = await UserModel.findOne({ phoneNumber });

//   if (checkUserByEmail || checkUserByPhone) {
//     throw new Error("User Already Exists");
//   }

//   return false;
// };

// userSchema.statics.findByEmailAndPassword = async ({ email, password }) => {
//   //check whether the email exists
//   const user = await UserModel.findOne({ email });
//   if (!user) throw new Error("User does not exist");

//   //compare password
//   const doesPasswordMatch = await bcrypt.compare(password, user.password);

//   if (!doesPasswordMatch) {
//     throw new Error("Invalid password");
//   }
//   return user;
// };

// userSchema.pre("save", function (next) {
//   const user = this;

//   //if password is modified
//   if (!user.isModified("password")) return next();

//   //generate bcrypt salt
//   bcrypt.genSalt(8, (error, salt) => {
//     if (error) return next(error);

//     //hash the password
//     bcrypt.hash(user.password, salt, (error, hash) => {
//       if (error) return next(error);

//       //assigning hashed password
//       user.password = hash;
//       return next();
//     });
//   });
// });

const User = model("User", userSchema);
module.exports = User;
