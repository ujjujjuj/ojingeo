const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const isFrontman = require("../middleware/isFrontman");
const Player = require("../models/Player");

const router = express.Router();

router.use("/", isLoggedIn);
router.use("/", isFrontman);

router.get("/players", async (req, res) => {
    const players = await Player.find({});
    console.log(players);
    return res.render("players",{data: players})
});

router.post("/player/new",async (req,res) => {

});

router.post("/player/edit",async (req,res) => {

});

router.get("/players", (req, res) => {
    return res.send("players")
});
router.get("/players", (req, res) => {
    return res.send("players")
});

module.exports = router;