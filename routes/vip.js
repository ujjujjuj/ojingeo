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
    return res.render("profile", { money: req.user.money, name: req.user._id, walletAddress: req.user.walletAddress });
});

router.get("/players", async (req, res) => {
    const players = await Player.find({});
    const users = await User.find({ isFrontman: false });
    const currentGame = await Game.findOne({ isCurrentGame: true });

    let betsArr = {};
    for (let user of users) {
        if (user.bets && user.bets[currentGame.game_no]) {
            for (let playerId in user.bets[currentGame.game_no]) {
                if (!betsArr[playerId]) {
                    betsArr[playerId] = [0, 0];
                }
                let betAmount = user.bets[currentGame.game_no][playerId];
                if (betAmount > 0) {
                    betsArr[playerId][0] += betAmount
                } else {
                    betsArr[playerId][1] += betAmount * -1;
                }
            }
        }
    }
    console.log(betsArr);

    // console.log(players);
    return res.render("vipPlayers", { data: players, betsArr });
});

router.get("/games", async (req, res) => {
    const players = await Player.find({}, { isEliminated: 1 });
    const games = await Game.find({});

    let gamesArr = [];
    for (let game of games) {
        gamesArr.push(game);
        if (game.isCurrentGame) break;
    }

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

    return res.render("vipGames", { data: { deathsPerRound: deathsPerRound.slice(0, gamesArr.length).reverse(), games: gamesArr.reverse(), totalPlayers, mortalityRates: mortalityRates.slice(0, gamesArr.length).reverse() } })
})

router.post("/bet", async (req, res) => {
    const currentGame = await Game.findOne({ isCurrentGame: true });
    if (!req.user.bets[currentGame.game_no]) {
        req.user.bets[currentGame.game_no] = {}
    }
    if(req.user.bets[currentGame.game_no][req.body.playerId]){
        return res.json({error:true,message:"You have already placed a bet on this player"});
    }
    req.user.bets[currentGame.game_no][req.body.playerId] = parseInt(req.body.betAmount);
    req.user.markModified('bets');
    await req.user.save();
    // console.log(req.user.bets);
    return res.json({error:false,message:"Bet placed successfully!"})
});


module.exports = router;