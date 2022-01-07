module.exports = (req, res, next) => {
    if (req.user && req.user.isFrontman) return next();
    return res.send("access denied");
}