const express = require("express");
const router = express.Router();
const controller = require("../controllers/apiController");
const auth = require("../middleware/auth");

router.get("/dashboard", auth, controller.dashboard);

router.post("/register", auth, controller.registerUser);
router.get("/users", controller.getUsers);
router.post("/login", controller.loginUser);

module.exports = router;
