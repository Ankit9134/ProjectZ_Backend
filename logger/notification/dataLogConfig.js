const { notify } = require("../index.js");

// const meta = {
//   action: update | delete | add
// actor: who make the change
//   target: {
//     model: User,
//     id: XXX
//   }
// }

function LogNotification(Lvl, message, meta = {}) {
  notify[Lvl](message, meta);
}

module.exports = LogNotification;
