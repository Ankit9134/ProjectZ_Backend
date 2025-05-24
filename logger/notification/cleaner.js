const Notify = require("../../models/logs/notify");

// async function clearNotification() {
//   setInterval(async function () {
//     await Notify.deleteMany();
//   }, 30 * 24 * 60 * 60 * 1000);
// }

async function getNotification() {
  const all = await Notify.find();
  return all;
}

module.exports = { getNotification };
