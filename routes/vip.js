const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const axios = require("axios");
const { route } = require("./frontman");
const User = require("../models/User");
const Player = require("../models/Player");
const Game = require("../models/Game");

const router = express.Router();

router.use(isLoggedIn);
router.use((req, res, next) => {
    if (req.user.isFrontman) return res.redirect("/frontman/");
    next();
});

router.get("/", (req, res) => {
    // console.log(req.user);
    return res.render("vipDashboard");
});

router.get("/players", async (req, res) => {
    const players = await Player.find({});
    // console.log(players);
    return res.render("vipPlayers", { data: players });
});

router.get("/games", async (req, res) => {
    const players = await Player.find({}, { isEliminated: 1 });
    const games = await Game.find({});
    let gamesArr = [];
    for (let game of games) {
        gamesArr.push(game);
        if (game.isCurrentGame) break;
    }
    gamesArr.reverse()

    // if (!currentGame) currentGame = { game_no: 0 };

    let deathsPerRound = [0, 0, 0, 0, 0, 0];
    let totalPlayers = 0;
    for (let player of players) {
        totalPlayers++;
        if (player.isEliminated != 0) {
            deathsPerRound[player.isEliminated - 1] += 1;
        }
    }
    let mortalityRates = [];
    let _players = totalPlayers;
    for (let i = 0; i < deathsPerRound.length; i++) {
        mortalityRates.push((100 * deathsPerRound[i] / _players).toFixed(2));
        _players -= deathsPerRound[i];
    }

    return res.render("vipGames", { data: { deathsPerRound, games: gamesArr, totalPlayers, mortalityRates } })
})

router.post("/bet", async (req, res) => {
    const currentGame = await Game.findOne({ isCurrentGame: true });
    if (!req.user.bets[currentGame.game_no]) {
        req.user.bets[currentGame.game_no] = []
    }
    req.user.bets[currentGame.game_no].append(req.body.playerId, req.body.betAmount);
    await req.user.save();

    return res.send("success");
})



module.exports = router;