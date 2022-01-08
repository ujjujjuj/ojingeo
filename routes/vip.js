const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const axios = require("axios");

const router = express.Router();

router.use(isLoggedIn);
router.use((req, res, next) => {
    if (req.user.isFrontman) return res.redirect("/frontman/");
    next();
});

router.get("/", (req, res) => {
    return res.redirect("/dashboard");
});

router.get("/dashboard", (req, res) => {
    // console.log(req.user);
    return res.send("dash")
});

router.get("/testpayment", async (req, res) => {
    const data = await axios.post("https://api.coingate.com/v2/orders", {
        price_amount: 10,
        price_currency: "USD",
        receive_currency: "BTC"
    }, {
        headers: {
            Authorization: `Token ${process.env.COINGATE_API_TOKEN}`
        }
    });
    console.log(data.data);
    return res.send("a")
});

module.exports = router;