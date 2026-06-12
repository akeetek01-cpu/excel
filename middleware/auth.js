module.exports = (req, res, next) => {
    const isLoggedIn = true;
    if (isLoggedIn) next();
    else res.status(401).json({ message: "Unauthorized" });
};
