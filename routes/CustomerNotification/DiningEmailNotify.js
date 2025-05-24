const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user:"eee",
        pass:"cc" // Replace with your email password or app password
    },
});

// Function to send a confirmation email
const sendConfirmationEmail = async (userEmail, username, bookingDate, timeSlot, offerName, offerCode, offerPercentage, moreInfo) => {
    const mailOptions = {
        from: `Zomato venkatreddy30301@gmail.com`,
        to: userEmail,
        subject: "🍽️ Your Booking is Confirmed!",
        html: `
            <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
                <div style="max-width: 600px; background: white; padding: 20px; border-radius: 10px;
                            box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); text-align: center;">
                    <div style="background: #ff6b00; color: white; padding: 15px; font-size: 22px; font-weight: bold;
                                border-radius: 10px 10px 0 0;">
                        🍔 Your Booking Order is Confirmed! 🎉
                    </div>
                    <p>Hi <strong>${username}</strong>,</p>
                    <p>Thank you for your booking! Here are your details:</p>
                   
                    <div style="text-align: left; margin: 20px 0; padding: 15px; background: #fff8e1; border-radius: 8px;">
                        <p><strong>📅 Booking Date:</strong> ${bookingDate}</p>
                        <p><strong>⏰ Time Slot:</strong> ${timeSlot}</p>
                        <p><strong>🍽️ Offer Name:</strong> ${offerName}</p>
                        <p><strong>🔖 Offer Code:</strong> <span style="background: #ffcc00; padding: 10px; border-radius: 5px; font-weight: bold;">${offerCode}</span></p>
                        <p><strong>💰 Discount:</strong> ${offerPercentage}% off</p>
                        <p><strong>ℹ️ More Info:</strong> ${moreInfo}</p>
                    </div>

                    <p>🚀 Your delicious meal is on its way! Track your order in the app.</p>

                    <a href="https://your-tracking-link.com" style="background: #ff6b00; color: white; text-decoration: none; padding: 12px 20px;
                        border-radius: 5px; display: inline-block; margin-top: 15px; font-size: 18px; font-weight: bold;">
                        📍 Track Order
                    </a>

                    <div style="margin-top: 20px; font-size: 14px; color: gray;">
                        Need help? Contact us at <a href="mailto:support@foodieexpress.com">support@foodieexpress.com</a>  
                    </div>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};


const sendCancelationEmail = async (userEmail, username, bookingDate, timeSlot, offerName, offerCode, offerPercentage, moreInfo) => {
    const mailOptions = {
        from: `Zomato ${process.env.MY_EMAIL}`,
        to: userEmail,
        subject: "🚫 Booking Cancelled - Zomato",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 30px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);">
                    <div style="background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h2 style="margin: 0; font-size: 28px; font-weight: 600;">Booking Cancelled 😔</h2>
                        <p style="margin-top: 10px; font-size: 16px;">We're sorry, ${username}, your booking has been cancelled.</p>
                    </div>
                    <div style="padding: 20px 0;">
                        <p style="font-size: 16px;">Dear <strong>${username}</strong>,</p>
                        <p style="font-size: 16px;">We regret to inform you that your booking for the following details has been cancelled:</p>
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
                            <p style="margin: 8px 0; font-size: 15px;"><strong>📅 Booking Date:</strong> ${bookingDate}</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>⏰ Time Slot:</strong> ${timeSlot}</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>🍽️ Offer Name:</strong> ${offerName}</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>🔖 Offer Code:</strong> <span style="background: #ffe082; padding: 8px 12px; border-radius: 5px; font-weight: 600;">${offerCode}</span></p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>💰 Discount:</strong> ${offerPercentage}% off</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>ℹ️ More Info:</strong> ${moreInfo}</p>
                        </div>
                        <p style="margin-top: 20px; font-size: 16px;">We understand this may be disappointing, and we apologize for any inconvenience caused.</p>
                        <p style="margin-top: 10px; font-size: 16px;">If you have any questions or would like to rebook, please contact our support team.</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="mailto:support@foodieexpress.com" style="background: #3498db; color: white; padding: 15px 25px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Contact Support</a>
                    </div>
                    <div style="text-align: center; margin-top: 25px; font-size: 14px; color: #777;">
                        <p>Thank you for using FoodieExpress.</p>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

const sendPendingConfirmationEmail = async (userEmail, username, bookingDate, timeSlot, offerName) => {
    const mailOptions = {
        from: `Zomato ${process.env.MY_EMAIL}`,
        to: userEmail,
        subject: "⏳ Booking Pending Confirmation - Zomato",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 30px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);">
                    <div style="background: #f39c12; color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h2 style="margin: 0; font-size: 28px; font-weight: 600;">Booking Pending ⌛</h2>
                        <p style="margin-top: 10px; font-size: 16px;">Hi ${username}, your booking is awaiting confirmation.</p>
                    </div>
                    <div style="padding: 20px 0;">
                        <p style="font-size: 16px;">Dear <strong>${username}</strong>,</p>
                        <p style="font-size: 16px;">Thank you for placing your booking! We are currently processing your request and will notify you as soon as it's confirmed.</p>
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
                            <p style="margin: 8px 0; font-size: 15px;"><strong>📅 Booking Date:</strong> ${bookingDate}</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>⏰ Time Slot:</strong> ${timeSlot}</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>🍽️ Offer Id:</strong> ${offerName}</p>
                            
                        </div>
                        <p style="margin-top: 20px; font-size: 16px;">We appreciate your patience. We will send you a confirmation email once your booking is approved.</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="mailto:support@foodieexpress.com" style="background: #3498db; color: white; padding: 15px 25px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Contact Support</a>
                    </div>
                    <div style="text-align: center; margin-top: 25px; font-size: 14px; color: #777;">
                        <p>Thank you for using Zomato.</p>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports={sendConfirmationEmail,sendCancelationEmail,sendPendingConfirmationEmail}