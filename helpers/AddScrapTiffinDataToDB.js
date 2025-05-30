const connectToMongoDB = require("../config/database.config");
const Kitchen = require("../models/Tiffin");


const extractPhoneDetails = (phoneString) => {
    if (!phoneString || typeof phoneString !== "string") {
        console.error(" ERROR: Invalid phone string:", phoneString);
        return { countryCode: "", number: "", fullNumber: "" };
    }

    const phoneParts = phoneString.match(/(\+\d+)\s*(\d+)/);
    return phoneParts
        ? {
            countryCode: phoneParts[1] || "",
            number: phoneParts[2] || "",
            fullNumber: phoneString,
        }
        : { countryCode: "", number: "", fullNumber: phoneString };
};

const processInstructions = (instructions) => {
    return instructions.split("\n").map((line, index) => ({
        title: `Instruction ${index + 1}`,
        details: line.trim(),
    }));
};

const saveScrapedData = async (scrapedData) => {
    try {
        await connectToMongoDB();

        // console.log("Scraped Data:", scrapedData);

        const transformedData = scrapedData.map((data, index) => {
            console.log(`Processing Data ${index}:`, data);

            const mealTypeSet = new Set();
            Object.keys(data.Prices).forEach((key) => {
                const [mealType] = key.split(" - ");
                mealTypeSet.add(mealType);
            });

            const plans = ['1', '7', '30'].map((label) => ({
                label,
                _id: new mongoose.Types.ObjectId(),
            }));

            const mealPlansMap = {};
            plans.forEach((plan) => {
                mealPlansMap[plan.label] = plan._id.toString();
            });

            return {
                kitchenName: data.Title,
                ratings: parseFloat(data.Rating) || 0,
                // reviews: data.Reviews.length > 0 ? data.Reviews : "No reviews available",
                images: data.Images.filter((img) => img !== ""),
                ownerPhoneNo: data["Phone Number"]
                    ? extractPhoneDetails(data["Phone Number"])
                    : { countryCode: "", number: "", fullNumber: "" },
                menu: {
                    plans,
                    // plans: ['1', '7', '30'].map((plan) => ({ label: plan })),
                    mealTypes: [...mealTypeSet].map((mealType) => ({
                        mealTypeId: new mongoose.Types.ObjectId(),
                        label: mealType,
                        description: `Meal type: ${mealType}`,
                        // description: `${data["field_name"].map(el=>el)}`,
                        prices: {
                            [mealPlansMap["1"]]: parseFloat(data.Prices[`${mealType} - Trial`]?.replace("$", "") || 0),
                            [mealPlansMap["7"]]: parseFloat(data.Prices[`${mealType} - Weekly`]?.replace("$", "") || 0),
                            [mealPlansMap["30"]]: parseFloat(data.Prices[`${mealType} - Monthly`]?.replace("$", "") || 0),
                        },
                        specificPlans: ["1", "7", "30"],
                    })),
                    instructions: processInstructions(data["Terms and Conditions"] || ""),
                },
                deliveryCity: data["Delivery Cities"]?.join(", ") || "",
                category: ["veg"],
                address: data.URL,
                operatingTimes: {},
            };
        });

        await Kitchen.insertMany(transformedData);
        console.log(" Scraped data successfully saved!");
        console.log("Scraped Data:", transformedData);
        console.log(".........................................New Data Start From Hee.................................................");
    } catch (error) {
        console.error("Error saving data:", error);
    }
};



