const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const isFrontman = require("../middleware/isFrontman");
const Player = require("../models/Player");
const Worker = require("../models/Worker");
const Game = require("../models/Game");
const fs = require("fs");
const User = require("../models/User");

const router = express.Router();

router.use("/", isLoggedIn);
router.use("/", isFrontman);

router.get("/", async (req, res) => {
    const currentGame = await Game.findOne({ isCurrentGame: true });
    const players = await Player.find({}, { isEliminated: 1 });

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
        mortalityRates.push(deathsPerRound[i] / _players);
        _players -= deathsPerRound[i];
    }

    let playersDead = deathsPerRound.reduce((a, b) => a + b);
    let playersLeft = totalPlayers - playersDead;

    return res.send({ currentGame, playersLeft, playersDead, mortalityRates });

});

router.get("/downloadInfo", async (req, res) => {
    const currentGame = await Game.findOne({ isCurrentGame: true }, { game_no: 1 });
    const players = await Player.find({});

    let filePath;
    if (!currentGame) {
        filePath = __dirname + "/../data/final.csv"
        // games are over
        if (!fs.existsSync(filePath)) {
            // create file
            filedata = "ID,Name,Date of Birth,Occupation,Address,Debt,Games Completed,Photo\n"
            for (let player of players) {
                let gamesCompleted = player.isEliminated == 0 ? currentGame.game_no : player.isEliminated - 1;
                filedata += `${player._id},${player.name},${player.dob},${player.occupation},"${player.address}",${player.debt},${gamesCompleted},${player.pfp}\n`
            }
            fs.writeFileSync(filePath, filedata);
        }
    } else {
        filePath = __dirname + `/../data/game-${currentGame.game_no}.csv`;
        if (!fs.existsSync(filePath)) {
            // create file
            filedata = "ID,Name,Date of Birth,Occupation,Address,Debt,Games Completed,Photo\n"
            for (let player of players) {
                let gamesCompleted = player.isEliminated == 0 ? currentGame.game_no : player.isEliminated - 1;
                filedata += `${player._id},${player.name},${player.dob},${player.occupation},"${player.address}",${player.debt},${gamesCompleted},${player.pfp}\n`
            }
            fs.writeFileSync(filePath, filedata);
        }
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

    const player = new Player({
        _id: lastPlayer[0]._id + 1,
        name: req.body.name,
        gender: req.body.gender,
        debt: req.body.debt
    })

    await player.save()
    return res.send(player)
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

router.get("/games", async (req, res) => {
    const players = await Player.find({}, { isEliminated: 1 });
    const games = await Game.find({});

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
        mortalityRates.push(deathsPerRound[i] / _players);
        _players -= deathsPerRound[i];
    }

    return res.render("frontmanGames", { data: { deathsPerRound, games, totalPlayers, mortalityRates } })
});

router.post("/games/next", async (req, res) => {
    const lastGame = await Game.findOne({ isCurrentGame: true });
    const users = await User.find({});

    lastGame.isCurrentGame = false
    const nextGame = await Game.findOne({ game_no: lastGame.game_no + 1 });
    if (nextGame) {
        nextGame.isCurrentGame = true;
        await nextGame.save();
    }

    // process bets
    for (let user of users) {
        if (user.isFrontman) continue;

        if (user.bets[lastGame.game_no]) {
            for (let bet of user.bets[lastGame.game_no]) {
                const player = await Player.findOne({ _id: bet[0] });
                if (player.isEliminated > 0) {
                    user.money += bet[1];
                }
            }
            await user.save();
        }
    }

    return res.redirect(req.originalUrl);
});

module.exports = router;