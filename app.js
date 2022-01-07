const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const accessCode = require("./middleware/accessCode.js");

const db = require("./db")
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(accessCode);

app.use("/auth", require("./routes/auth.js"));
app.use("/", require("./routes/dash.js"));
app.use("/admin", require("./routes/admin.js"));

app.get("/", (req, res) => {
    return res.send("index");
});

const isProduction = process.env.NODE_ENV == "production";
if (!process.env.PORT) process.env.PORT = isProduction ? 80 : 3000;
db(() => {
    app.listen(process.env.PORT, () => {
        console.log(`server is listening on port ${process.env.PORT}`);
    });
});
