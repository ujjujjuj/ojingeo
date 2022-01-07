const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto")
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const accessCode = require("./middleware/accessCode.js");
const User = require("./models/User.js");
const Player = require("./models/Player.js");
const Game = require("./models/Game.js");
const Worker = require("./models/Worker.js");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(accessCode);

app.use("/auth", require("./routes/auth.js"));
app.use("/", require("./routes/dash.js"));

app.get("/", (req, res) => {
    return res.send("index");
});


const initDatabase = async () => {
    let admin = new User({
        _id: "frontman",
        password: crypto.createHash('sha256').update(process.env.FRONTMAN_PASS).digest('hex'),
        isFrontman: true
    });
    await admin.save();

    const players = require("./data/players.json")
    for (let i = 0; i < players.rows.length; i++) {
        const record = new Player({ _id: i + 1, ...players.rows[i] });
        await record.save()
    }

    const games = require("./data/games.json")
    for (let game of games.rows) {
        const uuid = game.uuid
        delete game.uuid
        const record = new Game({ _id: uuid, ...game });
        await record.save()
    }

    const workers = require("./data/workers.json")
    for (let i = 1; i <= workers.rows.length; i++) {
        const record = new Worker({ ...workers.rows[i] });
        await record.save()
    }
}

const isProduction = process.env.NODE_ENV == "production";
mongoose.connect(isProduction ? process.env.DB_URL : "mongodb://localhost:27017/iitg-2021", async () => {
    process.env.PORT = isProduction ? (process.env.PORT || 3000) : 3000;

    let admin = await User.findOne({ _id: "frontman" });
    if (!admin) initDatabase();

    app.listen(process.env.PORT, () => {
        console.log(`server is listening on port ${process.env.PORT}`);
    });
});