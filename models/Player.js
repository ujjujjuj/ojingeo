const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
    {
        _id: Number,
        name: String,
        dob: String,
        pfp: String,
        occupation: String,
        address: String,
        debt: Number,
        isEliminated: {
            type: Number,// 0 = false, 1-6 = level in whihc user was eliminated
            default: 0
        }
    }, { versionKey: false }
);

module.exports = mongoose.model("Player", playerSchema);
