exports.home = (req, res) => {
    res.sendFile("index.html", { root: "./public" });
};

exports.login = (req, res) => {
    res.sendFile("login.html", { root: "./public" });
};


exports.register = (req, res) => {
    res.sendFile("Register.html", { root: "./public" });
};

exports.page = (req, res) => {
    res.send("<h2>Excel Web Route</h2><a href='/'>Back</a>");
};
