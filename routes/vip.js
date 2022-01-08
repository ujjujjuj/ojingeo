const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const axios = require("axios");
const { route } = require("./frontman");
const User = require("../models/User");

const router = express.Router();

router.use(isLoggedIn);
router.use((req, res, next) => {
    if (req.user.isFrontman) return res.redirect("/frontman/");
    next();
});

router.get("/", (req, res) => {
    // console.log(req.user);
    return res.send("dash")
});

router.post("/bet", async (req, res) => {
    const currentGame = await Game.findOne({ isCurrentGame: true }, { game_no: 1 });
    if (!req.user.bets[currentGame.game_no]) {
        req.user.bets[currentGame.game_no] = []
    }
    req.user.bets[currentGame.game_no].append(req.body.playerNumber, req.body.betAmount);
    await req.user.save();

    return res.send("success");
})

module.exports = router;