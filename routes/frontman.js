const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const isFrontman = require("../middleware/isFrontman");
const Player = require("../models/Player");
const Worker = require("../models/Worker");
const Game = require("../models/Game");
const fs = require("fs");

const router = express.Router();

router.use("/", isLoggedIn);
router.use("/", isFrontman);

router.get("/", async (req, res) => {
    // const currentGame = await Game.findOne({ isCurrentGame: true }, { game_no: 1 });
    const players = await Player.find({}, { isEliminated: 1 });

    // if (!currentGame) currentGame = { game_no: 0 };

    let deathsPerRound = [0, 0, 0, 0, 0, 0];
    let playersLeft = 0
    for (let player of players) {
        if (player.isEliminated != 0) {
            deathsPerRound[player.isEliminated - 1] += 1;
        } else {
            playersLeft++;
        }
    }

    return res.render("dash",{ 
        playersDead: "playersDead", 
        playersLeft:playersLeft,
        currentGame: ""
     })

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
    // const player = new Player({...req.body.player});
});

router.post("/player/eliminate", async (req, res) => {
    const player = await Player.findOne({ _id: req.body.playerId });
    const currentGame = await Game.findOne({ isCurrentGame: true }, { game_no: 1 });
    try {
        player.isEliminated = currentGame;
        await player.save();
    } catch (e) {
        console.log(e);
        return res.send("database error");
    }

    return res.send("player deleted");
});

router.post("/player/delete", async (req, res) => {

})

router.get("/workers", async (req, res) => {
    const workers = await Worker.find({});
    return res.render('staff',{data:workers});
});

router.get("/games", async (req, res) => {
    const players = await Player.find({}, { isEliminated: 1 });
    const games = await Game.find({});

    // if (!currentGame) currentGame = { game_no: 0 };

    let deathsPerRound = [0, 0, 0, 0, 0, 0];
    // let playersLeft = 0;
    for (let player of players) {
        if (player.isEliminated != 0) {
            deathsPerRound[player.isEliminated - 1] += 1;
        } else {
            // playersLeft++;
        }
    }

    return res.send({ deathsPerRound, games })
});

module.exports = router;