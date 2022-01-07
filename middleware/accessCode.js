const code = "dx3"

module.exports = (req, res, next) => {
    if (req.cookies.accessCode == code) return next();

    if (req.body.accessCode == code) {
        res.cookie("accessCode", code, { maxAge: 1000 * 60 * 99999 }); // TODO: change expiry to 30 min
        res.redirect("/");
    } else if (req.body.accessCode) {
        res.render("accessCode", { "error": "invalid code" });
    } else {
        res.render("accessCode");
    }

}