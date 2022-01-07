const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const crypto = require("crypto");

const router = express.Router();

router.get("/login", (req, res) => {
    return res.render("login");
});

router.get("/logout", (req, res) => {
    res.cookie("auth", "goodybe", { maxAge: 0, signed: true });
    res.redirect("/auth")
});

router.get("/register", (req, res) => {
    return res.render("register");
})

router.post("/login", async (req, res) => {
    if (!req.body.username || !req.body.password) return res.render("login", { error: "invalid parameters" });

    let user = await User.findOne({ _id: req.body.username });
    if (!user) {
        return res.render("login", { error: "user does not exist" });
    }

    const hashedPassword = crypto.createHash('sha256').update(req.body.password).digest('hex');
    if (user.password != hashedPassword) {
        return res.render("login", { error: "incorrect password" });
    }

    res.cookie("auth", req.body.username, { signed: true, maxAge: 1000 * 60 * 60 * 48 });
    return res.redirect("/");
})


router.post("/register", async (req, res) => {
    if (!req.body.username || !req.body.password) return res.render("login", { error: "invalid parameters" });

    let user = await User.findOne({ _id: req.body.username });
    if (user) return res.render("register", { error: "user already exists" });

    const hashedPassword = crypto.createHash('sha256').update(req.body.password).digest('hex');
    user = new User({
        _id: req.body.username,
        password: hashedPassword
    });
    try {
        await user.save();
    } catch (e) {
        console.log(e);
        return res.render("register", { error: "database erro1r" });
    }

    res.cookie("auth", req.body.username, { signed: true, maxAge: 1000 * 60 * 60 * 48 });
    return res.redirect("/");
})

module.exports = router;