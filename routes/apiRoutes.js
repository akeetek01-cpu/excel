const express = require("express");
const router = express.Router();
const controller = require("../controllers/apiController");
const auth = require("../middleware/auth");

router.get("/dashboard", auth, controller.dashboard);

router.post("/register", auth, controller.registerUser);
router.get("/users", controller.getUsers);
router.put("/users", controller.updateUser);

router.post("/usersbyemail", controller.getUsersByEmail);
router.post("/login", controller.loginUser);
router.post("/changePassword", controller.changePassword);

router.get("/InsertScript", controller.insertScript);
router.post("/sendEmail", controller.sendEmail);



module.exports = router;
