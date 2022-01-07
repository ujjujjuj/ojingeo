module.exports = (req,res,next) => {
    if(req.user && req.user.isFrontman) next();
    return res.send("access denied");
}