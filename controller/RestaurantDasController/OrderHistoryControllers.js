const cron = require('node-cron');
const OrderTakeAway = require("../../models/UserOrderTakeaway");
const Bookings = require("../../models/RestaurantsDasModel/Booking");
const OrderHistory = require("../../models/RestaurantsDasModel/History");
const Connect = require("../../config/database.config.js");

Connect();

// Function to parse the date and time slot
const getOrderDateFromTimeSlot = async (orderDate, timeSlot) => {
    const orderDatenew = new Date(orderDate);
    const [time, period] = timeSlot?.split(' ');
    let [hours, minutes] = time?.split(':');
    if (period === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (period === 'AM' && hours === '12') hours = 0;

    orderDatenew.setHours(hours);
    orderDatenew.setMinutes(minutes);
    orderDatenew.setSeconds(0);
    orderDatenew.setMilliseconds(0);

    return orderDatenew;
};

// Function to save order as history
const saveOrderAsHistory = async (order, mode, orderTime) => {
    try {
        await OrderHistory.create({
            username: order.username || order.userId?.username,
            mode,
            items: mode === "takeaway" 
                ? order.items.map(item => ({
                    productId: item.productId._id,
                    restaurantName: item.restaurantName._id,
                }))
                : order.items || [],
            totalPrice: order.totalPrice || 0,
            status: order.status,
            orderTime,
        });

        console.log(`Order from ${mode} moved to history:`, order._id);
        await (mode === "dining" ? Bookings : OrderTakeAway).findByIdAndUpdate(order._id, { history: true }, { new: true });
    } catch (error) {
        console.error(`Error saving order as history for ${mode}:`, error.message);
    }
};

// Dining Orders Cron Job
const diningOrdersCron = () => {
cron.schedule('0 0,12 * * *', async () => {
    console.log("Dining orders cron job started at:", new Date());
    try {
        const now = new Date();
        const expireOrders = await Bookings.find({history:false});

        for (const order of expireOrders) {
            const orderTime = order.timeSlot 
                ? await getOrderDateFromTimeSlot(order.date, order.timeSlot) 
                : new Date(order.date);

            if (now >= orderTime) await saveOrderAsHistory(order, "dining", orderTime);
        }
    } catch (error) {
        console.error("Error in dining orders cron job:", error.message);
    }
});
}

// Takeaway Orders Cron Job
const takeawayOrdersCron = () => {
cron.schedule('0 0,12 * * *', async () => {
    console.log("Takeaway orders cron job started at:", new Date());
    try {
        const now = new Date();
        const activeOrders = await OrderTakeAway.find({histroy:false})
            .populate({
                path: "items.productId",
                select: "name price category description",
            })
            .populate({
                path: "items.restaurantName",
                model: "Firm",
                select: "restaurantInfo.name restaurantInfo.country restaurantInfo.address",
            })
            .populate({
                path: "userId",
                model: "User",
                select: "username email",
            });

        for (const order of activeOrders) {
            const orderTime = new Date(order.orderTime);
            if (now >= orderTime) await saveOrderAsHistory(order, "takeaway", orderTime);
        }
    } catch (error) {
        console.error("Error in takeaway orders cron job:", error.message);
    }
});
}

// Fetch Order History
exports.getHistory = async () => {
    try {
        const history = await OrderHistory.find({});
        return history;
    } catch (error) {
        console.error("Error fetching order history:", error);
        throw error;
    }
};

module.exports = { getOrderDateFromTimeSlot };



// // Dining Orders Cron Job
// const diningOrdersCron = () => {
//     cron.schedule("33 10,12 * * *", async () => {
//         console.log("Dining orders cron job started at:", new Date());
//         try {
//             const now = new Date();
//             const expireOrders = await Bookings.find({});
//             console.log("Fetched dining orders:", expireOrders);

//             for (const order of expireOrders) {
//                 let orderTime = order.timeSlot
//                     ? await getOrderDateFromTimeSlot(order.date, order.timeSlot)
//                     : new Date(order.date);

//                 if (now >= orderTime) {
//                     try {
//                         await OrderHistroyController(
//                             order.username,
//                             "dining",
//                             order.items || [],
//                             order.totalPrice || 0,
//                             order.status,
//                             orderTime
//                         );
//                         console.log("Order moved to history.");
//                     } catch (error) {
//                         console.error("Error in OrderHistroyController for dining order:", error.message);
//                     }

//                     await Bookings.findByIdAndUpdate(order._id, { history: true }, { new: true });
//                 }
//             }
//         } catch (error) {
//             console.error("Error in dining orders cron job:", error.message);
//         }
//     });
// };

// Takeaway Orders Cron Job
// const takeawayOrdersCron = () => {
//     cron.schedule("33 10,12 * * *", async () => {
//         console.log("Takeaway orders cron job started at:", new Date());
//         try {
//             const now = new Date();
//             const activeOrders = await OrderTakeAway.find({})
//                 .populate({
//                     path: "items.productId",
//                     model: "MenuItem",
//                     select: "name price category description",
//                 })
//                 .populate({
//                     path: "items.restaurantName",
//                     model: "Firm",
//                     select: "restaurantInfo.name restaurantInfo.country restaurantInfo.address",
//                 })
//                 .populate({
//                     path: "userId",
//                     model: "User",
//                     select: "username email",
//                 });

//             console.log("Fetched takeaway orders:", activeOrders);

//             for (const order of activeOrders) {
//                 const orderTime = new Date(order.orderTime);
//                 if (now >= orderTime) {
//                     try {
//                         await OrderHistroyController(
//                             order.userId.username.toString(),
//                             "takeaway",
//                             order.items.map(item => ({
//                                 productId: item.productId._id,
//                                 restaurantName: item.restaurantName._id,
//                             })),
//                             order.totalPrice,
//                             order.status,
//                             order.orderTime
//                         );
//                         console.log("Order moved to history.");
//                     } catch (error) {
//                         console.error("Error in OrderHistroyController for takeaway order:", error.message);
//                     }

//                     await OrderTakeAway.findByIdAndUpdate(order._id, { history: true }, { new: true });
//                 }
//             }
//         } catch (error) {
//             console.error("Error in takeaway orders cron job:", error.message);
//         }
//     });
// };

module.exports = { diningOrdersCron, takeawayOrdersCron };
