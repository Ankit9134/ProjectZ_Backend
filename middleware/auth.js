// const authMiddleware = (req, res, next) => {
//   // Check if the user is authenticated via session or OAuth (req.user from Passport.js)
//   if (req.session && req.session.user) {
//     return next();
//   }
//   // Check if the user is authenticated via OAuth (Google, Facebook, Twitter)
//   if (req.isAuthenticated() && req.user) {
//     return next(); // If OAuth authentication exists, proceed to the next middleware
//   }

//   // If no session or OAuth authentication, return Unauthorized error
//   return res.status(401).json({ error: "Unauthorized access. Please log in." });
// };

// module.exports = authMiddleware;

const authMiddleware = (req, res, next) => {
  // Check if the user is authenticated via session
  if (req.session && req.session.user) {
    console.log("Session-based authentication successful.");
    return next();
  }

  // If no session or OAuth authentication, return Unauthorized error
  console.log("Unauthorized access attempt.");
  // return res.status(401).json({ error: "Unauthorized access. Please log in." });
  return res.redirect(`${process.env.FRONTEND_URL}`);
};

module.exports = authMiddleware;
