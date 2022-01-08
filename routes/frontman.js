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

    let playersLeft = 0;
    let playersDead = 0;
    for (let player of players) {
        if (player.isEliminated != 0) {
            playersDead++;
        } else {
            playersLeft++;
        }
    }

    return res.send({ currentGame, playersLeft, playersDead });

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
    return res.render("players",{data:players});  
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
    return res.render('staff',{data:workers});
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

    return res.render("frontmanGames", { data: { deathsPerRound, games, totalPlayers } })
});

router.post("/games/next", async (req, res) => {
    const games = await Game.findOne({});
    const users = await User.find({});

    let lastGame = 0;
    for (let i = 0; i < games.length; i++) {
        if (games[i].isCurrentGame) {
            lastGame = i + 1;
            games[i].isCurrentGame = false;
            await games[i].save();
            if (i != games.length - 1) {
                games[i + 1].isCurrentGame = true;
                await games[i + 1].save();
            }
        }
    }

    // process bets
    for (let user of users) {
        if (user.isFrontman) continue;

        if (user.bets[lastGame]) {
            for (let bet of user.bets[lastGame]) {
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