const scrapedData = [

    {
        "Title": "Leela Punjabi Veg Tiffin Service (by LAL's Kitchen)",
        "Rating": "4.4",
        "Reviews": [],
        "Prices": {
            "Basic - Trial": "$11.00",
            "Basic - Weekly": "$51.56",
            "Basic - Monthly": "$194.12",
            "Basic Plus - Trial": "$12.33",
            "Basic Plus - Weekly": "$57.81",
            "Basic Plus - Monthly": "$217.65",
            "Regular - Trial": "$13.67",
            "Regular - Weekly": "$64.06",
            "Regular - Monthly": "$241.18",
            "Premium - Trial": "$15.00",
            "Premium - Weekly": "$70.31",
            "Premium - Monthly": "$264.71",
            "Premium Rice - Trial": "$15.00",
            "Premium Rice - Weekly": "$70.31",
            "Premium Rice - Monthly": "$264.71",
            "Premium Plus - Trial": "$15.67",
            "Premium Plus - Weekly": "$73.44",
            "Premium Plus - Monthly": "$276.47",
            "Deluxe - Trial": "$17.67",
            "Deluxe - Weekly": "$82.81",
            "Deluxe - Monthly": "$311.76",
            "Only Curries 1 - Trial": "$13.67",
            "Only Curries 1 - Weekly": "$64.06",
            "Only Curries 1 - Monthly": "$241.18",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12oz) - Trial": "$5.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Curry (12oz) - Trial": "$5.00",
            "Extra Curry (12oz) - Weekly": "$25.00",
            "Extra Curry (12oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Trial": "$3.00",
            "Extra Rice (12oz) - Weekly": "$15.00",
            "Extra Rice (12oz) - Monthly": "$60.00"
        },
        "Meal Types": [
            "Basic",
            "Basic Plus",
            "Regular",
            "Premium",
            "Premium Rice",
            "Premium Plus",
            "Deluxe",
            "Only Curries 1",
            "Extra Roti",
            "Extra Veg Sabzi (12oz)",
            "Extra Curry (12oz)",
            "Extra Rice (12oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Milton",
            "Brampton",
            "Woodbridge",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York",
            "Vaughan",
            "Richmond Hill",
            "Markham",
            "Ajax",
            "Pickering",
            "Whitby",
            "Oshawa"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/leela-punjabi-tiffin-service-veg",
        "Phone Number": "+1 416-740-0066",
        "Instagram": "https://www.instagram.com/lals.kitchen/"
    },
    {
        "Title": "The Swad Pure Veg Gujarati Tiffin Service",
        "Rating": "3.8",
        "Reviews": [
            {
                "text": "Loved it!",
                "date": "02/04/2025",
                "author": "Riddhi",
                "rating": 5
            },
            {
                "text": "Loved it",
                "date": "12/20/2024",
                "author": "Brandon",
                "rating": 5
            },
            {
                "text": "Good taste",
                "date": "11/16/2024",
                "author": "M",
                "rating": 5
            },
            {
                "text": "Barfi and samosa were good. But didn\u2019t like the food much, maybe because I\u2019m a punjabi and this gujarati tiffin was not upto my taste. It was too simple and bland for me. But, I had ordered it because I wanted to experiment. So new experience, I would say.",
                "date": "11/06/2024",
                "author": "Anshuman Gupta",
                "rating": 5
            },
            {
                "text": "I stopped their service last year because the same menu was repetitive. \n\nI tried again recently and saw lot of improvement so came here and posted this.",
                "date": "11/01/2024",
                "author": "Diksha Jariwala",
                "rating": 5
            },
            {
                "text": "The tiffin stash service was par excellence especially the support post order. \n\nBut the food had no taste unfortunately it\u00e2\u0080\u0099s wasted money. \n\nNo salt , no masala and very oily. It was very bland. Basically tasteless",
                "date": "11/29/2023",
                "author": "Rohan",
                "rating": 5
            },
            {
                "text": "We started this service 4 or 5 months back. Food used to be very tasty. Lately they have screwed up with their chef or menu choices. I opted for two monthly meals. The food was very oily. 3/5 days they sent potato curries which were oily and watery. Very unappetizing! As far as I am concerned, they lost a customer who cherished home made Gujarati food. Also some of the weeks the Friday food used to be same as other days food whereas they have mentioned that Wednesday and Fridays food will be different. Anyways thumbs down for this. I give 2 only for the older times.",
                "date": "06/06/2023",
                "author": "Adi",
                "rating": 5
            },
            {
                "text": "Multiple reasons for such a bad review (Don't order):\n\nFor the tiffin provider:\n\n1. No care about the comments on the order. Asked for no rice and replacement of Paratha. Got roti and rice.\n \n2. Food's taste was even worse. No taste in Dal or Sabzi!!\n\nFor TiffinStash (Try to get robbed by some unknown vendor than by this website)\n\n1. Very late delivery\n2. Cold food\n3. Worst customer service. No contact number. No place to raise problems or get an immediate answer.",
                "date": "03/07/2023",
                "author": "Parth",
                "rating": 5
            },
            {
                "text": "Best meal that felt like home!",
                "date": "01/31/2023",
                "author": "Pallavi",
                "rating": 5
            },
            {
                "text": "My personal favorite since a year now. Being Gujarati this is a perfect homemade taste for me and makes me remind of home cooked food. I am a fussy eater and the team has always made sure to take care of my restrictions or food needs \nHighly satisfied and recommend",
                "date": "12/25/2022",
                "author": "Brinda",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$11.80",
            "Basic - Weekly": "$55.31",
            "Basic - Monthly": "$199.99",
            "Basic Kathod - Trial": "$12.60",
            "Basic Kathod - Weekly": "$59.06",
            "Basic Kathod - Monthly": "$219.99",
            "Regular - Trial": "$12.60",
            "Regular - Weekly": "$59.06",
            "Regular - Monthly": "$219.99",
            "Regular Plus - Trial": "$13.13",
            "Regular Plus - Weekly": "$61.56",
            "Regular Plus - Monthly": "$231.76",
            "Regular Kathod - Trial": "$13.67",
            "Regular Kathod - Weekly": "$64.06",
            "Regular Kathod - Monthly": "$241.18",
            "Premium - Trial": "$14.73",
            "Premium - Weekly": "$69.06",
            "Premium - Monthly": "$259.99",
            "Deluxe - Trial": "$15.80",
            "Deluxe - Weekly": "$74.06",
            "Deluxe - Monthly": "$278.82",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12oz) - Trial": "$5.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Kathod (12oz) - Trial": "$5.00",
            "Extra Kathod (12oz) - Weekly": "$25.00",
            "Extra Kathod (12oz) - Monthly": "$100.00",
            "Extra Dal (12oz) - Trial": "$5.00",
            "Extra Dal (12oz) - Weekly": "$25.00",
            "Extra Dal (12oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Trial": "$3.00",
            "Extra Rice (12oz) - Weekly": "$15.00",
            "Extra Rice (12oz) - Monthly": "$60.00"
        },
        "Meal Types": [
            "Basic",
            "Basic Kathod",
            "Regular",
            "Regular Plus",
            "Regular Kathod",
            "Premium",
            "Deluxe",
            "Extra Roti",
            "Extra Veg Sabzi (12oz)",
            "Extra Kathod (12oz)",
            "Extra Dal (12oz)",
            "Extra Rice (12oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/TheSwadPureVegGujaratiTiffinService_1024x1024@2x.png?v=1706013881",
            "https://tiffinstash.com/cdn/shop/files/THESWAD-GUJ_SWA_6fb9e70e-4ee7-4bd6-a3b0-f065948ba422_1024x1024@2x.png?v=1739149299",
            "https://tiffinstash.com/cdn/shop/files/fridayspecial_1024x1024@2x.png?v=1739149299"
        ],
        "Additional Info": "This seller offers regular Gujarati meals from Mon-Thu and special meals on Fri. They also provide Dahi-Khichadi instead of Dal-Rice on some days.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/freshchoice-gujarati-food-and-tiffin-service",
        "Phone Number": "+1 416-742-6210",
        "Instagram": "https://www.instagram.com/the.swad2022/?hl=en"
    },
    {
        "Title": "Swagat Punjabi Veg Tiffin Service (by LAL's Kitchen)",
        "Rating": "3.8",
        "Reviews": [
            {
                "text": "Thank you, the food was good in taste as well as in quantity.",
                "date": "08/01/2023",
                "author": "Piyush Sharma",
                "rating": 5
            },
            {
                "text": "\u00f0\u009f\u0091\u008d\u00f0\u009f\u008f\u00bb",
                "date": "04/25/2023",
                "author": "Nice",
                "rating": 5
            },
            {
                "text": "I was sent a type of veg when I mentioned not to send that. Please read notes by customer.\n\nAlso rotis were thick.",
                "date": "12/16/2022",
                "author": "Guri",
                "rating": 5
            },
            {
                "text": "Nice taste affordable prices. Good quantity and quality",
                "date": "05/04/2022",
                "author": "Nilesh P",
                "rating": 5
            },
            {
                "text": "Great Taste. Very affordable",
                "date": "04/05/2022",
                "author": "Kalp P",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$11.00",
            "Basic - Weekly": "$51.56",
            "Basic - Monthly": "$194.12",
            "Regular - Trial": "$12.33",
            "Regular - Weekly": "$57.81",
            "Regular - Monthly": "$217.65",
            "Premium - Trial": "$13.67",
            "Premium - Weekly": "$64.06",
            "Premium - Monthly": "$241.18",
            "Basic Rice - Trial": "$13.67",
            "Basic Rice - Weekly": "$64.06",
            "Basic Rice - Monthly": "$241.18",
            "Regular Rice - Trial": "$14.33",
            "Regular Rice - Weekly": "$67.19",
            "Regular Rice - Monthly": "$252.94",
            "Premium Rice - Trial": "$15.67",
            "Premium Rice - Weekly": "$73.44",
            "Premium Rice - Monthly": "$276.47",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (8oz) - Trial": "$4.00",
            "Extra Veg Sabzi (8oz) - Weekly": "$20.00",
            "Extra Veg Sabzi (8oz) - Monthly": "$80.00",
            "Extra Curry (8oz) - Trial": "$4.00",
            "Extra Curry (8oz) - Weekly": "$20.00",
            "Extra Curry (8oz) - Monthly": "$80.00",
            "Extra Rice (8oz) - Trial": "$2.00",
            "Extra Rice (8oz) - Weekly": "$10.00",
            "Extra Rice (8oz) - Monthly": "$40.00"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Premium",
            "Basic Rice",
            "Regular Rice",
            "Premium Rice",
            "Extra Roti",
            "Extra Veg Sabzi (8oz)",
            "Extra Curry (8oz)",
            "Extra Rice (8oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Milton",
            "Brampton",
            "Woodbridge",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York",
            "Vaughan",
            "Richmond Hill",
            "Markham",
            "Ajax",
            "Pickering",
            "Whitby",
            "Oshawa"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/swagat-tiffin-service",
        "Phone Number": "+1 437-981-0885",
        "Instagram": "https://www.instagram.com/lals.kitchen/"
    },
    {
        "Title": "Lalit Punjabi Non-Veg Tiffin Service (by LAL's Kitchen)",
        "Rating": "4.1",
        "Reviews": [
            {
                "text": "Good",
                "date": "01/10/2025",
                "author": "Yogeshwar Dayal",
                "rating": 5
            },
            {
                "text": "Loved the non veg and the curry. Didn\u2019t like the roti but overall really good service. Taking again the monthly pack (curries only)",
                "date": "01/08/2025",
                "author": "Mohammad Raiyan Islam",
                "rating": 5
            },
            {
                "text": "I have tried a lot of tiffins from this website and their gravies taste the best so far.",
                "date": "11/12/2024",
                "author": "Tanzila Mantri",
                "rating": 5
            },
            {
                "text": "Overall the tiffin was good in terms of portions and taste. \n\nHowever, both chickpeas and chicken curry had a bit too oily.",
                "date": "11/07/2024",
                "author": "PC",
                "rating": 5
            },
            {
                "text": "I ordered a trial meal and then a weekly meal amazing taste and quality of chicken dishes. Everyday was a new dish wasnt expecting this much variations of chicken. Loved it, will order again if required. Thank you \u00f0\u009f\u0098\u008a",
                "date": "10/07/2023",
                "author": "Swaneet",
                "rating": 5
            },
            {
                "text": "Subscribed to non-veg tiffin on a weekly basis. 2/5 days was good. The non-veg curry had few to almost no chicken pieces! Hit or miss in taste. I hope it gets better.",
                "date": "08/03/2023",
                "author": "Harman",
                "rating": 5
            },
            {
                "text": "It's been almost a year in search of basic decent homemade food near me. I barely liked any veg tiffin let alone non-veg. But, after trying this one I must say I like the consistency of the food quality. Their food is not very restaurant types punjabi meal, but for daily meals, this works the best for me.\nI just wish if they could deliver lunch to my workplace, but the quantity is good enough for me to eat the leftovers in lunch.",
                "date": "10/22/2022",
                "author": "Satyapal D.",
                "rating": 5
            },
            {
                "text": "I have been ordering from Tiffin Stash from last 7 months now. Great food, great taste, Great Customer Service. Much better than several tiffin services near me. \n\nPS: I wish they could deliver during lunch hours",
                "date": "07/31/2022",
                "author": "Diwakar Sharma",
                "rating": 5
            },
            {
                "text": "Opted in for the NV sabzi and dal. The taste was not good. NV curry was definitely not fresh. Will not be ordering again.",
                "date": "06/17/2022",
                "author": "Simran",
                "rating": 5
            },
            {
                "text": "I can't believe that this restaurant offer such kind of food in tiffin service.\n\nSimply the best tiffin service in terms of nonveg!\n\nI literally wait for my tiffin everyday",
                "date": "04/05/2022",
                "author": "Jamal M",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$12.33",
            "Basic - Weekly": "$57.81",
            "Basic - Monthly": "$217.65",
            "Regular - Trial": "$13.67",
            "Regular - Weekly": "$64.06",
            "Regular - Monthly": "$241.18",
            "Regular Plus - Trial": "$15.67",
            "Regular Plus - Weekly": "$73.44",
            "Regular Plus - Monthly": "$276.47",
            "Premium - Trial": "$17.67",
            "Premium - Weekly": "$82.81",
            "Premium - Monthly": "$311.76",
            "Premium Rice - Trial": "$17.67",
            "Premium Rice - Weekly": "$82.81",
            "Premium Rice - Monthly": "$311.76",
            "Premium Plus - Trial": "$18.33",
            "Premium Plus - Weekly": "$85.94",
            "Premium Plus - Monthly": "$323.53",
            "Deluxe - Trial": "$19.00",
            "Deluxe - Weekly": "$89.06",
            "Deluxe - Monthly": "$335.29",
            "Only Curries 1 - Trial": "$15.00",
            "Only Curries 1 - Weekly": "$70.31",
            "Only Curries 1 - Monthly": "$264.71",
            "Only Curries 2 - Trial": "$16.33",
            "Only Curries 2 - Weekly": "$76.56",
            "Only Curries 2 - Monthly": "$288.24",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12oz) - Trial": "$5.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Curry (12oz) - Trial": "$5.00",
            "Extra Curry (12oz) - Weekly": "$25.00",
            "Extra Curry (12oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Trial": "$3.00",
            "Extra Rice (12oz) - Weekly": "$15.00",
            "Extra Rice (12oz) - Monthly": "$60.00",
            "Extra Non-Veg Sabzi (12oz) - Trial": "$7.00",
            "Extra Non-Veg Sabzi (12oz) - Weekly": "$35.00",
            "Extra Non-Veg Sabzi (12oz) - Monthly": "$140.00"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Plus",
            "Premium",
            "Premium Rice",
            "Premium Plus",
            "Deluxe",
            "Only Curries 1",
            "Only Curries 2",
            "Extra Roti",
            "Extra Veg Sabzi (12oz)",
            "Extra Curry (12oz)",
            "Extra Rice (12oz)",
            "Extra Non-Veg Sabzi (12oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Milton",
            "Brampton",
            "Woodbridge",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York",
            "Vaughan",
            "Richmond Hill",
            "Markham",
            "Ajax",
            "Pickering",
            "Whitby",
            "Oshawa"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "N/A",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/lalit-punjabi-tiffin-service-nonveg",
        "Phone Number": "+1 416-740-0066",
        "Instagram": "https://www.instagram.com/lals.kitchen/"
    },
    {
        "Title": "The Swad Pure Swaminarayan Gujarati Tiffin Service",
        "Rating": "3.7",
        "Reviews": [
            {
                "text": "Excellent food. I was trying with some other options too but this was the best one. Pure authentic gujarati home made taste.",
                "date": "10/11/2024",
                "author": "M Patel",
                "rating": 5
            },
            {
                "text": "Super yummy and amazing food .. great taste.. good quantity. Thanks!!",
                "date": "09/26/2024",
                "author": "Anmol",
                "rating": 5
            },
            {
                "text": "I have ordered Swaminarayan tiffin from here. The food tasted very good. It was delicious, hygienic and homelike (less oily). I would order from here again. Portion size can be improved.",
                "date": "07/12/2024",
                "author": "Preya Dave",
                "rating": 5
            },
            {
                "text": "Small portions",
                "date": "10/12/2023",
                "author": "S",
                "rating": 5
            },
            {
                "text": "For two days they sent half cooked chana and chole\nThe daal and kadhi were watery . \nNever paid for such terrible food \nOne day the sweet was stale. \nAvoid them \u00e2\u0080\u00a6",
                "date": "03/31/2023",
                "author": "Sanat",
                "rating": 5
            },
            {
                "text": "I ordered food from here but there was too much salt in the dish.\nWasn't a good experience",
                "date": "09/01/2022",
                "author": "Suneeta Tiwari",
                "rating": 5
            },
            {
                "text": "I ordered a trial tiffin today, and really enjoyed the taste of the mixed vegetable, dal, dhokla, rice and chapatis. My only suggestion is please dont make the dal too watery, it has a lovely flavour but because too much water was added to it, the flavour got diluted. Dhokla was yummy but wish there was chutney to dip it in. Overall I enjoyed the food, tastes like home. Portion size is perfect. Thank you so much.",
                "date": "08/13/2022",
                "author": "Sharon Vaz",
                "rating": 5
            },
            {
                "text": "I tried this for a week and absolutely loved the kadhi chana menu and sev usal on wednesday. I'd say this is one of the top 3 gujarati tiffin in north york so far I have tried. Keep up Guys!",
                "date": "07/30/2022",
                "author": "Disha P.",
                "rating": 5
            },
            {
                "text": "Its amazing food. All day menu are amazing and quantity is more than enough. I love this food.",
                "date": "06/09/2022",
                "author": "Trupti Patel",
                "rating": 5
            },
            {
                "text": "Thank you for serving swaminarayan food, you have made my life so easy",
                "date": "03/14/2022",
                "author": "Vedant P",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$11.80",
            "Basic - Weekly": "$55.31",
            "Basic - Monthly": "$199.99",
            "Basic Kathod - Trial": "$12.60",
            "Basic Kathod - Weekly": "$59.06",
            "Basic Kathod - Monthly": "$219.99",
            "Regular - Trial": "$12.60",
            "Regular - Weekly": "$59.06",
            "Regular - Monthly": "$219.99",
            "Regular Plus - Trial": "$13.13",
            "Regular Plus - Weekly": "$61.56",
            "Regular Plus - Monthly": "$231.76",
            "Regular Kathod - Trial": "$13.67",
            "Regular Kathod - Weekly": "$64.06",
            "Regular Kathod - Monthly": "$241.18",
            "Premium - Trial": "$14.73",
            "Premium - Weekly": "$69.06",
            "Premium - Monthly": "$259.99",
            "Deluxe - Trial": "$15.80",
            "Deluxe - Weekly": "$74.06",
            "Deluxe - Monthly": "$278.82",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12oz) - Trial": "$5.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Kathod (12 oz) - Trial": "$5.00",
            "Extra Kathod (12 oz) - Weekly": "$25.00",
            "Extra Kathod (12 oz) - Monthly": "$100.00",
            "Extra Dal (12oz) - Trial": "$5.00",
            "Extra Dal (12oz) - Weekly": "$25.00",
            "Extra Dal (12oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Trial": "$3.00",
            "Extra Rice (12oz) - Weekly": "$15.00",
            "Extra Rice (12oz) - Monthly": "$60.00"
        },
        "Meal Types": [
            "Basic",
            "Basic Kathod",
            "Regular",
            "Regular Plus",
            "Regular Kathod",
            "Premium",
            "Deluxe",
            "Extra Roti",
            "Extra Veg Sabzi (12oz)",
            "Extra Kathod (12 oz)",
            "Extra Dal (12oz)",
            "Extra Rice (12oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/TheSwadPureVegGujaratiTiffinService_1024x1024@2x.png?v=1706013881",
            "https://tiffinstash.com/cdn/shop/files/THESWAD-GUJ_SWA_6fb9e70e-4ee7-4bd6-a3b0-f065948ba422_1024x1024@2x.png?v=1739149299",
            "https://tiffinstash.com/cdn/shop/files/fridayspecial_1024x1024@2x.png?v=1739149299"
        ],
        "Additional Info": "Swaminarayan -&nbsp;",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/freshchoice-swaminarayan-gujarati-tiffin-services",
        "Phone Number": "+1 416-742-6210",
        "Instagram": "https://www.instagram.com/swad.tiffin/?hl=en"
    },
    {
        "Title": "LAL's Kitchen Punjabi Veg & Non-Veg Combo Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "The food was delicious and not very overwhelming for my stomach to digest. I would recommend it to everyone trying out different tiffin services.",
                "date": "04/26/2023",
                "author": "Bobby",
                "rating": 5
            },
            {
                "text": "Firstly, it's not easy to get a good non-veg tiffin in toronto. These guys are consistently good in the quality and taste. I have been ordering this and the veg and non-veg combo tiffin for the last 4 months alternatively. This one is consistently good in taste including the dal they give.",
                "date": "09/23/2022",
                "author": "Govind Mishra",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic Combo - Weekly": "$57.81",
            "Basic Combo - Monthly": "$217.65",
            "Basic Plus Combo - Weekly": "$60.31",
            "Basic Plus Combo - Monthly": "$227.06",
            "Regular Combo - Weekly": "$67.81",
            "Regular Combo - Monthly": "$255.29",
            "Premium Combo - Weekly": "$75.31",
            "Premium Combo - Monthly": "$283.53",
            "Premium Rice Combo - Weekly": "$75.31",
            "Premium Rice Combo - Monthly": "$283.53",
            "Premium Plus Combo - Weekly": "$78.44",
            "Premium Plus Combo - Monthly": "$295.29",
            "Deluxe Combo - Weekly": "$85.31",
            "Deluxe Combo - Monthly": "$321.18",
            "Only Curries 1 - Weekly": "$66.56",
            "Only Curries 1 - Monthly": "$250.59",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Rice (12oz) - Weekly": "$15.00",
            "Extra Rice (12oz) - Monthly": "$60.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Non-Veg Sabzi (12oz) - Weekly": "$35.00",
            "Extra Non-Veg Sabzi (12oz) - Monthly": "$140.00",
            "Extra Curry (12oz) - Weekly": "$25.00",
            "Extra Curry (12oz) - Monthly": "$100.00"
        },
        "Meal Types": [
            "Basic Combo",
            "Basic Plus Combo",
            "Regular Combo",
            "Premium Combo",
            "Premium Rice Combo",
            "Premium Plus Combo",
            "Deluxe Combo",
            "Only Curries 1",
            "Extra Roti",
            "Extra Rice (12oz)",
            "Extra Veg Sabzi (12oz)",
            "Extra Non-Veg Sabzi (12oz)",
            "Extra Curry (12oz)"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Milton",
            "Brampton",
            "Woodbridge",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York",
            "Vaughan",
            "Richmond Hill",
            "Markham",
            "Ajax",
            "Pickering",
            "Whitby",
            "Oshawa"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "Meal Type&nbsp;",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/lal-kitchens-punjabi-veg-non-veg-tiffin-service",
        "Phone Number": "+1 416-740-0066",
        "Instagram": "https://www.instagram.com/lals.kitchen/"
    },
    {
        "Title": "Tiffin Pros Pure Veg Punjabi Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Good Service and meal",
                "date": "01/23/2025",
                "author": "Satyam Pandya",
                "rating": 5
            },
            {
                "text": "Delicious food , highly recommended, though a little expensive . Wish they would give some discount to those wanting to continue monthly service .",
                "date": "11/28/2024",
                "author": "Girish Arora",
                "rating": 5
            },
            {
                "text": "Awesome food. Loved it. Home-like, yet restaurant-like. Simple, yet yummy.",
                "date": "11/20/2024",
                "author": "Anshuman Gupta",
                "rating": 5
            },
            {
                "text": "Great taste, bit spicy but i like spicy food, good qty. And the rotis are really big and softer. I dont order everyday but more like one or two weeks in a month. its sufficient for me and my roommate.",
                "date": "02/24/2024",
                "author": "Nimrit kaur",
                "rating": 5
            },
            {
                "text": "I like homely variety with karela, aloo methi etc just like home.",
                "date": "09/28/2023",
                "author": "KJ",
                "rating": 5
            },
            {
                "text": "I have been ordering from here for the last 7 months and never bored of their food. Reminds me of food back home for sure. The spice level is medium so not that hot or bland. My favourite subzis from them are gajar mix veg, gobhi and kadhi pakoda. Ofcours Shahi paneer tops the list. Their quantity is more than I can finish even after I have it two times.",
                "date": "01/30/2023",
                "author": "Reetu M",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$12.33",
            "Basic - Weekly": "$57.81",
            "Basic - Monthly": "$217.65",
            "Premium - Trial": "$15.67",
            "Premium - Weekly": "$73.44",
            "Premium - Monthly": "$276.47",
            "Premium Rice - Trial": "$15.67",
            "Premium Rice - Weekly": "$73.44",
            "Premium Rice - Monthly": "$276.47",
            "Deluxe - Trial": "$16.33",
            "Deluxe - Weekly": "$76.56",
            "Deluxe - Monthly": "$288.24",
            "Basic Plus - Trial": "$13.67",
            "Basic Plus - Weekly": "$64.06",
            "Basic Plus - Monthly": "$241.18",
            "Premium Plus - Trial": "$17.67",
            "Premium Plus - Weekly": "$82.81",
            "Premium Plus - Monthly": "$311.76",
            "Premium Rice Plus - Trial": "$17.67",
            "Premium Rice Plus - Weekly": "$82.81",
            "Premium Rice Plus - Monthly": "$311.76",
            "Deluxe Plus - Trial": "$19.00",
            "Deluxe Plus - Weekly": "$89.06",
            "Deluxe Plus - Monthly": "$335.29",
            "Only Curries - Trial": "$14.99",
            "Only Curries - Weekly": "$70.39",
            "Only Curries - Monthly": "$264.71",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12oz) - Trial": "$5.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Curry (12oz) - Trial": "$5.00",
            "Extra Curry (12oz) - Weekly": "$25.00",
            "Extra Curry (12oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Trial": "$5.00",
            "Extra Rice (12oz) - Weekly": "$25.00",
            "Extra Rice (12oz) - Monthly": "$100.00",
            "Extra Veg Sabzi (8oz) - Trial": "$4.00",
            "Extra Veg Sabzi (8oz) - Weekly": "$20.00",
            "Extra Veg Sabzi (8oz) - Monthly": "$80.00",
            "Extra Curry (8oz) - Trial": "$4.00",
            "Extra Curry (8oz) - Weekly": "$20.00",
            "Extra Curry (8oz) - Monthly": "$80.00",
            "Extra Rice (8oz) - Trial": "$4.00",
            "Extra Rice (8oz) - Weekly": "$20.00",
            "Extra Rice (8oz) - Monthly": "$80.00"
        },
        "Meal Types": [
            "Basic",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Basic Plus",
            "Premium Plus",
            "Premium Rice Plus",
            "Deluxe Plus",
            "Only Curries",
            "Extra Roti",
            "Extra Veg Sabzi (12oz)",
            "Extra Curry (12oz)",
            "Extra Rice (12oz)",
            "Extra Veg Sabzi (8oz)",
            "Extra Curry (8oz)",
            "Extra Rice (8oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/TiffinProsPureVegPunjabiTiffinService_1024x1024@2x.png?v=1706014736",
            "https://tiffinstash.com/cdn/shop/files/TPVEG_74ae9e2a-d6cb-4878-aac5-b83de1388160_1024x1024@2x.png?v=1739149253"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/tiffinpros-home-style-premium-punjabi-food",
        "Phone Number": "+1 437-430-9990",
        "Instagram": "https://www.instagram.com/tiffinpros/"
    },
    {
        "Title": "The Swad Pure Veg Marathi Tiffin Service",
        "Rating": "3.3",
        "Reviews": [
            {
                "text": "Delicious meal",
                "date": "11/28/2024",
                "author": "Marie Grant",
                "rating": 5
            },
            {
                "text": "PROS: \n\n-excellent taste, well cooked food\n-great for the price\n-okay delivery timings\n\nCONS:\n\n-too much artificial color\n-EXTREMELY oily.",
                "date": "10/18/2023",
                "author": "HRS",
                "rating": 5
            },
            {
                "text": "I have tried several tiffins on and off this website and no other tiffin has come close to the quality of Swad. The tiffin is a perfect balance of spice and literally is similar to the quality of food I would expect back home",
                "date": "05/25/2023",
                "author": "JT",
                "rating": 5
            },
            {
                "text": "You would know that \"You get what you pay for\". This tiffin service is worse than that! My first day of tiffin came in, completely leaking in the plastic. The containers were packed in a sideways orientation; half of my meal would leak out and go to waste due to that. \nDespite being cheaper than other tiffin services, they skim in many places. All the \"sabzis\" and dals are very watery, and either taste bland or sweet for the most part. \nThe Wednesday street food special is a joke. It has fewer portions than most and tastes nowhere near what a street food item tastes like.\n\nI 100% DO NOT recommend this place.\n\nTLDR; Bland or sweet taste in all the dals and sabzis. Food going to waste due to leaks from the containers being oriented sideways when handed over. \nStreet food special has nothing special about it\u00e2\u0080\u0094the same old food with fewer portions.\nI 100% DO NOT recommend it.",
                "date": "05/04/2023",
                "author": "Gaurav",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$11.80",
            "Basic - Weekly": "$55.31",
            "Basic - Monthly": "$199.99",
            "Regular - Trial": "$12.60",
            "Regular - Weekly": "$59.06",
            "Regular - Monthly": "$219.99",
            "Premium - Trial": "$14.73",
            "Premium - Weekly": "$69.06",
            "Premium - Monthly": "$259.99",
            "Deluxe - Trial": "$15.80",
            "Deluxe - Weekly": "$74.06",
            "Deluxe - Monthly": "$278.82",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12oz) - Trial": "$5.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Dal (12oz) - Trial": "$5.00",
            "Extra Dal (12oz) - Weekly": "$25.00",
            "Extra Dal (12oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Trial": "$3.00",
            "Extra Rice (12oz) - Weekly": "$15.00",
            "Extra Rice (12oz) - Monthly": "$60.00"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Premium",
            "Deluxe",
            "Extra Roti",
            "Extra Veg Sabzi (12oz)",
            "Extra Dal (12oz)",
            "Extra Rice (12oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/TheSwadPureVegMarathiTiffinService_1024x1024@2x.png?v=1706014029",
            "https://tiffinstash.com/cdn/shop/files/fridayspecial_ff78a473-92bc-4512-b3d4-7a6bfa9b7ece_1024x1024@2x.png?v=1724007212"
        ],
        "Additional Info": "This seller offers regular&nbsp;Marathi meals from Mon-Thu and special meals on Fri.&nbsp;They will provide Marathi subzi and dal/kadhi in the menu",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/swad-marathi-tiffin-service",
        "Phone Number": "+1 416-742-6210",
        "Instagram": "https://www.instagram.com/the.swad2022/?hl=en"
    },
    {
        "Title": "Tulsi Indian Pure Veg Gujarati Tiffin Service",
        "Rating": "4.2",
        "Reviews": [
            {
                "text": "Tiffin service is good but please improve in timeslots for someone who eats dinner there should be a different time for delivery. \nTulsi is kinda expensive for a student like me.",
                "date": "11/05/2024",
                "author": "Chinmay",
                "rating": 5
            },
            {
                "text": "Really good Gujarati food especially dal.",
                "date": "10/17/2024",
                "author": "Falgun",
                "rating": 5
            },
            {
                "text": "I really like this food",
                "date": "05/14/2023",
                "author": "Harnil",
                "rating": 5
            },
            {
                "text": "Repetitive food same day each week, no variety.",
                "date": "02/15/2023",
                "author": "Miheer",
                "rating": 5
            },
            {
                "text": "Its good taste. Good quality for a gujarati tiffin.",
                "date": "02/14/2023",
                "author": "Kashaf",
                "rating": 5
            }
        ],
        "Prices": {
            "Student Special - Trial": "$13.00",
            "Student Special - Weekly (4 Days)": "$48.75",
            "Student Special - Monthly (16 Days)": "$183.53",
            "Regular - Trial": "$15.33",
            "Regular - Weekly (4 Days)": "$57.50",
            "Regular - Monthly (16 Days)": "$216.47",
            "Premium - Trial": "$19.00",
            "Premium - Weekly (4 Days)": "$71.25",
            "Premium - Monthly (16 Days)": "$268.24"
        },
        "Meal Types": [
            "Student Special",
            "Regular",
            "Premium"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly (4 Days)",
            "Monthly (16 Days)"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "East York",
            "Scarborough"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "This seller offers Dahi-Khichadi some days instead of&nbsp;Dal-Rice",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/tulsi-indian-gujarati-tiffin-service",
        "Phone Number": "+1 416-798-0400",
        "Instagram": "https://www.instagram.com/gluttony_person/reel/C7oxSJcxFLN/"
    },
    {
        "Title": "Shriji Catering & Premium Pure Veg Gujarati Tiffin Service",
        "Rating": "3.8",
        "Reviews": [
            {
                "text": "Excellent",
                "date": "12/13/2024",
                "author": "NIDHI",
                "rating": 5
            },
            {
                "text": "Good Gujarati style food.",
                "date": "10/17/2024",
                "author": "Hrishikesh Gupte",
                "rating": 5
            },
            {
                "text": "Taste like home",
                "date": "09/25/2024",
                "author": "Keyur Jani",
                "rating": 5
            },
            {
                "text": "I took intially Trial of tiffin. Roti- good, Daal and Sabzi -Watery and no taste. Still went ahead and booked for Month. They said somedays they might not be delivering due to construction in their house. Now one day they informed me , next day they didn't and third day they said the person is sick. Saturday they stopped responding to message. no Tiffin delivered. I asked for Refund as it's inconsistent and i am moving as well. The person denied refunding plus said i am Liar and shouted on me to which i also did. Basically Didn't wanted to refund.",
                "date": "06/10/2024",
                "author": "Harry Mahadik",
                "rating": 5
            },
            {
                "text": "Delicious Taste: The food is absolutely delicious! Shriji Catering delivers authentic Gujarati cuisine with fresh ingredients and perfectly balanced flavors. Each bite took me back to home-cooked meals.\n\nVariety: The menu offers a good variety of dishes throughout the week, ensuring you won't get bored. Every tiffin included a satisfying mix of vegetables, dals (lentils), and a main course, leaving me feeling full and happy.",
                "date": "03/27/2024",
                "author": "Nilesh",
                "rating": 5
            },
            {
                "text": ". Little expensive but great quality good and great taste.",
                "date": "03/27/2024",
                "author": "Keyur Jani",
                "rating": 5
            },
            {
                "text": "Nice",
                "date": "03/01/2024",
                "author": "Komal",
                "rating": 5
            },
            {
                "text": "Could improve a lot, the sabzi was too oily and spicy for my taste. Not like home if that's what you're looking for ! Above all it's the costliest Tiffin I've ever had they deliver just 4 days and it was sub-par at most. Would work if you wanna have outside Gujarati food once or twice a month",
                "date": "02/28/2024",
                "author": "Smit",
                "rating": 5
            },
            {
                "text": "Best Gujarati Tiffin",
                "date": "02/02/2024",
                "author": "Jay",
                "rating": 5
            },
            {
                "text": "The food taste was excellent but the water from dal and sabzi was leaking. Need to upgrade the packaging up to delivery standards.",
                "date": "01/18/2024",
                "author": "Hiten",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$15.00",
            "Basic - Weekly (4 Days)": "$56.25",
            "Basic - Monthly (16 Days)": "$211.76",
            "Regular - Trial": "$15.00",
            "Regular - Weekly (4 Days)": "$56.25",
            "Regular - Monthly (16 Days)": "$211.76",
            "Premium - Trial": "$16.99",
            "Premium - Weekly (4 Days)": "$66.25",
            "Premium - Monthly (16 Days)": "$249.41",
            "Deluxe - Trial": "$21.00",
            "Deluxe - Weekly (4 Days)": "$78.75",
            "Deluxe - Monthly (16 Days)": "$296.47",
            "Supreme - Trial": "$23.00",
            "Supreme - Weekly (4 Days)": "$86.25",
            "Supreme - Monthly (16 Days)": "$324.71",
            "Extra Roti - Trial": "$1.20",
            "Extra Roti - Weekly (4 Days)": "$4.80",
            "Extra Roti - Monthly (16 Days)": "$19.20",
            "Extra Veg Sabzi (8oz) - Trial": "$5.19",
            "Extra Veg Sabzi (8oz) - Weekly (4 Days)": "$20.75",
            "Extra Veg Sabzi (8oz) - Monthly (16 Days)": "$82.99",
            "Extra Veg Sabzi (12oz) - Trial": "$6.52",
            "Extra Veg Sabzi (12oz) - Weekly (4 Days)": "$26.08",
            "Extra Veg Sabzi (12oz) - Monthly (16 Days)": "$104.32",
            "Extra Dal (8oz) - Trial": "$2.65",
            "Extra Dal (8oz) - Weekly (4 Days)": "$10.61",
            "Extra Dal (8oz) - Monthly (16 Days)": "$42.45",
            "Extra Dal (12oz) - Trial": "$3.99",
            "Extra Dal (12oz) - Weekly (4 Days)": "$15.95",
            "Extra Dal (12oz) - Monthly (16 Days)": "$63.79",
            "Extra Rice (12oz) - Trial": "$3.32",
            "Extra Rice (12oz) - Weekly (4 Days)": "$13.28",
            "Extra Rice (12oz) - Monthly (16 Days)": "$53.12",
            "Extra Kathod (8oz) - Trial": "$4.65",
            "Extra Kathod (8oz) - Weekly (4 Days)": "$18.61",
            "Extra Kathod (8oz) - Monthly (16 Days)": "$74.45"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Premium",
            "Deluxe",
            "Supreme",
            "Extra Roti",
            "Extra Veg Sabzi (8oz)",
            "Extra Veg Sabzi (12oz)",
            "Extra Dal (8oz)",
            "Extra Dal (12oz)",
            "Extra Rice (12oz)",
            "Extra Kathod (8oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly (4 Days)",
            "Monthly (16 Days)"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "East York",
            "Scarborough"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "Meal Type",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/shriji-gujarati-tiffin-service",
        "Phone Number": "+1 905-451-4050",
        "Instagram": "https://www.instagram.com/tiffinstash/p/CvF66YChaXO/"
    },
    {
        "Title": "India's Flavour Veg Tiffin Service",
        "Rating": "4.8",
        "Reviews": [
            {
                "text": "Best Service!! Customer support is sooo goood in resolving things. And this vendor is most consistent in quality and variation. love the Friday specials. Some dishes may need some improvement however over all its still a 5 star rating for me. great going guys thank you!",
                "date": "01/31/2025",
                "author": "Rahul Sharma",
                "rating": 5
            },
            {
                "text": "Good",
                "date": "01/23/2025",
                "author": "Srinal",
                "rating": 5
            },
            {
                "text": "It was excellent. Tasted like home cooked food. Not too oily or spicy. Also, way better - both in price & taste than getting food delivery done through UberEats or Doordash! Highly recommend it to anyone looking home cooked vegetarian meals.",
                "date": "10/08/2024",
                "author": "Saurabh",
                "rating": 5
            },
            {
                "text": "Good food",
                "date": "09/04/2024",
                "author": "Haj",
                "rating": 5
            },
            {
                "text": "nice",
                "date": "08/08/2024",
                "author": "Bikas",
                "rating": 5
            },
            {
                "text": "I moved from Scarborough to Oakville due to my job change. I am regular customer of India's flavour. I checked with them and they said they don't deliver here but tiffinstash does. I am able to order from them through tiffinstash and that too same price what I used to get from them. Great job to deliver their food and all such tiffin sellers food to us.",
                "date": "07/09/2024",
                "author": "Deepak Shivhare",
                "rating": 5
            },
            {
                "text": "Poor food and portions. I ordered the deluxe rice package which is supposed to have 16oz rice, 16 oz curry, 16 oz vegetable and 6 rotis. It was the friday special so they delivered keema pav instead. The keema had floating oil, was decent in taste and a large portion. The ingredients were sub-par and not fresh. Taste was decent but the portions were highly disproportionate. I got 6 unbaked pav breads for the meal which was not enough carb portions to what i ordered. Overall, I'm happy that i tried the trial meal before ordering regular tiffin from them. would not recommend unless you have no other options.",
                "date": "06/17/2024",
                "author": "Rajag Sawanni",
                "rating": 5
            },
            {
                "text": "So, I checked with india flav, they said they could not deliver to me in brampton, but told me tiffinstash can deliver. I tried the India Flavour food and It was amazing. Great food and everything was in absolute right proportion. tiffinstash is doing great job to get these vendors food to us.",
                "date": "04/18/2024",
                "author": "Ishita J",
                "rating": 5
            },
            {
                "text": "Excellent Quality. Fresh. Home style Indian Tiffin. Best in Toronto.",
                "date": "04/02/2024",
                "author": "Ganesh Prasad",
                "rating": 5
            },
            {
                "text": "best quality , amazing taste and truly value for money.",
                "date": "02/28/2024",
                "author": "payal rastogi",
                "rating": 5
            }
        ],
        "Prices": {
            "Regular - Trial": "$15.00",
            "Regular - Weekly": "$70.31",
            "Regular - Monthly": "$264.71",
            "Regular Rice - Trial": "$15.00",
            "Regular Rice - Weekly": "$70.31",
            "Regular Rice - Monthly": "$264.71",
            "Premium - Trial": "$16.33",
            "Premium - Weekly": "$76.56",
            "Premium - Monthly": "$288.24",
            "Premium Rice - Trial": "$16.33",
            "Premium Rice - Weekly": "$76.56",
            "Premium Rice - Monthly": "$288.24",
            "Deluxe - Trial": "$19.00",
            "Deluxe - Weekly": "$89.06",
            "Deluxe - Monthly": "$335.29",
            "Deluxe Rice - Trial": "$19.00",
            "Deluxe Rice - Weekly": "$89.06",
            "Deluxe Rice - Monthly": "$335.29",
            "Add-On Pickle (01 oz) - Trial": "$1.11",
            "Add-On Pickle (01 oz) - Weekly": "$5.53",
            "Add-On Pickle (01 oz) - Monthly": "$22.12",
            "Add-On Raita (04 oz) - Trial": "$1.55",
            "Add-On Raita (04 oz) - Weekly": "$7.74",
            "Add-On Raita (04 oz) - Monthly": "$30.97",
            "Add-On Raita (08 oz) - Trial": "$2.65",
            "Add-On Raita (08 oz) - Weekly": "$13.27",
            "Add-On Raita (08 oz) - Monthly": "$53.10",
            "Add-On Gulab Jamun (2 Pc) - Trial": "$2.65",
            "Add-On Gulab Jamun (2 Pc) - Weekly": "$13.27",
            "Add-On Gulab Jamun (2 Pc) - Monthly": "$53.10",
            "Add-On Garden Green Salad - Trial": "$4.42",
            "Add-On Garden Green Salad - Weekly": "$22.12",
            "Add-On Garden Green Salad - Monthly": "$88.50",
            "Add-On Grilled Soya Chaap - Trial": "$4.87",
            "Add-On Grilled Soya Chaap - Weekly": "$24.34",
            "Add-On Grilled Soya Chaap - Monthly": "$97.35",
            "Add-On Grilled Paneer - Trial": "$6.64",
            "Add-On Grilled Paneer - Weekly": "$33.19",
            "Add-On Grilled Paneer - Monthly": "$132.74",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (08 oz) - Trial": "$4.00",
            "Extra Veg Sabzi (08 oz) - Weekly": "$20.00",
            "Extra Veg Sabzi (08 oz) - Monthly": "$80.00",
            "Extra Veg Sabzi (12 oz) - Trial": "$7.00",
            "Extra Veg Sabzi (12 oz) - Weekly": "$35.00",
            "Extra Veg Sabzi (12 oz) - Monthly": "$140.00",
            "Extra Veg Sabzi (16 oz) - Trial": "$9.00",
            "Extra Veg Sabzi (16 oz) - Weekly": "$45.00",
            "Extra Veg Sabzi (16 oz) - Monthly": "$180.00",
            "Extra Curry (08 oz) - Trial": "$2.00",
            "Extra Curry (08 oz) - Weekly": "$10.00",
            "Extra Curry (08 oz) - Monthly": "$20.00",
            "Extra Curry (12 oz) - Trial": "$3.00",
            "Extra Curry (12 oz) - Weekly": "$15.00",
            "Extra Curry (12 oz) - Monthly": "$60.00",
            "Extra Curry (16 oz) - Trial": "$5.00",
            "Extra Curry (16 oz) - Weekly": "$25.00",
            "Extra Curry (16 oz) - Monthly": "$100.00",
            "Extra Rice (12 oz) - Trial": "$2.00",
            "Extra Rice (12 oz) - Weekly": "$10.00",
            "Extra Rice (12 oz) - Monthly": "$40.00",
            "Extra Rice (16 oz) - Trial": "$3.00",
            "Extra Rice (16 oz) - Weekly": "$15.00",
            "Extra Rice (16 oz) - Monthly": "$60.00"
        },
        "Meal Types": [
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice",
            "Add-On Pickle (01 oz)",
            "Add-On Raita (04 oz)",
            "Add-On Raita (08 oz)",
            "Add-On Gulab Jamun (2 Pc)",
            "Add-On Garden Green Salad",
            "Add-On Grilled Soya Chaap",
            "Add-On Grilled Paneer",
            "Extra Roti",
            "Extra Veg Sabzi (08 oz)",
            "Extra Veg Sabzi (12 oz)",
            "Extra Veg Sabzi (16 oz)",
            "Extra Curry (08 oz)",
            "Extra Curry (12 oz)",
            "Extra Curry (16 oz)",
            "Extra Rice (12 oz)",
            "Extra Rice (16 oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/FoodEXPremiumVegTiffinService_ecf1cbff-f843-45fe-af9d-bc17665a1ba1_1024x1024@2x.png?v=1726866192",
            "https://tiffinstash.com/cdn/shop/files/IFVEG_45049802-9f30-4e2c-a4eb-1181d664c7a8_1024x1024@2x.png?v=1738971403",
            "https://tiffinstash.com/cdn/shop/files/indiasflavourmixmenu_38afb7a0-b628-4337-917f-7a4514f22ec6_1024x1024@2x.png?v=1738971403"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/indiasflavour-veg-tiffin-service",
        "Phone Number": "+1 437-430-9990",
        "Instagram": "https://www.instagram.com/angeethi_catering/"
    },
    {
        "Title": "India's Flavour Mixed (Veg and Non-Veg) Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Delicious meal!",
                "date": "12/04/2024",
                "author": "Ashish Vivek",
                "rating": 5
            },
            {
                "text": "Love the food. You can make out the food is freshly cooked and they use highest quality ingredients and masalas. So nice to have Indias Flavour as one of the offering by Tiffin Stash.",
                "date": "05/03/2024",
                "author": "Daraspreet",
                "rating": 5
            }
        ],
        "Prices": {
            "Regular - Trial": "$15.00",
            "Regular - Weekly": "$70.31",
            "Regular - Monthly": "$264.71",
            "Regular Rice - Trial": "$15.00",
            "Regular Rice - Weekly": "$70.31",
            "Regular Rice - Monthly": "$264.71",
            "Premium - Trial": "$16.33",
            "Premium - Weekly": "$76.56",
            "Premium - Monthly": "$288.24",
            "Premium Rice - Trial": "$16.33",
            "Premium Rice - Weekly": "$76.56",
            "Premium Rice - Monthly": "$288.24",
            "Deluxe - Trial": "$19.00",
            "Deluxe - Weekly": "$89.06",
            "Deluxe - Monthly": "$335.29",
            "Deluxe Rice - Trial": "$19.00",
            "Deluxe Rice - Weekly": "$89.06",
            "Deluxe Rice - Monthly": "$335.29",
            "Add-On Pickle (01 oz) - Trial": "$1.11",
            "Add-On Pickle (01 oz) - Weekly": "$5.53",
            "Add-On Pickle (01 oz) - Monthly": "$22.12",
            "Add-On Raita (04 oz) - Trial": "$1.55",
            "Add-On Raita (04 oz) - Weekly": "$7.74",
            "Add-On Raita (04 oz) - Monthly": "$30.97",
            "Add-On Raita (08 oz) - Trial": "$2.65",
            "Add-On Raita (08 oz) - Weekly": "$13.27",
            "Add-On Raita (08 oz) - Monthly": "$53.10",
            "Add-On Gulab Jamun (2 Pc) - Trial": "$2.65",
            "Add-On Gulab Jamun (2 Pc) - Weekly": "$13.27",
            "Add-On Gulab Jamun (2 Pc) - Monthly": "$53.10",
            "Add-On Garden Green Salad - Trial": "$4.42",
            "Add-On Garden Green Salad - Weekly": "$22.12",
            "Add-On Garden Green Salad - Monthly": "$88.50",
            "Add-On Grilled Soya Chaap - Trial": "$4.87",
            "Add-On Grilled Soya Chaap - Weekly": "$24.34",
            "Add-On Grilled Soya Chaap - Monthly": "$97.35",
            "Add-On Grilled Paneer - Trial": "$6.64",
            "Add-On Grilled Paneer - Weekly": "$33.19",
            "Add-On Grilled Paneer - Monthly": "$132.74",
            "Add-On Boiled Eggs (2 Pc) - Trial": "$2.65",
            "Add-On Boiled Eggs (2 Pc) - Weekly": "$13.27",
            "Add-On Boiled Eggs (2 Pc) - Monthly": "$53.10",
            "Add-On Chicken Boneless Leg - Trial": "$6.19",
            "Add-On Chicken Boneless Leg - Weekly": "$30.97",
            "Add-On Chicken Boneless Leg - Monthly": "$123.89",
            "Add-On Chicken Boneless Breast - Trial": "$6.64",
            "Add-On Chicken Boneless Breast - Weekly": "$33.19",
            "Add-On Chicken Boneless Breast - Monthly": "$132.74",
            "Add-On Chicken Salad - Trial": "$10.62",
            "Add-On Chicken Salad - Weekly": "$53.10",
            "Add-On Chicken Salad - Monthly": "$212.39",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Mix Dish (08 oz) - Trial": "$4.00",
            "Extra Mix Dish (08 oz) - Weekly": "$20.00",
            "Extra Mix Dish (08 oz) - Monthly": "$80.00",
            "Extra Mix Dish (12 oz) - Trial": "$7.00",
            "Extra Mix Dish (12 oz) - Weekly": "$35.00",
            "Extra Mix Dish (12 oz) - Monthly": "$140.00",
            "Extra Mix Dish (16 oz) - Trial": "$9.00",
            "Extra Mix Dish (16 oz) - Weekly": "$45.00",
            "Extra Mix Dish (16 oz) - Monthly": "$180.00",
            "Extra Curry (08 oz) - Trial": "$2.00",
            "Extra Curry (08 oz) - Weekly": "$10.00",
            "Extra Curry (08 oz) - Monthly": "$20.00",
            "Extra Curry (12 oz) - Trial": "$3.00",
            "Extra Curry (12 oz) - Weekly": "$15.00",
            "Extra Curry (12 oz) - Monthly": "$60.00",
            "Extra Curry (16 oz) - Trial": "$5.00",
            "Extra Curry (16 oz) - Weekly": "$25.00",
            "Extra Curry (16 oz) - Monthly": "$100.00",
            "Extra Rice (12 oz) - Trial": "$2.00",
            "Extra Rice (12 oz) - Weekly": "$10.00",
            "Extra Rice (12 oz) - Monthly": "$40.00",
            "Extra Rice (16 oz) - Trial": "$3.00",
            "Extra Rice (16 oz) - Weekly": "$15.00",
            "Extra Rice (16 oz) - Monthly": "$60.00"
        },
        "Meal Types": [
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice",
            "Add-On Pickle (01 oz)",
            "Add-On Raita (04 oz)",
            "Add-On Raita (08 oz)",
            "Add-On Gulab Jamun (2 Pc)",
            "Add-On Garden Green Salad",
            "Add-On Grilled Soya Chaap",
            "Add-On Grilled Paneer",
            "Add-On Boiled Eggs (2 Pc)",
            "Add-On Chicken Boneless Leg",
            "Add-On Chicken Boneless Breast",
            "Add-On Chicken Salad",
            "Extra Roti",
            "Extra Mix Dish (08 oz)",
            "Extra Mix Dish (12 oz)",
            "Extra Mix Dish (16 oz)",
            "Extra Curry (08 oz)",
            "Extra Curry (12 oz)",
            "Extra Curry (16 oz)",
            "Extra Rice (12 oz)",
            "Extra Rice (16 oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/FoodEXPremiumVegTiffinService_fe2864ea-1f04-4706-b08c-9ce9b93a3511_1024x1024@2x.png?v=1708080046",
            "https://tiffinstash.com/cdn/shop/files/IFNVG_befb8490-74ef-4bc1-84c5-80e6bbcdbc8c_1024x1024@2x.png?v=1738971387",
            "https://tiffinstash.com/cdn/shop/files/indiasflavourmixmenu_1024x1024@2x.png?v=1738971387"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/indiasflavour-mix-tiffin-service",
        "Phone Number": "+1 437-430-9990",
        "Instagram": "https://www.instagram.com/angeethi_catering/"
    },
    {
        "Title": "Sooper Veg Punjabi Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Oh my goodness! Where should I begin. The food was scrumptious, awesome. Sevaiyaan were delicious. Macaroni salad was exactly like I make it, yummy. Raajma chawal couldn\u2019t be any better, very, very good. But, the best part for me was Bhindi, I really love bhindi but I\u2019m not often able to cook it myself and at those times I miss mom ke haath ki bani bhindi, which I haven\u2019t gotten an opportunity to have in almost a decade now, maybe even more. And the bhindi I got in this tiffin was divine, surreal, just like my mom\u2019s. Brought so many nostalgic memories of India. I wish they offered it in bigger quantities, 8 oz was just not doing justice to such lip smacking bhindi. Compliments to the cook.",
                "date": "12/02/2024",
                "author": "Anshuman Gupta",
                "rating": 5
            },
            {
                "text": "Sabji was good",
                "date": "09/15/2023",
                "author": "KJ",
                "rating": 5
            },
            {
                "text": "The food is tasty and has a lot of variety in the veggies sent everytime. Would recommend to anyone looking for a daily vegetarian tiffin.",
                "date": "06/20/2023",
                "author": "Manav",
                "rating": 5
            }
        ],
        "Prices": {
            "Deluxe - Trial": "$18.99",
            "Deluxe - Weekly": "$88.99",
            "Deluxe - Monthly": "$335.29",
            "Deluxe Rice - Trial": "$18.99",
            "Deluxe Rice - Weekly": "$88.99",
            "Deluxe Rice - Monthly": "$335.29",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12oz) - Trial": "$5.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Dal (12oz) - Trial": "$5.00",
            "Extra Dal (12oz) - Weekly": "$25.00",
            "Extra Dal (12oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Trial": "$4.00",
            "Extra Rice (12oz) - Weekly": "$20.00",
            "Extra Rice (12oz) - Monthly": "$80.00"
        },
        "Meal Types": [
            "Deluxe",
            "Deluxe Rice",
            "Extra Roti",
            "Extra Veg Sabzi (12oz)",
            "Extra Dal (12oz)",
            "Extra Rice (12oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/SooperVegPunjabiTiffinService_1024x1024@2x.png?v=1706013278",
            "https://tiffinstash.com/cdn/shop/files/SPVEG_90bf3d8f-b71b-4098-93ed-c28f2663e1c7_1024x1024@2x.png?v=1739150500"
        ],
        "Additional Info": "Meal Type",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/sooper-veg-punjabi-tiffin-service",
        "Phone Number": "+1 905-965-5905",
        "Instagram": "https://www.instagram.com/soopertiffinetobicoke/reel/C_lzlr_yQqs/"
    },
    {
        "Title": "Lal's Kitchen Budget Non-Veg Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Trial": "$11.67",
            "Basic - Weekly": "$54.69",
            "Basic - Monthly": "$205.88",
            "Regular - Trial": "$13.00",
            "Regular - Weekly": "$60.94",
            "Regular - Monthly": "$229.41",
            "Regular Rice - Trial": "$13.00",
            "Regular Rice - Weekly": "$60.94",
            "Regular Rice - Monthly": "$229.41",
            "Premium - Trial": "$14.33",
            "Premium - Weekly": "$67.19",
            "Premium - Monthly": "$252.94",
            "Premium Rice - Trial": "$14.33",
            "Premium Rice - Weekly": "$67.19",
            "Premium Rice - Monthly": "$252.94",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (8oz) - Trial": "$3.50",
            "Extra Veg Sabzi (8oz) - Weekly": "$17.50",
            "Extra Veg Sabzi (8oz) - Monthly": "$70.00",
            "Extra Curry (8oz) - Trial": "$3.50",
            "Extra Curry (8oz) - Weekly": "$17.50",
            "Extra Curry (8oz) - Monthly": "$70.00",
            "Extra Rice (8oz) - Trial": "$2.00",
            "Extra Rice (8oz) - Weekly": "$10.00",
            "Extra Rice (8oz) - Monthly": "$40.00",
            "Extra Non-Veg Sabzi (8oz) - Trial": "$4.50",
            "Extra Non-Veg Sabzi (8oz) - Weekly": "$22.50",
            "Extra Non-Veg Sabzi (8oz) - Monthly": "$90.00"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Extra Roti",
            "Extra Veg Sabzi (8oz)",
            "Extra Curry (8oz)",
            "Extra Rice (8oz)",
            "Extra Non-Veg Sabzi (8oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Milton",
            "Brampton",
            "Woodbridge",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York",
            "Vaughan",
            "Richmond Hill",
            "Markham",
            "Ajax",
            "Pickering",
            "Whitby",
            "Oshawa"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/lal-kitchen-non-veg-budget-tiffins",
        "Phone Number": "+1 416-740-0066",
        "Instagram": "https://www.instagram.com/p/DELznCmyHeB/"
    },
    {
        "Title": "India's Flavour Eggetarian Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Great quality and taste. I almost gave up on trying tiffins until I had this one.",
                "date": "11/11/2024",
                "author": "Archana",
                "rating": 5
            },
            {
                "text": "The food is amazing for a tiffin service",
                "date": "08/19/2024",
                "author": "Dhruv Bhatia",
                "rating": 5
            },
            {
                "text": "This is definitely as authentic tiffin service and not a restaurant offering tiffin. The food is fresh , has a homestyle feeling and very healthy. Tried their Veg as well as Mix option both are fantastic.",
                "date": "05/03/2024",
                "author": "Uddeshya",
                "rating": 5
            }
        ],
        "Prices": {
            "Regular - Trial": "$15.00",
            "Regular - Weekly": "$70.31",
            "Regular - Monthly": "$264.71",
            "Regular Rice - Trial": "$15.00",
            "Regular Rice - Weekly": "$70.31",
            "Regular Rice - Monthly": "$264.71",
            "Premium - Trial": "$16.33",
            "Premium - Weekly": "$76.56",
            "Premium - Monthly": "$288.24",
            "Premium Rice - Trial": "$16.33",
            "Premium Rice - Weekly": "$76.56",
            "Premium Rice - Monthly": "$288.24",
            "Deluxe - Trial": "$19.00",
            "Deluxe - Weekly": "$89.06",
            "Deluxe - Monthly": "$335.29",
            "Deluxe Rice - Trial": "$19.00",
            "Deluxe Rice - Weekly": "$89.06",
            "Deluxe Rice - Monthly": "$335.29",
            "Add-On Pickle (01 oz) - Trial": "$1.11",
            "Add-On Pickle (01 oz) - Weekly": "$5.53",
            "Add-On Pickle (01 oz) - Monthly": "$22.12",
            "Add-On Raita (04 oz) - Trial": "$1.55",
            "Add-On Raita (04 oz) - Weekly": "$7.74",
            "Add-On Raita (04 oz) - Monthly": "$30.97",
            "Add-On Raita (08 oz) - Trial": "$2.65",
            "Add-On Raita (08 oz) - Weekly": "$13.27",
            "Add-On Raita (08 oz) - Monthly": "$53.10",
            "Add-On Gulab Jamun (2 Pc) - Trial": "$2.65",
            "Add-On Gulab Jamun (2 Pc) - Weekly": "$13.27",
            "Add-On Gulab Jamun (2 Pc) - Monthly": "$53.10",
            "Add-On Garden Green Salad - Trial": "$4.42",
            "Add-On Garden Green Salad - Weekly": "$22.12",
            "Add-On Garden Green Salad - Monthly": "$88.50",
            "Add-On Grilled Soya Chaap - Trial": "$4.87",
            "Add-On Grilled Soya Chaap - Weekly": "$24.34",
            "Add-On Grilled Soya Chaap - Monthly": "$97.35",
            "Add-On Grilled Paneer - Trial": "$6.64",
            "Add-On Grilled Paneer - Weekly": "$33.19",
            "Add-On Grilled Paneer - Monthly": "$132.74",
            "Add-On Boiled Eggs (2 Pc) - Trial": "$2.65",
            "Add-On Boiled Eggs (2 Pc) - Weekly": "$13.27",
            "Add-On Boiled Eggs (2 Pc) - Monthly": "$53.10",
            "Add-On Chicken Boneless Leg - Trial": "$6.19",
            "Add-On Chicken Boneless Leg - Weekly": "$30.97",
            "Add-On Chicken Boneless Leg - Monthly": "$123.89",
            "Add-On Chicken Boneless Breast - Trial": "$6.64",
            "Add-On Chicken Boneless Breast - Weekly": "$33.19",
            "Add-On Chicken Boneless Breast - Monthly": "$132.74",
            "Add-On Chicken Salad - Trial": "$10.62",
            "Add-On Chicken Salad - Weekly": "$53.10",
            "Add-On Chicken Salad - Monthly": "$212.39",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Mix Dish (08 oz) - Trial": "$4.00",
            "Extra Mix Dish (08 oz) - Weekly": "$20.00",
            "Extra Mix Dish (08 oz) - Monthly": "$80.00",
            "Extra Mix Dish (12 oz) - Trial": "$7.00",
            "Extra Mix Dish (12 oz) - Weekly": "$35.00",
            "Extra Mix Dish (12 oz) - Monthly": "$140.00",
            "Extra Mix Dish (16 oz) - Trial": "$9.00",
            "Extra Mix Dish (16 oz) - Weekly": "$45.00",
            "Extra Mix Dish (16 oz) - Monthly": "$180.00",
            "Extra Curry (08 oz) - Trial": "$2.00",
            "Extra Curry (08 oz) - Weekly": "$10.00",
            "Extra Curry (08 oz) - Monthly": "$20.00",
            "Extra Curry (12 oz) - Trial": "$3.00",
            "Extra Curry (12 oz) - Weekly": "$15.00",
            "Extra Curry (12 oz) - Monthly": "$60.00",
            "Extra Curry (16 oz) - Trial": "$5.00",
            "Extra Curry (16 oz) - Weekly": "$25.00",
            "Extra Curry (16 oz) - Monthly": "$100.00",
            "Extra Rice (12 oz) - Trial": "$2.00",
            "Extra Rice (12 oz) - Weekly": "$10.00",
            "Extra Rice (12 oz) - Monthly": "$20.00",
            "Extra Rice (16 oz) - Trial": "$3.00",
            "Extra Rice (16 oz) - Weekly": "$15.00",
            "Extra Rice (16 oz) - Monthly": "$60.00"
        },
        "Meal Types": [
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice",
            "Add-On Pickle (01 oz)",
            "Add-On Raita (04 oz)",
            "Add-On Raita (08 oz)",
            "Add-On Gulab Jamun (2 Pc)",
            "Add-On Garden Green Salad",
            "Add-On Grilled Soya Chaap",
            "Add-On Grilled Paneer",
            "Add-On Boiled Eggs (2 Pc)",
            "Add-On Chicken Boneless Leg",
            "Add-On Chicken Boneless Breast",
            "Add-On Chicken Salad",
            "Extra Roti",
            "Extra Mix Dish (08 oz)",
            "Extra Mix Dish (12 oz)",
            "Extra Mix Dish (16 oz)",
            "Extra Curry (08 oz)",
            "Extra Curry (12 oz)",
            "Extra Curry (16 oz)",
            "Extra Rice (12 oz)",
            "Extra Rice (16 oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/FoodEXPremiumVegTiffinService_dc8c57af-1b52-4e76-ac5e-4e87facb8c0b_1024x1024@2x.png?v=1708080733",
            "https://tiffinstash.com/cdn/shop/files/IFEGG_dd4678f9-4253-44ed-b1e0-376747fa3bcd_1024x1024@2x.png?v=1738971367",
            "https://tiffinstash.com/cdn/shop/files/india_sflavourmenu_ab4c3de6-26bb-45bd-8e8e-b7704da1973a_1024x1024@2x.png?v=1738971367"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/indiasflavour-egg-tiffin-service",
        "Phone Number": "+1 437-430-9990",
        "Instagram": "https://www.instagram.com/indiasflavourtoronto/"
    },
    {
        "Title": "Fiery Grillss Premium Veg Tiffin Service",
        "Rating": "4.9",
        "Reviews": [
            {
                "text": "Best tiffin on this site. Most of the meals we got were really good. Food is never oily and spice level is good and it is tasty, good for older parents as well. Chapati is a thick sometimes but still pretty good in comparison to others.",
                "date": "01/18/2025",
                "author": "Dhruti",
                "rating": 5
            },
            {
                "text": "It\u2019s one of the better tiffins on Tiffin stash but on some days it can be a little spicy (which is quite subjective because my spice tolerance is much lower than most) . Also, the rotis could be better. \nThat said, I am partial to another tiffin service (which I like more) - here on Tiffinstash hence the slightly lower rating. This is still a very close second option for me,",
                "date": "11/29/2024",
                "author": "SB",
                "rating": 5
            },
            {
                "text": "The food is consistently delicious, making every meal a satisfying experience. Need to work a bit on Chapatis but sabzis are really great.",
                "date": "08/27/2024",
                "author": "Harinder",
                "rating": 5
            },
            {
                "text": "Excellent tiffin service all over GTA. Must try home made food.",
                "date": "08/27/2024",
                "author": "Shriank",
                "rating": 5
            },
            {
                "text": "The food tastes just like homemade meals, with a perfect balance of flavors and spices. Every dish is prepared with care, using fresh and high-quality ingredients, which makes it both delicious and healthy.",
                "date": "08/27/2024",
                "author": "Gursneet Kaur",
                "rating": 5
            },
            {
                "text": "The best tiffin solution. I have actually tried a lot several, yet no other deserved it. They gives cozy, sanitary home cooked meals, packed so very well and tastes outstanding. There is selection as well as dishes are delivered on time. Highly recommended.",
                "date": "08/27/2024",
                "author": "Hardeep Singh",
                "rating": 5
            },
            {
                "text": "Awesome food, tasty food, good price. Daily diff food.",
                "date": "08/27/2024",
                "author": "Karan",
                "rating": 5
            },
            {
                "text": "Excellent service and food is also delicious must try",
                "date": "08/27/2024",
                "author": "Nitin",
                "rating": 5
            },
            {
                "text": "Best tiffin Service \ud83e\uded3\ud83e\uded3\ud83e\uded3",
                "date": "08/27/2024",
                "author": "Maninder",
                "rating": 5
            },
            {
                "text": "Best tiffin service Ihave ever had ..",
                "date": "08/27/2024",
                "author": "Gagandeep kaur",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$13.00",
            "Basic - Weekly": "$60.94",
            "Basic - Monthly": "$229.41",
            "Regular - Trial": "$14.33",
            "Regular - Weekly": "$67.19",
            "Regular - Monthly": "$252.94",
            "Regular Rice - Trial": "$14.33",
            "Regular Rice - Weekly": "$67.19",
            "Regular Rice - Monthly": "$252.94",
            "Premium - Trial": "$16.33",
            "Premium - Weekly": "$76.56",
            "Premium - Monthly": "$288.24",
            "Premium Rice - Trial": "$16.33",
            "Premium Rice - Weekly": "$76.56",
            "Premium Rice - Monthly": "$288.24",
            "Deluxe - Trial": "$17.67",
            "Deluxe - Weekly": "$82.81",
            "Deluxe - Monthly": "$311.76",
            "Deluxe Rice - Trial": "$17.67",
            "Deluxe Rice - Weekly": "$82.81",
            "Deluxe Rice - Monthly": "$311.76",
            "Only Curries 1 - Trial": "$13.67",
            "Only Curries 1 - Weekly": "$64.06",
            "Only Curries 1 - Monthly": "$241.18"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice",
            "Only Curries 1"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/HashtagIndianVegTiffinService_b1277889-1adc-4266-9171-a36420b26b10_1024x1024@2x.png?v=1713261492",
            "https://tiffinstash.com/cdn/shop/files/FGVG_864e1d28-a28b-4742-92d1-32fb7501efc7_1024x1024@2x.png?v=1739147299"
        ],
        "Additional Info": "This seller offers regular Punjabi meals from Mon-Thu and special meals on Fri.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/fiery-grills-veg-tiffin-service",
        "Phone Number": "+1 437-313-1390",
        "Instagram": "https://www.instagram.com/_fierygrillss/"
    },
    {
        "Title": "Fiery Grillss Premium Non-Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "This is my second month ordering from them. Simple food, good quality, less oil.. worth the money.",
                "date": "08/19/2024",
                "author": "Mehak Chowdhary",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$15.00",
            "Basic - Weekly": "$70.31",
            "Basic - Monthly": "$264.71",
            "Regular - Trial": "$17.67",
            "Regular - Weekly": "$82.81",
            "Regular - Monthly": "$311.76",
            "Regular Rice - Trial": "$17.67",
            "Regular Rice - Weekly": "$82.81",
            "Regular Rice - Monthly": "$311.76",
            "Premium - Trial": "$20.33",
            "Premium - Weekly": "$95.31",
            "Premium - Monthly": "$358.82",
            "Premium Rice - Trial": "$20.33",
            "Premium Rice - Weekly": "$95.31",
            "Premium Rice - Monthly": "$358.82",
            "Deluxe - Trial": "$21.67",
            "Deluxe - Weekly": "$101.56",
            "Deluxe - Monthly": "$382.35",
            "Deluxe Rice - Trial": "$21.67",
            "Deluxe Rice - Weekly": "$101.56",
            "Deluxe Rice - Monthly": "$382.35",
            "Only Curries 1 - Trial": "$15.00",
            "Only Curries 1 - Weekly": "$70.31",
            "Only Curries 1 - Monthly": "$264.71",
            "Only Curries 2 - Trial": "$15.00",
            "Only Curries 2 - Weekly": "$70.31",
            "Only Curries 2 - Monthly": "$264.71"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice",
            "Only Curries 1",
            "Only Curries 2"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/HashtagIndianNon-VegBudgetTiffins_c77877cd-f671-40b4-87ac-055d991be64c_1024x1024@2x.png?v=1713260489",
            "https://tiffinstash.com/cdn/shop/files/FGVG_2_1024x1024@2x.png?v=1739147300"
        ],
        "Additional Info": "This seller offers regular Punjabi meals from Mon-Thu and special meals on Fri.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/fiery-grills-non-veg-tiffin-service",
        "Phone Number": "+1 437-313-1390",
        "Instagram": "https://www.instagram.com/_fierygrillss/"
    },
    {
        "Title": "LAL's Kitchen Punjabi Budget Veg & Non-Veg Combo Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Nice food. I like their menu too. Except for one or two days, I liked their tiffin menu that came all month long.",
                "date": "08/19/2024",
                "author": "Kavita Dubey",
                "rating": 5
            },
            {
                "text": "Ok",
                "date": "06/24/2024",
                "author": "Udit mohan",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic Combo - Weekly": "$52.81",
            "Basic Combo - Monthly": "$198.82",
            "Regular Combo - Weekly": "$59.06",
            "Regular Combo - Monthly": "$222.35",
            "Premium Combo - Weekly": "$65.31",
            "Premium Combo - Monthly": "$245.88",
            "Premium Rice Combo - Weekly": "$67.19",
            "Premium Rice Combo - Monthly": "$252.94",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Rice (08oz) - Weekly": "$10.00",
            "Extra Rice (08oz) - Monthly": "$40.00",
            "Extra Veg Sabzi (08oz) - Weekly": "$20.00",
            "Extra Veg Sabzi (08oz) - Monthly": "$80.00",
            "Extra Non-Veg Sabzi (08oz) - Weekly": "$22.50",
            "Extra Non-Veg Sabzi (08oz) - Monthly": "$90.00",
            "Extra Curry (08oz) - Weekly": "$20.00",
            "Extra Curry (08oz) - Monthly": "$80.00"
        },
        "Meal Types": [
            "Basic Combo",
            "Regular Combo",
            "Premium Combo",
            "Premium Rice Combo",
            "Extra Roti",
            "Extra Rice (08oz)",
            "Extra Veg Sabzi (08oz)",
            "Extra Non-Veg Sabzi (08oz)",
            "Extra Curry (08oz)"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Milton",
            "Brampton",
            "Woodbridge",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York",
            "Vaughan",
            "Richmond Hill",
            "Markham",
            "Ajax",
            "Pickering",
            "Whitby",
            "Oshawa"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "Meal Type&nbsp;",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/lals-kitchen-punjabi-budget-veg-non-veg-combo-tiffin-service",
        "Phone Number": "+1 416-740-0066",
        "Instagram": "https://www.instagram.com/p/DELznCmyHeB/"
    },
    {
        "Title": "The Swad Pure Veg Punjabi Tiffin Service",
        "Rating": "4.5",
        "Reviews": [
            {
                "text": "I asked for 4 paranthas in regular tiffin but I got 4 chapatis",
                "date": "01/25/2025",
                "author": "Rishabh Gupta",
                "rating": 5
            },
            {
                "text": "Nice Punjabi tiffin.. I like it as a gujarati.. it's great.",
                "date": "11/01/2024",
                "author": "Deval patel",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$11.80",
            "Basic - Weekly": "$55.31",
            "Basic - Monthly": "$199.99",
            "Regular - Trial": "$12.60",
            "Regular - Weekly": "$59.06",
            "Regular - Monthly": "$219.99",
            "Premium - Trial": "$14.73",
            "Premium - Weekly": "$69.06",
            "Premium - Monthly": "$260.00",
            "Deluxe - Trial": "$15.80",
            "Deluxe - Weekly": "$74.06",
            "Deluxe - Monthly": "$278.82",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12 oz) - Trial": "$5.00",
            "Extra Veg Sabzi (12 oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12 oz) - Monthly": "$100.00",
            "Extra Curry (12 oz) - Trial": "$5.00",
            "Extra Curry (12 oz) - Weekly": "$25.00",
            "Extra Curry (12 oz) - Monthly": "$100.00",
            "Extra Rice (12 oz) - Trial": "$3.00",
            "Extra Rice (12 oz) - Weekly": "$15.00",
            "Extra Rice (12 oz) - Monthly": "$60.00"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Premium",
            "Deluxe",
            "Extra Roti",
            "Extra Veg Sabzi (12 oz)",
            "Extra Curry (12 oz)",
            "Extra Rice (12 oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/TheSwadPureVegGujaratiTiffinService_1024x1024@2x.png?v=1706013881",
            "https://tiffinstash.com/cdn/shop/files/THESWAD-PUNJ_bd64b918-097f-4f3f-8097-2523f960f525_1024x1024@2x.png?v=1739149312",
            "https://tiffinstash.com/cdn/shop/files/fridayspecial_1024x1024_2x_8f73e3ab-c727-435a-853a-a0c66010f711_1024x1024@2x.webp?v=1739149312"
        ],
        "Additional Info": "This seller offers regular Punjabi meals from Mon-Thu and special meals on Fri.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/the-swad-pure-veg-punjabi-tiffin-service",
        "Phone Number": "+1 416-742-6210",
        "Instagram": "https://www.instagram.com/tiffinstash/p/C90p358y4a2/"
    },
    {
        "Title": "Spicy Feast Non-Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Very tasty food",
                "date": "11/19/2024",
                "author": "Viha Naik",
                "rating": 5
            },
            {
                "text": "Food is really amazing. Feeling like it\u2019s homemade.",
                "date": "11/08/2024",
                "author": "Viha Naik",
                "rating": 5
            },
            {
                "text": "Amazing home made food \u2665\ufe0fjust had there food it tasted so delicious \ud83d\udc95",
                "date": "08/30/2024",
                "author": "Aishwarya",
                "rating": 5
            },
            {
                "text": "Best tiffin i came\nAcross \ud83d\udc4ddo try their food its just wooww",
                "date": "08/28/2024",
                "author": "Mehak",
                "rating": 5
            },
            {
                "text": "Love the authentic taste of yummy yummy food 10/10. Loving it :)",
                "date": "08/28/2024",
                "author": "Kanchanpreet",
                "rating": 5
            },
            {
                "text": "there food is mind blowing,its soo yummmy ,mai regularly tiffin le rahi hoon its like mere muma ke hath ka khana \u2764\ufe0f\u2764\ufe0flove it",
                "date": "08/28/2024",
                "author": "navdeepnavu012@gmail.com",
                "rating": 5
            },
            {
                "text": "Best food, i tried and it was so good\ud83d\udc4c",
                "date": "08/28/2024",
                "author": "Riya",
                "rating": 5
            }
        ],
        "Prices": {
            "Regular - Trial": "$16.33",
            "Regular - Weekly": "$76.56",
            "Regular - Monthly": "$288.24",
            "Regular Rice - Trial": "$19.00",
            "Regular Rice - Weekly": "$89.06",
            "Regular Rice - Monthly": "$335.29",
            "Premium - Trial": "$17.67",
            "Premium - Weekly": "$82.81",
            "Premium - Monthly": "$311.76",
            "Premium Rice - Trial": "$21.67",
            "Premium Rice - Weekly": "$101.56",
            "Premium Rice - Monthly": "$382.35",
            "Deluxe - Trial": "$21.67",
            "Deluxe - Weekly": "$101.56",
            "Deluxe - Monthly": "$382.35",
            "Only Curries - Trial": "$16.33",
            "Only Curries - Weekly": "$76.56",
            "Only Curries - Monthly": "$288.24",
            "Supreme 1 - Trial": "$21.67",
            "Supreme 1 - Weekly": "$101.56",
            "Supreme 1 - Monthly": "$382.35",
            "Supreme 2 - Trial": "$21.67",
            "Supreme 2 - Weekly": "$101.56",
            "Supreme 2 - Monthly": "$382.35"
        },
        "Meal Types": [
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Only Curries",
            "Supreme 1",
            "Supreme 2"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/Spicyfeastnon-vegtiffin_1024x1024@2x.png?v=1724175370",
            "https://tiffinstash.com/cdn/shop/files/SFNVG_e5c53633-35ab-4cdb-a0f1-9c8e905fdc1c_1024x1024@2x.png?v=1738971720"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/spicy-feast-non-veg-tiffin-service",
        "Phone Number": "+1 437-604-5840",
        "Instagram": "https://www.instagram.com/spicyfeast_ca/"
    },
    {
        "Title": "Spicy Feast Budget Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "I have tried two previous services from other people, and they put too much oil and masala, which destroyed my health. However, I can honestly and freely say that this is amazing tiffin service & catering. It is so delicious, authentic, and the best part is that the chef has a good command of spices.\u2764\ufe0f\u2764\ufe0f",
                "date": "01/27/2025",
                "author": "Gurkirat",
                "rating": 5
            },
            {
                "text": "Excellent food \nJust like my mother used to cook back home \u2764\ufe0fgod bless Spicy feast tiffin service team for providing with the best food\ud83e\udd70",
                "date": "01/26/2025",
                "author": "Mehkirat",
                "rating": 5
            },
            {
                "text": "Best tiffin service \n\ud83d\udcaf \nFood is very delicious and healthy",
                "date": "01/26/2025",
                "author": "Navneet",
                "rating": 5
            },
            {
                "text": "Amazing food \nI am ordering from them for the past couple of months and honestly saying their food is just another level\nThe freshness of their food is incredible \nMust try",
                "date": "01/26/2025",
                "author": "Prabhnaderpreet",
                "rating": 5
            },
            {
                "text": "I recently tried Spicy Feast tiffin service and was thoroughly impressed. The food was not only delicious but also freshly prepared, with a perfect balance of flavors. Each meal was well-portioned and offered a variety of options, keeping things exciting throughout the week. The service was punctual, and the packaging was eco-friendly, which I appreciated. Overall, it's a fantastic option for anyone looking for homemade meals without the hassle of cooking. Highly recommend!",
                "date": "09/21/2024",
                "author": "Paras",
                "rating": 5
            },
            {
                "text": "Delicious food is served here",
                "date": "08/28/2024",
                "author": "Riya",
                "rating": 5
            },
            {
                "text": "ghr ka khana buhat miss kr rahe thi mai ,then i get to know about spicy feast and i tasted their food so now i can say spicy feast is the best tiffin service in all over GTA \u2764\ufe0f",
                "date": "08/28/2024",
                "author": "mannu",
                "rating": 5
            },
            {
                "text": "Best tiffin & food I ever had.\nLove the taste and way of cooking . Best best best food , keep it up. 10/10",
                "date": "08/28/2024",
                "author": "Kanchanpreet kaur",
                "rating": 5
            },
            {
                "text": "The best tiffin service i had, food is so scrumptious and delicious\u2764\ufe0froti is so soft and food tastes fresh\ud83d\ude0b",
                "date": "08/26/2024",
                "author": "Mehak",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$12.33",
            "Basic - Weekly": "$57.81",
            "Basic - Monthly": "$217.65",
            "Regular - Trial": "$13.67",
            "Regular - Weekly": "$64.06",
            "Regular - Monthly": "$241.18",
            "Regular Rice - Trial": "$13.67",
            "Regular Rice - Weekly": "$64.06",
            "Regular Rice - Monthly": "$241.18",
            "Premium - Trial": "$15.00",
            "Premium - Weekly": "$70.31",
            "Premium - Monthly": "$264.71",
            "Premium Rice - Trial": "$15.00",
            "Premium Rice - Weekly": "$70.31",
            "Premium Rice - Monthly": "$264.71",
            "Deluxe - Trial": "$15.00",
            "Deluxe - Weekly": "$70.31",
            "Deluxe - Monthly": "$264.71",
            "Deluxe Rice - Trial": "$19.67",
            "Deluxe Rice - Weekly": "$92.19",
            "Deluxe Rice - Monthly": "$347.06"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/Spicy_feast_budget_veg_tiffin_1024x1024@2x.png?v=1724666466",
            "https://tiffinstash.com/cdn/shop/files/SFVEG_295900cc-c772-49d3-bf9e-a657a6058d68_1024x1024@2x.png?v=1738971720"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/spicy-feast-budget-veg-tiffin-service",
        "Phone Number": "+1 437-604-5840",
        "Instagram": "https://www.instagram.com/tiffinstash/p/C_JyiH6S7ft/"
    },
    {
        "Title": "Spicy Feast Premium Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Good flavour",
                "date": "01/29/2025",
                "author": "Rishabh Gupta",
                "rating": 5
            },
            {
                "text": "Do try there food, it tastes so good and is of great quality \ud83d\udc95",
                "date": "08/30/2024",
                "author": "Aisha",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic Plus - Trial": "$13.67",
            "Basic Plus - Weekly": "$64.06",
            "Basic Plus - Monthly": "$241.18",
            "Regular Plus - Trial": "$15.00",
            "Regular Plus - Weekly": "$70.31",
            "Regular Plus - Monthly": "$264.71",
            "Regular Rice Plus - Trial": "$15.00",
            "Regular Rice Plus - Weekly": "$70.31",
            "Regular Rice Plus - Monthly": "$264.71",
            "Premium Plus - Trial": "$16.33",
            "Premium Plus - Weekly": "$76.56",
            "Premium Plus - Monthly": "$288.24",
            "Premium Rice Plus - Trial": "$17.00",
            "Premium Rice Plus - Weekly": "$79.69",
            "Premium Rice Plus - Monthly": "$300.00",
            "Deluxe Plus - Trial": "$17.67",
            "Deluxe Plus - Weekly": "$82.81",
            "Deluxe Plus - Monthly": "$311.76",
            "Deluxe Rice Plus - Trial": "$19.00",
            "Deluxe Rice Plus - Weekly": "$89.06",
            "Deluxe Rice Plus - Monthly": "$335.29",
            "Only Curries 1 - Trial": "$13.67",
            "Only Curries 1 - Weekly": "$64.06",
            "Only Curries 1 - Monthly": "$241.18",
            "Only Curries 2 - Trial": "$16.33",
            "Only Curries 2 - Weekly": "$76.56",
            "Only Curries 2 - Monthly": "$288.24",
            "Supreme 1 - Trial": "$20.33",
            "Supreme 1 - Weekly": "$95.31",
            "Supreme 1 - Monthly": "$358.82",
            "Supreme 2 - Trial": "$20.33",
            "Supreme 2 - Weekly": "$95.31",
            "Supreme 2 - Monthly": "$358.82"
        },
        "Meal Types": [
            "Basic Plus",
            "Regular Plus",
            "Regular Rice Plus",
            "Premium Plus",
            "Premium Rice Plus",
            "Deluxe Plus",
            "Deluxe Rice Plus",
            "Only Curries 1",
            "Only Curries 2",
            "Supreme 1",
            "Supreme 2"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/Spicyfeastvegtiffin_1024x1024@2x.png?v=1724175306",
            "https://tiffinstash.com/cdn/shop/files/SFVEG_295900cc-c772-49d3-bf9e-a657a6058d68_1024x1024@2x.png?v=1738971720"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/spicy-feast-premium-veg-tiffin-service",
        "Phone Number": "+1 437-604-5840",
        "Instagram": "https://www.instagram.com/spicyfeast_ca/"
    },
    {
        "Title": "Spicy Feast Premium Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Good flavour",
                "date": "01/29/2025",
                "author": "Rishabh Gupta",
                "rating": 5
            },
            {
                "text": "Do try there food, it tastes so good and is of great quality \ud83d\udc95",
                "date": "08/30/2024",
                "author": "Aisha",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic Plus - Trial": "$13.67",
            "Basic Plus - Weekly": "$64.06",
            "Basic Plus - Monthly": "$241.18",
            "Regular Plus - Trial": "$15.00",
            "Regular Plus - Weekly": "$70.31",
            "Regular Plus - Monthly": "$264.71",
            "Regular Rice Plus - Trial": "$15.00",
            "Regular Rice Plus - Weekly": "$70.31",
            "Regular Rice Plus - Monthly": "$264.71",
            "Premium Plus - Trial": "$16.33",
            "Premium Plus - Weekly": "$76.56",
            "Premium Plus - Monthly": "$288.24",
            "Premium Rice Plus - Trial": "$17.00",
            "Premium Rice Plus - Weekly": "$79.69",
            "Premium Rice Plus - Monthly": "$300.00",
            "Deluxe Plus - Trial": "$17.67",
            "Deluxe Plus - Weekly": "$82.81",
            "Deluxe Plus - Monthly": "$311.76",
            "Deluxe Rice Plus - Trial": "$19.00",
            "Deluxe Rice Plus - Weekly": "$89.06",
            "Deluxe Rice Plus - Monthly": "$335.29",
            "Only Curries 1 - Trial": "$13.67",
            "Only Curries 1 - Weekly": "$64.06",
            "Only Curries 1 - Monthly": "$241.18",
            "Only Curries 2 - Trial": "$16.33",
            "Only Curries 2 - Weekly": "$76.56",
            "Only Curries 2 - Monthly": "$288.24",
            "Supreme 1 - Trial": "$20.33",
            "Supreme 1 - Weekly": "$95.31",
            "Supreme 1 - Monthly": "$358.82",
            "Supreme 2 - Trial": "$20.33",
            "Supreme 2 - Weekly": "$95.31",
            "Supreme 2 - Monthly": "$358.82"
        },
        "Meal Types": [
            "Basic Plus",
            "Regular Plus",
            "Regular Rice Plus",
            "Premium Plus",
            "Premium Rice Plus",
            "Deluxe Plus",
            "Deluxe Rice Plus",
            "Only Curries 1",
            "Only Curries 2",
            "Supreme 1",
            "Supreme 2"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/Spicyfeastvegtiffin_1024x1024@2x.png?v=1724175306",
            "https://tiffinstash.com/cdn/shop/files/SFVEG_295900cc-c772-49d3-bf9e-a657a6058d68_1024x1024@2x.png?v=1738971720"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/angithi-veg-non-veg-combo-tiffin-service",
        "Phone Number": "+1 437-604-5840",
        "Instagram": "https://www.instagram.com/spicyfeast_ca/"
    },
    {
        "Title": "Fiery Grillss Budget Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Best tiffin service all over GTA. I love their food, services and basically everything about them",
                "date": "08/27/2024",
                "author": "Shriank",
                "rating": 5
            },
            {
                "text": "Excellent tiffin service. Best quality food. \nHighly recommended. \nContact them at - (437) 313-1390",
                "date": "08/27/2024",
                "author": "Joseph",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Trial": "$12.33",
            "Basic - Weekly": "$57.81",
            "Basic - Monthly": "$217.65",
            "Regular - Trial": "$13.67",
            "Regular - Weekly": "$64.06",
            "Regular - Monthly": "$241.18",
            "Regular Rice - Trial": "$13.67",
            "Regular Rice - Weekly": "$64.06",
            "Regular Rice - Monthly": "$241.18",
            "Premium - Trial": "$14.33",
            "Premium - Weekly": "$67.19",
            "Premium - Monthly": "$252.94",
            "Premium Rice - Trial": "$14.33",
            "Premium Rice - Weekly": "$67.19",
            "Premium Rice - Monthly": "$252.94"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/HashtagIndianVegBudgetTiffins_a981eccd-ad4b-433b-bfd5-f486ad257712_1024x1024@2x.png?v=1713261340",
            "https://tiffinstash.com/cdn/shop/files/FGVG_864e1d28-a28b-4742-92d1-32fb7501efc7_1024x1024@2x.png?v=1739147299"
        ],
        "Additional Info": "<span style=\"color: #de5200;\">This seller offers regular Punjabi meals from Mon-Thu and special meals on Fri.</span>",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/fiery-grills-veg-budget-tiffins",
        "Phone Number": "+1 437-313-1390",
        "Instagram": "https://www.instagram.com/tiffinstash/p/C6cZ2MKSrEP/"
    },
    {
        "Title": "Fiery Grillss Budget Non-Veg Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Trial": "$13.67",
            "Basic - Weekly": "$64.06",
            "Basic - Monthly": "$241.18",
            "Regular - Trial": "$15.00",
            "Regular - Weekly": "$70.31",
            "Regular - Monthly": "$264.71",
            "Regular Rice - Trial": "$15.00",
            "Regular Rice - Weekly": "$70.31",
            "Regular Rice - Monthly": "$264.71",
            "Premium - Trial": "$17.67",
            "Premium - Weekly": "$82.81",
            "Premium - Monthly": "$311.76",
            "Premium Rice - Trial": "$17.67",
            "Premium Rice - Weekly": "$82.81",
            "Premium Rice - Monthly": "$311.76"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/HashtagIndianNon-VegBudgetTiffins_c77877cd-f671-40b4-87ac-055d991be64c_1024x1024@2x.png?v=1713260489",
            "https://tiffinstash.com/cdn/shop/files/FGVG_2_1024x1024@2x.png?v=1739147300"
        ],
        "Additional Info": "<span style=\"color: #de5200;\">This seller offers regular Punjabi meals from Mon-Thu and special meals on Fri.</span>",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/fiery-grills-non-veg-budget-tiffins",
        "Phone Number": "+1 437-313-1390",
        "Instagram": "https://www.instagram.com/tiffinstash/p/C6cZ2MKSrEP/"
    },
    {
        "Title": "Sooper Veg & Non-Veg Combo Punjabi Tiffin Service",
        "Rating": "4.0",
        "Reviews": [
            {
                "text": "Food is good but quantity could be more for same price",
                "date": "09/20/2023",
                "author": "KJ",
                "rating": 5
            }
        ],
        "Prices": {
            "Deluxe Combo - Weekly": "$96.56",
            "Deluxe Combo - Monthly": "$363.53",
            "Deluxe Rice Combo - Weekly": "$96.56",
            "Deluxe Rice Combo - Monthly": "$363.53",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Curry (12oz) - Weekly": "$25.00",
            "Extra Curry (12oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Weekly": "$20.00",
            "Extra Rice (12oz) - Monthly": "$80.00"
        },
        "Meal Types": [
            "Deluxe Combo",
            "Deluxe Rice Combo",
            "Extra Roti",
            "Extra Veg Sabzi (12oz)",
            "Extra Curry (12oz)",
            "Extra Rice (12oz)"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/SooperVeg_Non-VegComboPunjabiTiffinService_1024x1024@2x.png?v=1706013237",
            "https://tiffinstash.com/cdn/shop/files/SPCMBO_306660ce-b7ab-4fcd-9456-43fecdd53d41_1024x1024@2x.png?v=1739150500"
        ],
        "Additional Info": "Meal Type&nbsp;",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/sooper-punjabi-veg-non-veg-combo-tiffins",
        "Phone Number": "+1 905-965-5905",
        "Instagram": "http://instagram.com/soopertiffinetobicoke"
    },
    {
        "Title": "Wakhra Chulha Non-Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "The food was delicious. Licked the bowl clean.",
                "date": "11/23/2024",
                "author": "Anil Gautam",
                "rating": 5
            }
        ],
        "Prices": {
            "Deluxe 1 - Trial": "$15.00",
            "Deluxe 1 - Weekly": "$70.31",
            "Deluxe 1 - Monthly": "$264.71",
            "Deluxe 2 - Trial": "$15.00",
            "Deluxe 2 - Weekly": "$70.31",
            "Deluxe 2 - Monthly": "$264.71",
            "Regular - Trial": "$15.67",
            "Regular - Weekly": "$73.44",
            "Regular - Monthly": "$276.47",
            "Regular Rice - Trial": "$15.67",
            "Regular Rice - Weekly": "$73.44",
            "Regular Rice - Monthly": "$276.47",
            "Premium 1 - Trial": "$17.67",
            "Premium 1 - Weekly": "$82.81",
            "Premium 1 - Monthly": "$311.76",
            "Premium 2 - Trial": "$17.67",
            "Premium 2 - Weekly": "$82.81",
            "Premium 2 - Monthly": "$311.76",
            "Premium 3 - Trial": "$17.67",
            "Premium 3 - Weekly": "$82.81",
            "Premium 3 - Monthly": "$311.76",
            "Premium 4 - Trial": "$17.67",
            "Premium 4 - Weekly": "$82.81",
            "Premium 4 - Monthly": "$311.76",
            "Deluxe - Trial": "$18.33",
            "Deluxe - Weekly": "$85.94",
            "Deluxe - Monthly": "$323.53",
            "Deluxe Rice - Trial": "$18.33",
            "Deluxe Rice - Weekly": "$85.94",
            "Deluxe Rice - Monthly": "$323.53",
            "Only Curries - Trial": "$12.33",
            "Only Curries - Weekly": "$57.81",
            "Only Curries - Monthly": "$217.65",
            "Deluxe Plus - Trial": "$25.67",
            "Deluxe Plus - Weekly": "$120.31",
            "Deluxe Plus - Monthly": "$452.94",
            "Deluxe Rice Plus - Trial": "$27.00",
            "Deluxe Rice Plus - Weekly": "$126.56",
            "Deluxe Rice Plus - Monthly": "$476.47",
            "Supreme - Trial": "$27.00",
            "Supreme - Weekly": "$126.56",
            "Supreme - Monthly": "$476.47"
        },
        "Meal Types": [
            "Deluxe 1",
            "Deluxe 2",
            "Regular",
            "Regular Rice",
            "Premium 1",
            "Premium 2",
            "Premium 3",
            "Premium 4",
            "Deluxe",
            "Deluxe Rice",
            "Only Curries",
            "Deluxe Plus",
            "Deluxe Rice Plus",
            "Supreme"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "N/A",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/wakhra-chulha-non-veg-tiffin-service",
        "Phone Number": "+1 647-831-1113",
        "Instagram": "https://www.instagram.com/tiffinstash/p/DC0Fi0vBGAb/"
    },
    {
        "Title": "Wakhra Chulha Deluxe Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Great quality",
                "date": "12/09/2024",
                "author": "Laksh Matai",
                "rating": 5
            }
        ],
        "Prices": {
            "Regular - Trial": "$16.33",
            "Regular - Weekly": "$76.56",
            "Regular - Monthly": "$288.24",
            "Regular Rice - Trial": "$16.33",
            "Regular Rice - Weekly": "$76.56",
            "Regular Rice - Monthly": "$288.24",
            "Premium 1 - Trial": "$17.67",
            "Premium 1 - Weekly": "$82.81",
            "Premium 1 - Monthly": "$311.76",
            "Premium 2 - Trial": "$17.67",
            "Premium 2 - Weekly": "$82.81",
            "Premium 2 - Monthly": "$311.76",
            "Premium 3 - Trial": "$17.67",
            "Premium 3 - Weekly": "$82.81",
            "Premium 3 - Monthly": "$311.76",
            "Deluxe - Trial": "$19.00",
            "Deluxe - Weekly": "$89.06",
            "Deluxe - Monthly": "$335.29",
            "Deluxe Rice - Trial": "$20.33",
            "Deluxe Rice - Weekly": "$95.31",
            "Deluxe Rice - Monthly": "$358.82",
            "Deluxe Plus - Trial": "$20.33",
            "Deluxe Plus - Weekly": "$95.31",
            "Deluxe Plus - Monthly": "$358.82",
            "Only Curries - Trial": "$13.67",
            "Only Curries - Weekly": "$64.06",
            "Only Curries - Monthly": "$241.18"
        },
        "Meal Types": [
            "Regular",
            "Regular Rice",
            "Premium 1",
            "Premium 2",
            "Premium 3",
            "Deluxe",
            "Deluxe Rice",
            "Deluxe Plus",
            "Only Curries"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/wakhra-chulha-deluxe-veg-tiffin-service",
        "Phone Number": "+1 647-831-1113",
        "Instagram": "https://www.instagram.com/tiffinstash/p/DC0Fi0vBGAb/"
    },
    {
        "Title": "Spicy Feast Veg & Non-Veg Combo Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Best food \u2764\ufe0f been there regular customer they serve the most scrumptious meals \ud83e\udd70",
                "date": "11/07/2024",
                "author": "Mehak",
                "rating": 5
            }
        ],
        "Prices": {
            "Regular - Weekly": "$69.06",
            "Regular - Monthly": "$260.00",
            "Regular Rice - Weekly": "$74.06",
            "Regular Rice - Monthly": "$278.82",
            "Premium - Weekly": "$75.31",
            "Premium - Monthly": "$283.53",
            "Premium Rice - Weekly": "$82.81",
            "Premium Rice - Monthly": "$311.76",
            "Deluxe - Weekly": "$82.81",
            "Deluxe - Monthly": "$311.76",
            "Supreme 1 - Weekly": "$97.81",
            "Supreme 1 - Monthly": "$368.24",
            "Supreme 2 - Weekly": "$97.81",
            "Supreme 2 - Monthly": "$368.24"
        },
        "Meal Types": [
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Supreme 1",
            "Supreme 2"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/Spicyfeastveg_non-vegcombotiffin_1024x1024@2x.png?v=1724175421",
            "https://tiffinstash.com/cdn/shop/files/SFCMBO_d7e5b5c1-0b1c-4195-be4b-c00e8cee2511_1024x1024@2x.png?v=1738971720"
        ],
        "Additional Info": "Meal Type",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/spicy-feast-veg-non-veg-combo-tiffin-service",
        "Phone Number": "+1 437-604-5840",
        "Instagram": "https://www.instagram.com/spicyfeast_ca/"
    },
    {
        "Title": "Wakhra Chulha Combo Veg & Non-Veg Tiffins",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Deluxe Combo - Weekly": "$64.69",
            "Deluxe Combo - Monthly": "$243.53",
            "Deluxe Rice Combo - Weekly": "$66.56",
            "Deluxe Rice Combo - Monthly": "$250.59",
            "Premium 1 Combo - Weekly": "$75.31",
            "Premium 1 Combo - Monthly": "$283.53",
            "Premium 2 Combo - Weekly": "$75.31",
            "Premium 2 Combo - Monthly": "$283.53",
            "Premium 3 Combo - Weekly": "$75.31",
            "Premium 3 Combo - Monthly": "$283.53",
            "Deluxe Plus Combo - Weekly": "$79.06",
            "Deluxe Plus Combo - Monthly": "$297.65",
            "Deluxe Rice Plus Combo - Weekly": "$84.06",
            "Deluxe Rice Plus Combo - Monthly": "$316.47",
            "Supreme Combo - Weekly": "$84.06",
            "Supreme Combo - Monthly": "$316.47",
            "Only Curries Combo - Weekly": "$55.94",
            "Only Curries Combo - Monthly": "$210.59",
            "Deluxe 1 Combo - Weekly": "$101.56",
            "Deluxe 1 Combo - Monthly": "$382.35",
            "Deluxe 2 Combo - Weekly": "$107.81",
            "Deluxe 2 Combo - Monthly": "$405.88",
            "Deluxe 3 Combo - Weekly": "$107.81",
            "Deluxe 3 Combo - Monthly": "$405.88"
        },
        "Meal Types": [
            "Deluxe Combo",
            "Deluxe Rice Combo",
            "Premium 1 Combo",
            "Premium 2 Combo",
            "Premium 3 Combo",
            "Deluxe Plus Combo",
            "Deluxe Rice Plus Combo",
            "Supreme Combo",
            "Only Curries Combo",
            "Deluxe 1 Combo",
            "Deluxe 2 Combo",
            "Deluxe 3 Combo"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "Meal Type&nbsp;",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/wakhra-chulha-combo-veg-non-veg-tiffins",
        "Phone Number": "+1 647-831-1113",
        "Instagram": "https://www.instagram.com/tiffinstash/p/DC0Fi0vBGAb/"
    },
    {
        "Title": "Wakhra Chulha Premium Veg Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Trial": "$11.67",
            "Basic - Weekly": "$54.69",
            "Basic - Monthly": "$205.88",
            "Premium 1 - Trial": "$15.00",
            "Premium 1 - Weekly": "$70.31",
            "Premium 1 - Monthly": "$264.71",
            "Premium 2 - Trial": "$15.00",
            "Premium 2 - Weekly": "$70.31",
            "Premium 2 - Monthly": "$264.71",
            "Premium 3 - Trial": "$15.00",
            "Premium 3 - Weekly": "$70.31",
            "Premium 3 - Monthly": "$264.71",
            "Deluxe - Trial": "$16.33",
            "Deluxe - Weekly": "$76.56",
            "Deluxe - Monthly": "$288.24",
            "Deluxe Rice - Trial": "$17.67",
            "Deluxe Rice - Weekly": "$82.81",
            "Deluxe Rice - Monthly": "$311.76",
            "Deluxe Plus - Trial": "$17.67",
            "Deluxe Plus - Weekly": "$82.81",
            "Deluxe Plus - Monthly": "$311.76",
            "Only Curries - Trial": "$11.67",
            "Only Curries - Weekly": "$54.69",
            "Only Curries - Monthly": "$205.88"
        },
        "Meal Types": [
            "Basic",
            "Premium 1",
            "Premium 2",
            "Premium 3",
            "Deluxe",
            "Deluxe Rice",
            "Deluxe Plus",
            "Only Curries"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/wakhra-chulha-premium-veg-tiffin-service",
        "Phone Number": "+1 647-831-1113",
        "Instagram": "https://www.instagram.com/tiffinstash/p/DC0Fi0vBGAb/"
    },
    {
        "Title": "Fiery Grillss Budget Veg & Non-Veg Combo Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Weekly": "$60.31",
            "Basic - Monthly": "$227.06",
            "Regular - Weekly": "$66.56",
            "Regular - Monthly": "$250.59",
            "Regular Rice - Weekly": "$66.56",
            "Regular Rice - Monthly": "$250.59",
            "Premium - Weekly": "$73.44",
            "Premium - Monthly": "$276.47",
            "Premium Rice - Weekly": "$73.44",
            "Premium Rice - Monthly": "$276.47"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/Hashtagveg_Non-vegcombotiffin_5f0520b6-4bfb-483f-9d9d-57b754443428_1024x1024@2x.png?v=1713261663",
            "https://tiffinstash.com/cdn/shop/files/FGCMBO_eb25d615-0898-4a1d-b71a-c3247c7757d3_1024x1024@2x.png?v=1739147299"
        ],
        "Additional Info": "Meal Type&nbsp;",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/fiery-grills-veg-non-veg-combo-budget-tiffins",
        "Phone Number": "+1 437-313-1390",
        "Instagram": "https://www.instagram.com/tiffinstash/p/C6cZ2MKSrEP/"
    },
    {
        "Title": "Fiery Grillss Premium Veg & Non-Veg Combo Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Simply the best \ud83d\ude0a",
                "date": "09/17/2024",
                "author": "Modi",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Weekly": "$64.69",
            "Basic - Monthly": "$243.53",
            "Regular - Weekly": "$73.44",
            "Regular - Monthly": "$276.47",
            "Regular Rice - Weekly": "$73.44",
            "Regular Rice - Monthly": "$276.47",
            "Premium - Weekly": "$84.06",
            "Premium - Monthly": "$316.47",
            "Premium Rice - Weekly": "$84.06",
            "Premium Rice - Monthly": "$316.47",
            "Deluxe - Weekly": "$90.31",
            "Deluxe - Monthly": "$340.00",
            "Deluxe Rice - Weekly": "$90.31",
            "Deluxe Rice - Monthly": "$340.00",
            "Only Curries 1 - Weekly": "$66.56",
            "Only Curries 1 - Monthly": "$250.59"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice",
            "Only Curries 1"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/HashtagVeg_Non-VegComboTiffins_0c877bbf-0d41-49bd-ad23-6d10071e491a_1024x1024@2x.png?v=1713261820",
            "https://tiffinstash.com/cdn/shop/files/FGCMBO_eb25d615-0898-4a1d-b71a-c3247c7757d3_1024x1024@2x.png?v=1739147299"
        ],
        "Additional Info": "This seller offers regular Punjabi meals from Mon-Thu and special meals on Fri.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/fiery-grills-veg-non-veg-combo-tiffins",
        "Phone Number": "+1 437-313-1390",
        "Instagram": "https://www.instagram.com/tiffinstash/p/C6cZ2MKSrEP/"
    },
    {
        "Title": "Food Monks Non-Veg Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Regular 1 - Trial": "$12.41",
            "Regular 1 - Weekly": "$58.06",
            "Regular 1 - Monthly": "$218.18",
            "Regular 2 - Trial": "$13.03",
            "Regular 2 - Weekly": "$60.97",
            "Regular 2 - Monthly": "$229.09",
            "Premium - Trial": "$13.66",
            "Premium - Weekly": "$63.87",
            "Premium - Monthly": "$240.00",
            "Premium Plus - Trial": "$14.90",
            "Premium Plus - Weekly": "$69.68",
            "Premium Plus - Monthly": "$261.82",
            "Deluxe - Trial": "$16.14",
            "Deluxe - Weekly": "$75.48",
            "Deluxe - Monthly": "$283.64",
            "Supreme - Trial": "$18.00",
            "Supreme - Weekly": "$84.19",
            "Supreme - Monthly": "$316.36",
            "Only Curries - Trial": "$11.79",
            "Only Curries - Weekly": "$55.16",
            "Only Curries - Monthly": "$207.27"
        },
        "Meal Types": [
            "Regular 1",
            "Regular 2",
            "Premium",
            "Premium Plus",
            "Deluxe",
            "Supreme",
            "Only Curries"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/FoodMonkNon-VegTiffinService_1024x1024@2x.png?v=1737049253",
            "https://tiffinstash.com/cdn/shop/files/FMNVG_0f746c34-9e67-4ab8-b60f-b8715e4e36c8_1024x1024@2x.png?v=1738971666"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/food-monks-non-veg-vd-tiffin-service",
        "Phone Number": "+1 647-517-3663",
        "Instagram": "https://www.instagram.com/foodmonks/?hl=en"
    },
    {
        "Title": "Food Monks Veg Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Weekly": "$37.74",
            "Basic - Monthly": "$141.82",
            "Basic - Trial": "",
            "Basic Plus - Weekly": "$45.00",
            "Basic Plus - Monthly": "$169.09",
            "Basic Plus - Trial": "",
            "Regular 1 - Weekly": "$47.90",
            "Regular 1 - Monthly": "$180.00",
            "Regular 1 - Trial": "",
            "Regular 2 - Weekly": "$52.26",
            "Regular 2 - Monthly": "$196.36",
            "Regular 2 - Trial": "$11.17",
            "Regular 3 - Weekly": "$55.16",
            "Regular 3 - Monthly": "$207.27",
            "Regular 3 - Trial": "$11.79",
            "Premium - Weekly": "$58.06",
            "Premium - Monthly": "$218.18",
            "Premium - Trial": "$12.41",
            "Premium Plus - Weekly": "$63.87",
            "Premium Plus - Monthly": "$240.00",
            "Premium Plus - Trial": "$13.66",
            "Deluxe - Weekly": "$69.68",
            "Deluxe - Monthly": "$261.82",
            "Deluxe - Trial": "$14.90",
            "Supreme - Weekly": "$81.29",
            "Supreme - Monthly": "$305.45",
            "Supreme - Trial": "$17.38",
            "Only Curries - Weekly": "$49.35",
            "Only Curries - Monthly": "$185.45",
            "Only Curries - Trial": ""
        },
        "Meal Types": [
            "Basic",
            "Basic Plus",
            "Regular 1",
            "Regular 2",
            "Regular 3",
            "Premium",
            "Premium Plus",
            "Deluxe",
            "Supreme",
            "Only Curries"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly",
            "Trial"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/FoodMonkVegTiffinService_1024x1024@2x.png?v=1737049283",
            "https://tiffinstash.com/cdn/shop/files/FMVEG_0a18e574-b790-4511-8c59-39e8771659ec_1024x1024@2x.png?v=1738971666"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/food-monks-vd-veg-tiffin-service",
        "Phone Number": "+1 647-517-3663",
        "Instagram": "https://www.instagram.com/foodmonks/?hl=en"
    },
    {
        "Title": "Sooper Non-Veg Punjabi Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Trial": "$15.00",
            "Basic - Weekly": "$70.31",
            "Basic - Monthly": "$264.71",
            "Regular - Trial": "$18.00",
            "Regular - Weekly": "$84.38",
            "Regular - Monthly": "$317.65",
            "Premium - Trial": "$19.33",
            "Premium - Weekly": "$90.63",
            "Premium - Monthly": "$341.18",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Roti - Monthly": "$20.00",
            "Extra Non-Veg Sabzi (12oz) - Trial": "$5.00",
            "Extra Non-Veg Sabzi (12oz) - Weekly": "$25.00",
            "Extra Non-Veg Sabzi (12oz) - Monthly": "$100.00",
            "Extra Curry (12 oz) - Trial": "$5.00",
            "Extra Curry (12 oz) - Weekly": "$25.00",
            "Extra Curry (12 oz) - Monthly": "$100.00",
            "Extra Rice (12oz) - Trial": "$4.00",
            "Extra Rice (12oz) - Weekly": "$20.00",
            "Extra Rice (12oz) - Monthly": "$80.00"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Premium",
            "Extra Roti",
            "Extra Non-Veg Sabzi (12oz)",
            "Extra Curry (12 oz)",
            "Extra Rice (12oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "Meal Type",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/sooper-non-veg-punjabi-tiffin-service",
        "Phone Number": "+1 905-965-5905",
        "Instagram": "https://www.instagram.com/being.eh.wanderer/reel/C7eT8yruAMb/"
    },
    {
        "Title": "Wakhra Chulha Budget Veg Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Trial": "$11.67",
            "Basic - Weekly": "$54.69",
            "Basic - Monthly": "$205.88",
            "Regular - Trial": "$12.33",
            "Regular - Weekly": "$57.81",
            "Regular - Monthly": "$217.65",
            "Regular Rice - Trial": "$12.33",
            "Regular Rice - Weekly": "$57.81",
            "Regular Rice - Monthly": "$217.65",
            "Premium 1 - Trial": "$12.33",
            "Premium 1 - Weekly": "$57.81",
            "Premium 1 - Monthly": "$217.65",
            "Premium 2 - Trial": "$13.00",
            "Premium 2 - Weekly": "$60.94",
            "Premium 2 - Monthly": "$229.41",
            "Deluxe - Trial": "$13.67",
            "Deluxe - Weekly": "$64.06",
            "Deluxe - Monthly": "$241.18",
            "Deluxe Rice - Trial": "$13.67",
            "Deluxe Rice - Weekly": "$64.06",
            "Deluxe Rice - Monthly": "$241.18"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium 1",
            "Premium 2",
            "Deluxe",
            "Deluxe Rice"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/wakhra-chulha-budget-veg-tiffin-service",
        "Phone Number": "+1 647-831-1113",
        "Instagram": "https://www.instagram.com/tiffinstash/p/DC0Fi0vBGAb/"
    },
    {
        "Title": "KKHS Budget Gujarati Tiffins",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic 1 - Trial": "$11.67",
            "Basic 1 - Weekly": "$54.69",
            "Basic 2 - Trial": "$11.67",
            "Basic 2 - Weekly": "$54.69",
            "Regular - Trial": "$12.67",
            "Regular - Weekly": "$59.38",
            "Regular Rice - Trial": "$12.67",
            "Regular Rice - Weekly": "$59.38",
            "Premium - Trial": "$13.67",
            "Premium - Weekly": "$64.06",
            "Premium Rice - Trial": "$14.00",
            "Premium Rice - Weekly": "$65.63",
            "Deluxe - Trial": "$15.67",
            "Deluxe - Weekly": "$73.44",
            "Deluxe Plus - Trial": "$17.00",
            "Deluxe Plus - Weekly": "$79.69",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Sabzi (08 oz) - Trial": "$4.00",
            "Extra Sabzi (08 oz) - Weekly": "$20.00",
            "Extra Dal (08 oz) - Trial": "$4.00",
            "Extra Dal (08 oz) - Weekly": "$20.00",
            "Extra Rice (08 oz) - Trial": "$4.00",
            "Extra Rice (08 oz) - Weekly": "$20.00",
            "Extra Kathod (08 oz) - Trial": "$4.00",
            "Extra Kathod (08 oz) - Weekly": "$20.00"
        },
        "Meal Types": [
            "Basic 1",
            "Basic 2",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Plus",
            "Extra Roti",
            "Extra Sabzi (08 oz)",
            "Extra Dal (08 oz)",
            "Extra Rice (08 oz)",
            "Extra Kathod (08 oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/TiffinByKKHSvegtiffins_1024x1024@2x.png?v=1733830585",
            "https://tiffinstash.com/cdn/shop/files/KKHS_Tiffins_f0702f34-e95d-4584-ad91-eb16c02ddd03_1024x1024@2x.png?v=1738546210",
            "https://tiffinstash.com/cdn/shop/files/TKHHS_specials_1_1024x1024@2x.png?v=1738546210"
        ],
        "Additional Info": "<meta charset=\"utf-8\">This seller offers regular Gujarati meals from Mon-Thu and special meals on Fri.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/tiffin-by-kkhs-budget-veg-tiffins",
        "Instagram": "https://www.instagram.com/tiffin_by_kkhs/"
    },
    {
        "Title": "KKHS Premium Gujarati Tiffins",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic 1 - Trial": "$13.67",
            "Basic 1 - Weekly": "$64.06",
            "Basic 2 - Trial": "$13.67",
            "Basic 2 - Weekly": "$64.06",
            "Regular - Trial": "$15.00",
            "Regular - Weekly": "$70.31",
            "Regular Rice - Trial": "$15.00",
            "Regular Rice - Weekly": "$70.31",
            "Premium - Trial": "$17.67",
            "Premium - Weekly": "$82.81",
            "Premium Plus - Trial": "$20.33",
            "Premium Plus - Weekly": "$95.31",
            "Deluxe - Trial": "$21.67",
            "Deluxe - Weekly": "$101.56",
            "Deluxe Plus - Trial": "$23.67",
            "Deluxe Plus - Weekly": "$110.94",
            "Supreme - Trial": "$16.33",
            "Supreme - Weekly": "$76.56",
            "Supreme Plus - Trial": "$25.67",
            "Supreme Plus - Weekly": "$120.31",
            "Rice Bowl - Trial": "$12.33",
            "Rice Bowl - Weekly": "$57.81",
            "Only Curries 1 - Trial": "$13.67",
            "Only Curries 1 - Weekly": "$64.06",
            "Only Curries 2 - Trial": "$13.67",
            "Only Curries 2 - Weekly": "$64.06",
            "Only Curries 3 - Trial": "$17.00",
            "Only Curries 3 - Weekly": "$79.69",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Sabzi (12 oz) - Trial": "$5.00",
            "Extra Sabzi (12 oz) - Weekly": "$25.00",
            "Extra Dal (12 oz) - Trial": "$5.00",
            "Extra Dal (12 oz) - Weekly": "$25.00",
            "Extra Rice (12 oz) - Trial": "$5.00",
            "Extra Rice (12 oz) - Weekly": "$25.00",
            "Extra Kathod (12 oz) - Trial": "$5.00",
            "Extra Kathod (12 oz) - Weekly": "$25.00"
        },
        "Meal Types": [
            "Basic 1",
            "Basic 2",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Plus",
            "Deluxe",
            "Deluxe Plus",
            "Supreme",
            "Supreme Plus",
            "Rice Bowl",
            "Only Curries 1",
            "Only Curries 2",
            "Only Curries 3",
            "Extra Roti",
            "Extra Sabzi (12 oz)",
            "Extra Dal (12 oz)",
            "Extra Rice (12 oz)",
            "Extra Kathod (12 oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/TiffinByKKHSvegtiffins_1024x1024@2x.png?v=1733830585",
            "https://tiffinstash.com/cdn/shop/files/KKHS_Tiffins_f0702f34-e95d-4584-ad91-eb16c02ddd03_1024x1024@2x.png?v=1738546210",
            "https://tiffinstash.com/cdn/shop/files/TKHHS_specials_1_1024x1024@2x.png?v=1738546210"
        ],
        "Additional Info": "<meta charset=\"utf-8\">This seller offers regular Gujarati meals from Mon-Thu and special meals on Fri.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/tiffin-by-kkhs-premium-veg-tiffins",
        "Instagram": "https://www.instagram.com/tiffin_by_kkhs/"
    },
    {
        "Title": "Parantha Specials (By Royal Ruby)",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {},
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice",
            "Only Curries"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "N/A",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/parantha-specials-by-royalruby"
    },
    {
        "Title": "KKHS Premium Gujarati Tiffins",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic 1 - Trial": "$13.67",
            "Basic 1 - Weekly": "$64.06",
            "Basic 2 - Trial": "$13.67",
            "Basic 2 - Weekly": "$64.06",
            "Regular - Trial": "$15.00",
            "Regular - Weekly": "$70.31",
            "Regular Rice - Trial": "$15.00",
            "Regular Rice - Weekly": "$70.31",
            "Premium - Trial": "$17.67",
            "Premium - Weekly": "$82.81",
            "Premium Plus - Trial": "$20.33",
            "Premium Plus - Weekly": "$95.31",
            "Deluxe - Trial": "$21.67",
            "Deluxe - Weekly": "$101.56",
            "Deluxe Plus - Trial": "$23.67",
            "Deluxe Plus - Weekly": "$110.94",
            "Supreme - Trial": "$16.33",
            "Supreme - Weekly": "$76.56",
            "Supreme Plus - Trial": "$25.67",
            "Supreme Plus - Weekly": "$120.31",
            "Rice Bowl - Trial": "$12.33",
            "Rice Bowl - Weekly": "$57.81",
            "Only Curries 1 - Trial": "$13.67",
            "Only Curries 1 - Weekly": "$64.06",
            "Only Curries 2 - Trial": "$13.67",
            "Only Curries 2 - Weekly": "$64.06",
            "Only Curries 3 - Trial": "$17.00",
            "Only Curries 3 - Weekly": "$79.69",
            "Extra Roti - Trial": "$1.00",
            "Extra Roti - Weekly": "$5.00",
            "Extra Sabzi (12 oz) - Trial": "$5.00",
            "Extra Sabzi (12 oz) - Weekly": "$25.00",
            "Extra Dal (12 oz) - Trial": "$5.00",
            "Extra Dal (12 oz) - Weekly": "$25.00",
            "Extra Rice (12 oz) - Trial": "$5.00",
            "Extra Rice (12 oz) - Weekly": "$25.00",
            "Extra Kathod (12 oz) - Trial": "$5.00",
            "Extra Kathod (12 oz) - Weekly": "$25.00"
        },
        "Meal Types": [
            "Basic 1",
            "Basic 2",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Plus",
            "Deluxe",
            "Deluxe Plus",
            "Supreme",
            "Supreme Plus",
            "Rice Bowl",
            "Only Curries 1",
            "Only Curries 2",
            "Only Curries 3",
            "Extra Roti",
            "Extra Sabzi (12 oz)",
            "Extra Dal (12 oz)",
            "Extra Rice (12 oz)",
            "Extra Kathod (12 oz)"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/TiffinByKKHSvegtiffins_1024x1024@2x.png?v=1733830585",
            "https://tiffinstash.com/cdn/shop/files/KKHS_Tiffins_f0702f34-e95d-4584-ad91-eb16c02ddd03_1024x1024@2x.png?v=1738546210",
            "https://tiffinstash.com/cdn/shop/files/TKHHS_specials_1_1024x1024@2x.png?v=1738546210"
        ],
        "Additional Info": "<meta charset=\"utf-8\">This seller offers regular Gujarati meals from Mon-Thu and special meals on Fri.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/tiffin-by-kkhs-premium-veg-tiffins",
        "Phone Number": "+1 647-828-7864"
    },
    {
        "Title": "Daawat Halal Non-Veg Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Trial": "$15.17",
            "Basic - Weekly": "$70.97",
            "Basic - Monthly": "$266.67",
            "Regular - Trial": "$15.17",
            "Regular - Weekly": "$70.97",
            "Regular - Monthly": "$266.67",
            "Premium - Trial": "$19.31",
            "Premium - Weekly": "$90.32",
            "Premium - Monthly": "$339.39"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Premium"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Milton",
            "Brampton",
            "Woodbridge",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York",
            "Vaughan",
            "Richmond Hill",
            "Markham",
            "Ajax",
            "Pickering",
            "Oshawa",
            "Whitby"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/DaawatHalalNon-VegTiffinService_1024x1024@2x.png?v=1737022247",
            "https://tiffinstash.com/cdn/shop/files/DWNVG_8bd0845a-7ca6-48eb-af23-1ace0609363e_1024x1024@2x.png?v=1739147299"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/daawat-halal-non-veg-tiffin-service"
    },
    {
        "Title": "Wakhra Chulha Budget Veg Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Trial": "$11.67",
            "Basic - Weekly": "$54.69",
            "Basic - Monthly": "$205.88",
            "Regular - Trial": "$12.33",
            "Regular - Weekly": "$57.81",
            "Regular - Monthly": "$217.65",
            "Regular Rice - Trial": "$12.33",
            "Regular Rice - Weekly": "$57.81",
            "Regular Rice - Monthly": "$217.65",
            "Premium 1 - Trial": "$12.33",
            "Premium 1 - Weekly": "$57.81",
            "Premium 1 - Monthly": "$217.65",
            "Premium 2 - Trial": "$13.00",
            "Premium 2 - Weekly": "$60.94",
            "Premium 2 - Monthly": "$229.41",
            "Deluxe - Trial": "$13.67",
            "Deluxe - Weekly": "$64.06",
            "Deluxe - Monthly": "$241.18",
            "Deluxe Rice - Trial": "$13.67",
            "Deluxe Rice - Weekly": "$64.06",
            "Deluxe Rice - Monthly": "$241.18"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium 1",
            "Premium 2",
            "Deluxe",
            "Deluxe Rice"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            ""
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/wakhra-chulha-budget-veg-tiffin-service"
    },
    {
        "Title": "Yum In Box Jumbo Veg Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Ok",
                "date": "05/28/2024",
                "author": "Anshul Pal",
                "rating": 5
            }
        ],
        "Prices": {
            "Deluxe - Trial": "$26.69",
            "Deluxe - Weekly": "$124.84",
            "Deluxe - Monthly": "$469.09",
            "Deluxe Roti - Trial": "$26.69",
            "Deluxe Roti - Weekly": "$124.84",
            "Deluxe Roti - Monthly": "$469.09",
            "Deluxe Rice - Trial": "$26.69",
            "Deluxe Rice - Weekly": "$124.84",
            "Deluxe Rice - Monthly": "$469.09",
            "Deluxe Curries - Trial": "$23.59",
            "Deluxe Curries - Weekly": "$110.32",
            "Deluxe Curries - Monthly": "$414.55",
            "Supreme - Trial": "$36.55",
            "Supreme - Weekly": "$170.97",
            "Supreme - Monthly": "$642.42",
            "Supreme Roti - Trial": "$36.55",
            "Supreme Roti - Weekly": "$170.97",
            "Supreme Roti - Monthly": "$642.42",
            "Supreme Rice - Trial": "$36.55",
            "Supreme Rice - Weekly": "$170.97",
            "Supreme Rice - Monthly": "$642.42",
            "Supreme Curries - Trial": "$31.03",
            "Supreme Curries - Weekly": "$145.16",
            "Supreme Curries - Monthly": "$545.45"
        },
        "Meal Types": [
            "Deluxe",
            "Deluxe Roti",
            "Deluxe Rice",
            "Deluxe Curries",
            "Supreme",
            "Supreme Roti",
            "Supreme Rice",
            "Supreme Curries"
        ],
        "Meal Plans": [
            "Trial",
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Milton",
            "Brampton",
            "Woodbridge",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York",
            "Vaughan",
            "Richmond Hill",
            "Markham",
            "Ajax",
            "Pickering",
            "Oshawa",
            "Whitby"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/YumInBoxJumbo_1024x1024@2x.png?v=1713430658",
            "https://tiffinstash.com/cdn/shop/files/YBVG_acde1d26-decc-4eb3-9963-b1ebd8116da4_1024x1024@2x.png?v=1739147299"
        ],
        "Additional Info": "",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/yum-in-box-jumbo-veg-tiffin-service",
        "Phone Number": "+1 (647) 237-7313"
    },
    {
        "Title": "Pick-a-Delhi Veg & Non-Veg Combo Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Weekly": "$55.94",
            "Basic - Monthly": "$210.59",
            "Regular - Weekly": "$66.56",
            "Regular - Monthly": "$250.59",
            "Regular Rice - Weekly": "$66.56",
            "Regular Rice - Monthly": "$250.59",
            "Premium - Weekly": "$72.81",
            "Premium - Monthly": "$274.12",
            "Deluxe - Weekly": "$89.69",
            "Deluxe - Monthly": "$337.65",
            "Deluxe Rice - Weekly": "$89.69",
            "Deluxe Rice - Monthly": "$337.65"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Deluxe",
            "Deluxe Rice"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/PIKADcombotiffin_1024x1024@2x.png?v=1724159921",
            "https://tiffinstash.com/cdn/shop/files/PKCMBO_86d5e726-3e37-4446-8541-270f9d611633_1024x1024@2x.png?v=1739150500"
        ],
        "Additional Info": "Meal Type",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/pick-a-delhi-combo-tiffin-service"
    },
    {
        "Title": "Fiery Grillss Budget Veg & Non-Veg Combo Tiffin Service",
        "Rating": "N/A",
        "Reviews": [],
        "Prices": {
            "Basic - Weekly": "$60.31",
            "Basic - Monthly": "$227.06",
            "Regular - Weekly": "$66.56",
            "Regular - Monthly": "$250.59",
            "Regular Rice - Weekly": "$66.56",
            "Regular Rice - Monthly": "$250.59",
            "Premium - Weekly": "$73.44",
            "Premium - Monthly": "$276.47",
            "Premium Rice - Weekly": "$73.44",
            "Premium Rice - Monthly": "$276.47"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/Hashtagveg_Non-vegcombotiffin_5f0520b6-4bfb-483f-9d9d-57b754443428_1024x1024@2x.png?v=1713261663",
            "https://tiffinstash.com/cdn/shop/files/FGCMBO_eb25d615-0898-4a1d-b71a-c3247c7757d3_1024x1024@2x.png?v=1739147299"
        ],
        "Additional Info": "Meal Type&nbsp;",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/fiery-grills-veg-non-veg-combo-budget-tiffins"
    },
    {
        "Title": "Fiery Grillss Premium Veg & Non-Veg Combo Tiffin Service",
        "Rating": "5.0",
        "Reviews": [
            {
                "text": "Simply the best 😊",
                "date": "09/17/2024",
                "author": "Modi",
                "rating": 5
            }
        ],
        "Prices": {
            "Basic - Weekly": "$64.69",
            "Basic - Monthly": "$243.53",
            "Regular - Weekly": "$73.44",
            "Regular - Monthly": "$276.47",
            "Regular Rice - Weekly": "$73.44",
            "Regular Rice - Monthly": "$276.47",
            "Premium - Weekly": "$84.06",
            "Premium - Monthly": "$316.47",
            "Premium Rice - Weekly": "$84.06",
            "Premium Rice - Monthly": "$316.47",
            "Deluxe - Weekly": "$90.31",
            "Deluxe - Monthly": "$340.00",
            "Deluxe Rice - Weekly": "$90.31",
            "Deluxe Rice - Monthly": "$340.00",
            "Only Curries 1 - Weekly": "$66.56",
            "Only Curries 1 - Monthly": "$250.59"
        },
        "Meal Types": [
            "Basic",
            "Regular",
            "Regular Rice",
            "Premium",
            "Premium Rice",
            "Deluxe",
            "Deluxe Rice",
            "Only Curries 1"
        ],
        "Meal Plans": [
            "Weekly",
            "Monthly"
        ],
        "Delivery Cities": [
            "Oakville",
            "Brampton",
            "Mississauga",
            "Etobicoke",
            "North York",
            "Thornhill",
            "Toronto",
            "Scarborough",
            "East York"
        ],
        "Images": [
            "https://tiffinstash.com/cdn/shop/files/HashtagVeg_Non-VegComboTiffins_0c877bbf-0d41-49bd-ad23-6d10071e491a_1024x1024@2x.png?v=1713261820",
            "https://tiffinstash.com/cdn/shop/files/FGCMBO_eb25d615-0898-4a1d-b71a-c3247c7757d3_1024x1024@2x.png?v=1739147299"
        ],
        "Additional Info": "This seller offers regular Punjabi meals from Mon-Thu and special meals on Fri.",
        "Terms and Conditions": "Cut-off time is 9:00 PM the previous day which means place an order before the cut-off time.\nFlexi Plans: If changes in current orders, skip a delivery, pause the plan, or cancel your plan, kindly inform us before the cut-off time.\nDelivery time may be affected by +/- 60 minutes depending on traffic, road closures and weather conditions.\nExtra items should only be ordered along with a meal plan and from the same seller only.\nRefund Policy: A cancellation fee of $5 on a trial order and $10 on all other orders is applicable.",
        "URL": "https://tiffinstash.com/collections/toronto-tiffin-service/products/fiery-grills-veg-non-veg-combo-tiffins",
        "Phone Number": "+1 647-242-2836"
    }

];

saveScrapedData(scrapedData);
