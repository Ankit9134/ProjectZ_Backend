// const mongoose = require("mongoose");

// const firmSchema = new mongoose.Schema(
//   {
//     restaurantInfo: {
//       name: {
//         type: String,
//         required: [true, "Firm name is required"],
//         unique: true,
//         trim: true,
//       },

//       cuisines: {
//         type: [String],
//         default: null,
//       },

//       priceRange: String,

//       price_range: String,

//       phoneNo: String,

//       website: String,

//       address: String,

//       instagram: String,

//       additionalInfo: {
//         neighbourhood: String,
//         diningStyle: String,
//         dressCode: String,
//         executiveCheif: String,
//         hoursOfOperation: String,
//         parking: String,
//         publicTransit: String,
//         paymentOptions: String,
//         additionalDetails: String,
//       },

//       overview: String,

//       category: {
//         type: [
//           {
//             type: String,
//             enum: ["veg", "non-veg"],
//           },
//         ],
//       },

//       isBookMarked: {
//         type: Boolean,
//         default: false,
//       },

//       isFlaged: {
//         type: Boolean,
//         default: false,
//       },
//       isBanned: {
//         type: Boolean,
//         default: false,
//       },

//       city: {
//         type: String,
//       },

//       area: {
//         type: String,
//       },

//       ratings: {
//         overall: {
//           type: Number,
//           min: 0,
//           max: 5,
//           default: 0,
//         },
//         food: {
//           type: Number,
//           min: 0,
//           max: 5,
//           default: 0,
//         },
//         service: {
//           type: Number,
//           min: 0,
//           max: 5,
//           default: 0,
//         },
//         ambience: {
//           type: Number,
//           min: 0,
//           max: 5,
//           default: 0,
//         },
//         value: {
//           type: Number,
//           min: 0,
//           max: 5,
//           default: 0,
//         },
//         totalReviews: {
//           type: Number,
//           default: 0,
//         },
//         noiseLevel: String,
//       },
//     },
//     termsAccepted: {
//       type: Boolean,
//       default: false,
//     },
//     termsAcceptedDate: {
//       type: Date,
//     },
//     registrationStatus: {
//       type: String,
//       enum: ["incomplete", "pending", "complete"],
//       default: "incomplete",
//     },

//     insights: [
//       {
//         name: String,
//         class: {
//           type: String,
//           // enum: ["good", "excellent", "average", "poor"],
//         },
//         category: String,
//       },
//     ],

//     opening_hours: {
//       SundaySun: String,
//       MondayMon: String,
//       TuesdayTue: String,
//       WednesdayWed: String,
//       ThursdayThu: String,
//       FridayFri: String,
//       SaturdaySat: String,
//     },

//     reviewSummary: String,

//     image_urls: [String],

//     menu_url: String,

//     menu_images: [String],

//     faqs: [
//       {
//         question: String,
//         answer: String,
//       },
//     ],

//     source_url: String,

//     menu: {
//       type: {
//         menuTabs: [
//           {
//             name: { type: String, required: true },
//             sections: [
//               {
//                 name: { type: String, required: true },
//                 description: { type: String, default: "" },
//                 items: [
//                   {
//                     type: mongoose.Schema.Types.ObjectId,
//                     ref: "MenuItem",
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//         default: {}, // Ensure menu is an object
//       },
//       default: { menuTabs: [] }, // Default to an object with an empty menuTabs array
//     },

//     features: {
//       type: [String],
//       default: [],
//       // type: mongoose.Schema.Types.ObjectId,
//       // ref: "Feature",
//     },

//     offer: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Offer",
//       },
//     ],

//     dietary: {
//       type: [
//         {
//           type: String,
//           // enum: [
//           //   "vegan",
//           //   "halal",
//           //   "glutan-free",
//           //   "vegetarian",
//           //   "dairy-free",
//           //   "nut-free",
//           // ],
//         },
//       ],
//     },

//     popularity: {
//       type: Number,
//       min: 0,
//       max: 10,
//       default: 0,
//     },

