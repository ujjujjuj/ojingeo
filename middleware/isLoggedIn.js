const User = require("../models/User");


const isLoggedIn = async (req, res, next) => {
    if (!req.signedCookies.auth) return res.redirect("/logout");

    const user = await User.findOne({ _id: req.signedCookies.auth });
    if (!user) return res.redirect("/logout");  // if user is manually deleted

    req.user = user;
    next();
}

module.exports = isLoggedIn;