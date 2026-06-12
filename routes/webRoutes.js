const express = require("express");
const router = express.Router();
const controller = require("../controllers/webController");

router.get("/", controller.home);
router.get("/dashboard", controller.dashboard);
router.get("/login", controller.login);
router.get("/register", controller.register);
router.get("/forgotPassword", controller.forgotPassword);
router.get("/lead-form", controller.leadForm);

module.exports = router;
