const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const isFrontman = require("../middleware/isFrontman");
const Player = require("../models/Player");
const Worker = require("../models/Worker");
const Game = require("../models/Game");
const fs = require("fs");
const User = require("../models/User");
const { createTransaction } = require("../helpers/bitcoinHelper")
const { resetDatabase } = require('../db')
const router = express.Router();

router.use("/", isLoggedIn);
router.use("/", isFrontman);

router.get("/", async (req, res) => {
    const currentGame = await Game.findOne({ isCurrentGame: true });
    const players = await Player.find({}, { isEliminated: 1 });
    const users = await User.find({ isFrontman: false });
    let payment = 0;
    for (let user of users) {
        payment -= user.money // TODO : change this to user.money
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
        mortalityRates.push(100 * deathsPerRound[i] / _players);
        _players -= deathsPerRound[i];
    }

    let playersDead = deathsPerRound.reduce((a, b) => a + b);
    let playersLeft = totalPlayers - playersDead;

    return res.render("dash", { currentGame, playersLeft, playersDead, mortalityRates,payment });

});

router.get("/downloadinfo", async (req, res) => {
    const currentGame = await Game.findOne({ isCurrentGame: true }, { game_no: 1 });
    const players = await Player.find({});

    let filePath;
    if (!currentGame) {
        filePath = __dirname + "/../data/final.csv"
        // games are over
        filedata = "ID,Name,Date of Birth,Occupation,Address,Debt,Games Completed,Photo\n"
        for (let player of players) {
            let gamesCompleted = player.isEliminated == 0 ? currentGame.game_no : player.isEliminated - 1;
            filedata += `${player._id},${player.name},${player.dob},${player.occupation},"${player.address}",${player.debt},${gamesCompleted},${player.pfp}\n`
        }
        fs.writeFileSync(filePath, filedata);
    } else {
        filePath = __dirname + `/../data/game-${currentGame.game_no}.csv`;
        filedata = "ID,Name,Date of Birth,Occupation,Address,Debt,Games Completed,Photo\n"
        for (let player of players) {
            let gamesCompleted = player.isEliminated == 0 ? currentGame.game_no : player.isEliminated - 1;
            filedata += `${player._id},${player.name},${player.dob},${player.occupation},"${player.address}",${player.debt},${gamesCompleted},${player.pfp}\n`
        }
        fs.writeFileSync(filePath, filedata);
    }
    return res.download(filePath);
});

router.get("/players", async (req, res) => {
    const players = await Player.find({});
    // console.log(players);
    return res.render("players", { data: players });
});

router.post("/player/new", async (req, res) => {
    const lastPlayer = await Player.find().sort({ _id: -1 }).limit(1);

    const randomIndex = Math.floor(Math.random() * 100)
    const player = new Player({
        _id: lastPlayer[0]._id + 1,
        name: req.body.name,
        gender: req.body.gender,
        pfp: `https://randomuser.me/api/portraits/${(req.body.gender.toLowerCase().includes("fem") || req.body.gender.toLowerCase().includes("wom")) ? "women" : "men"}/${randomIndex}.jpg`,
        debt: req.body.debt
    })

    await player.save()
    return res.redirect("/frontman/players");
});

router.post("/player/eliminate", async (req, res) => {
    const player = await Player.findOne({ _id: req.body.playerId });
    const currentGame = await Game.findOne({ isCurrentGame: true }, { game_no: 1 });

    player.isEliminated = currentGame.game_no;
    await player.save();

    return res.send("player deleted");
});


router.get("/workers", async (req, res) => {
    const workers = await Worker.find({});
    return res.render('staff', { data: workers });
});

router.post("/worker/new", async (req, res) => {
    const lastPlayer = await Worker.find().sort({ _id: -1 }).limit(1);
    const worker = new Worker({
        _id: lastPlayer[0]._id + 1,
        name: req.body.name,
        role: req.body.designation,
        task: req.body.task
    });

    await worker.save();

    return res.redirect("/frontman/workers");
});

router.post("/worker/edit", async (req, res) => {
    const worker = await Worker.findOne({ _id: req.body.id });
    worker.task = req.body.task;
    await worker.save();

    return res.redirect("/frontman/workers");
})

router.get("/games", async (req, res) => {
    const players = await Player.find({}, { isEliminated: 1 });
    const currentGame = await Game.findOne({ isCurrentGame: true });

    // if (!currentGame) currentGame = { game_no: 0 };

    let deathsPerRound = [0, 0, 0, 0, 0, 0];
    let totalPlayers = 0;
    for (let player of players) {
        totalPlayers++;
        if (player.isEliminated != 0) {
            deathsPerRound[player.isEliminated - 1] += 1;
        }
    }
    let mortalityRate = [];
    let _players = totalPlayers;
    for (let i = 0; i < deathsPerRound.length; i++) {
        mortalityRate.push((100 * deathsPerRound[i] / _players).toFixed(2));
        _players -= deathsPerRound[i];
    }
    let playersDead = deathsPerRound.reduce((a, b) => a + b);

    return res.render("games", { playersDead, mortalityRate, currentGame })
});

router.get("/games/next", async (req, res) => {
    const lastGame = await Game.findOne({ isCurrentGame: true });
    const users = await User.find({ isFrontman: false });
    const players = await Player.find({});

    lastGame.isCurrentGame = false
    await lastGame.save()
    const nextGame = await Game.findOne({ game_no: lastGame.game_no + 1 });
    if (nextGame) {
        nextGame.isCurrentGame = true;
        await nextGame.save();
    } else{
      await resetDatabase();
      return res.redirect("/");
    }   

    // process bets
    for (let user of users) {
        if (user.bets && user.bets[lastGame.game_no]) {
            for (let playerId in user.bets[lastGame.game_no]) {
                if (players[parseInt(playerId) - 1].isEliminated > 0) {
                    user.money -= user.bets[lastGame.game_no][playerId]
                } else {
                    user.money += user.bets[lastGame.game_no][playerId]
                }
            }
        }
        await user.save();
    }

    return res.redirect("/frontman/games");
});

router.get("/settlepayments", async (req, res) => {
    const users = await User.find({ isFrontman: false });
    let paymentsList = [];
    for (let user of users) {
        if (user.money <= 0) continue;

        paymentsList.push([user.walletAddress, 1000]) // TODO : change this to user.money
        user.money = 0;
        await user.save()
    }

    const resp = await createTransaction(paymentsList);
    console.log(resp);

    return res.redirect("/frontman")
})

module.exports = router;