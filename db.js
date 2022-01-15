const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("./models/User.js");
const Player = require("./models/Player.js");
const Game = require("./models/Game.js");
const Worker = require("./models/Worker.js");

const initDatabase = async () => {
    console.log("initializing database...");
    let admin = new User({
        _id: "frontman",
        password: crypto.createHash('sha256').update(process.env.FRONTMAN_PASS).digest('hex'),
        isFrontman: true
    });
    await admin.save();

    let vip = new User({
        _id: "vipvip",
        password: crypto.createHash('sha256').update(process.env.VIP_PASS).digest('hex'),
        walletAddress: process.env.VIP_WALLET
    })
    await vip.save();
    const players = require("./data/players.json")
    for (let i = 0; i < players.rows.length; i++) {
        let firstName = players.rows[i].name.split(" ")[0];
        // let gender = ["men","women"][Math.floor(Math.random()*2)]
        let gender = ["a", "e", "i", "o", "u"].includes(firstName[firstName.length - 1]) ? "female" : "male";  // statistics :thumbsup: 

        const record = new Player({ _id: i + 1, ...players.rows[i], pfp: `https://randomuser.me/api/portraits/${gender == "male" ? "men" : "women"}/${i % 100}.jpg`, gender: gender });
        await record.save();
    }

    const games = require("./data/games.json");
    for (let i = 0; i < games.rows.length; i++) {
        const record = new Game({ _id: games.rows[i].uuid, ...games.rows[i] });
        if (i == 0) record.isCurrentGame = true;
        await record.save();
    }

    const workers = require("./data/workers.json");
    const tasksArray = ["Disposal", "Maintenance", "Food Distribution", "Elimination", "Patrol", "Venue Preparation"];
    const rolesArray = ["Manager", "Guard", "Utility"]
    for (let i = 1; i <= workers.rows.length; i++) {
        let task = tasksArray[Math.floor(Math.random() * tasksArray.length)];
        let role = rolesArray[Math.floor(Math.random() * rolesArray.length)];
        const record = new Worker({ ...workers.rows[i], role: role, task: task, _id: i });
        await record.save()
    }

    console.log("done");
    
}

module.exports.resetDatabase = async () => {
    await mongoose.connection.db.dropDatabase();
    await initDatabase()
};


module.exports.start = callback => {
    mongoose.connect(process.env.NODE_ENV == "production" ? process.env.DB_URL : "mongodb://localhost:27017/ojingeo", async () => {
        let admin = await User.findOne({ _id: "frontman" });
        if (!admin) await initDatabase();
        callback();
    });
}
