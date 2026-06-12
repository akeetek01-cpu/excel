exports.home = (req, res) => {
    res.sendFile("index.html", { root: "./public" });
};

exports.login = (req, res) => {
    res.sendFile("login.html", { root: "./public" });
};


exports.register = (req, res) => {
    res.sendFile("Register.html", { root: "./public" });
};

exports.forgotPassword = (req, res) => {
    res.sendFile("forgot-password.html", { root: "./public" });
};

exports.dashboard = (req, res) => {
     res.sendFile("dashboard.html", { root: "./public" });
};

exports.leadForm = (req, res) => {
    res.sendFile("lead-capture.html", { root: "./public" });
};

