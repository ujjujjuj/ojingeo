const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
    {
        _id: Number,
        name: String,
        dob: String,
        occupation: String,
        address: String,
        task: String,
        role: String
    }, { versionKey: false }
);

module.exports = mongoose.model("Worker", workerSchema);