//     reviews: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Review",
//       },
//       // {
//       //   review_id: String,
//       //   score: String,
//       //   language_id: String,
//       //   author_name: String,
//       //   date: String,
//       //   rating: Number,
//       //   comments: [String],
//       //   aspects: {
//       //     food: String,
//       //     service: String,
//       //     atmosphere: String,
//       //   },
//       // },
//     ],

//     vendor: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//   },
//   {
//     timestamps: true,
//   }
// );

// const Firm = mongoose.model("Firm", firmSchema);
// module.exports = Firm;

const mongoose = require("mongoose");

const firmSchema = new mongoose.Schema(
  {
    // Add top-level fields for owner information
    ownerName: {
      type: String,
      trim: true,
    },
    ownerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    ownerPhone: {
      type: String,
      trim: true,
    },

    restaurantInfo: {
      name: {
        type: String,
        required: [true, "Firm name is required"],
        unique: true,
        trim: true,
      },

      cuisines: {
        type: [String],
        default: null,
      },

      priceRange: String,

      price_range: String,

      phoneNo: String,

      website: String,

      address: String,

      instagram: String,

      additionalInfo: {
        neighbourhood: String,
        diningStyle: String,
        dressCode: String,
        executiveCheif: String,
        hoursOfOperation: String,
        parking: String,
        publicTransit: String,
        paymentOptions: String,
        additionalDetails: String,

        // Keep these for backwards compatibility
        ownerName: String,
        ownerEmail: String,
        ownerPhone: String,
      },

      overview: String,

      category: {
        type: [
          {
            type: String,
            enum: ["veg", "non-veg"],
          },
        ],
      },

      isBookMarked: {
        type: Boolean,
        default: false,
      },

      isFlaged: {
        type: Boolean,
        default: false,
      },
      isBanned: {
        type: Boolean,
        default: false,
      },

      city: {
        type: String,
      },

      area: {
        type: String,
      },

      ratings: {
        overall: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        food: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        service: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        ambience: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        value: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        totalReviews: {
          type: Number,
          default: 0,
        },
        noiseLevel: String,
      },
    },

    termsAccepted: {
      type: Boolean,
      default: false,
    },
    termsAcceptedDate: {
      type: Date,
    },
    registrationStatus: {
      type: String,
      enum: ["incomplete", "pending", "complete"],
      default: "incomplete",
    },

    insights: [
      {
        name: String,
        class: {
          type: String,
        },
        category: String,
      },
    ],

    opening_hours: {
      SundaySun: String,
      MondayMon: String,
      TuesdayTue: String,
      WednesdayWed: String,
      ThursdayThu: String,
      FridayFri: String,
      SaturdaySat: String,
    },

    reviewSummary: String,

    image_urls: [String],

    menu_url: String,

    menu_images: [String],

    faqs: [
      {
        question: String,
        answer: String,
      },
    ],

    source_url: String,

    menu: {
      type: {
        menuTabs: [
          {
            name: { type: String, required: true },
            sections: [
              {
                name: { type: String, required: true },
                description: { type: String, default: "" },
                items: [
                  {
                    // type: mongoose.Schema.Types.ObjectId,
                    // ref: "MenuItem",
                  },
                ],
              },
            ],
          },
        ],
        default: {}, // Ensure menu is an object
      },
      default: { menuTabs: [] }, // Default to an object with an empty menuTabs array
    },

    features: {
      type: [String],
      default: [],
    },

    offer: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
      },
    ],

    dietary: {
      type: [
        {
          type: String,
        },
      ],
    },

    popularity: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    vendor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    restaurantStatus: {
      type: String,
      enum: ["Pending", "Claimed", "Unclaimed", "Revoked", "Approved"],
      default: "Pending",
    },
    newlyAdded: {
      type: Boolean,
      default: false,
    },
    // latitude: {
    //   type: Number, // Fix the invalid type
    // },

    // longitude: {
    //   type: Number, // Fix the invalid type
    // },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
  },
  {
    timestamps: true,
  }
);
const Firm = mongoose.model("Firm", firmSchema);
module.exports = Firm;
