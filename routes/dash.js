const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn")

const router = express.Router();

router.get("/dashboard", isLoggedIn, (req, res) => {
    console.log(req.user);
    return res.send("dash")
})

module.exports = router;