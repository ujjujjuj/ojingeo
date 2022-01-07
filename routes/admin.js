const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn")
const isFrontman = require("../middleware/isFrontman")

const router = express.Router();

router.use("/",isLoggedIn)
router.use("/",isFrontman)

router.get("/", (req, res) => {
    console.log(req.user);
    return res.send("dash")
})

module.exports = router;