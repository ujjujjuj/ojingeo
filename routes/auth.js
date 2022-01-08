const express = require("express");
const User = require("../models/User");
const crypto = require("crypto");

const router = express.Router();

router.get("/login", (req, res) => {
    return res.render("login");
});

router.get("/logout", (req, res) => {
    res.cookie("auth", "goodybe", { maxAge: 0, signed: true });
    res.redirect("/auth/login")
});

router.get("/register", (req, res) => {
    return res.render("register");
})

router.post("/login", async (req, res) => {
    if (!req.body.username || !req.body.password) return res.render("login", { error: "invalid parameters" });

    let user = await User.findOne({ _id: req.body.username });
    if (!user) {
        return res.render("login", { error: "User does not exist." });
    }

    const hashedPassword = crypto.createHash('sha256').update(req.body.password).digest('hex');
    if (user.password != hashedPassword) {
        return res.render("login", { error: "Incorrect password" });
    }

    res.cookie("auth", req.body.username, { signed: true, maxAge: 1000 * 60 * 60 * 48 });
    if (user.isFrontman) {
        return res.redirect("/frontman")
    } else {
        return res.redirect("/vip");
    }
})


router.post("/register", async (req, res) => {
    if (!req.body.username || !req.body.password) return res.render("login", { error: "invalid parameters" });

    let user = await User.findOne({ _id: req.body.username });
    if (user) return res.render("register", { error: "user already exists" });

    const hashedPassword = crypto.createHash('sha256').update(req.body.password).digest('hex');
    user = new User({
        _id: req.body.username,
        password: hashedPassword,
        walletAddress: walletAddress
    });
    try {
        await user.save();
    } catch (e) {
        console.log(e);
        return res.render("register", { error: "database erro1r" });
    }

    res.cookie("auth", req.body.username, { signed: true, maxAge: 1000 * 60 * 60 * 48 });
    return res.redirect("/vip");
})

module.exports = router;