const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
    {
        _id: String,
        name: String,
        game_no:Number,
        isCurrentGame:{
            type:Boolean,
            default:false
        },
        description: String
    }, { versionKey: false }
);

module.exports = mongoose.model("Game", gameSchema);
