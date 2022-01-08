const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        _id: String,
        password: String,
        isFrontman: {
            type: Boolean,
            default: false
        },
        walletAddress: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        bets: {
            type: Object,
            default: {}
        },
        money:{
            type:Number,
            default:0
        }
    }, { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
