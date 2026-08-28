const express = require("express");
const router = express.Router();
const controller = require("../controllers/apiController");
const auth = require("../middleware/auth");

router.get("/dashboard", auth, controller.dashboard);

router.post("/register", auth, controller.registerUser);
router.post("/lead", controller.submitLeadToSimpro);
router.patch("/lead/archive", controller.archiveLead);
router.post("/quote", controller.submitQuoteToSimpro);
router.get("/users", controller.getUsers);
router.get("/managers", controller.getManagers);
router.put("/users", controller.updateUser);

router.post("/usersbyemail", controller.getUsersByEmail);
router.post("/login", controller.loginUser);
router.post("/changePassword", controller.changePassword);

router.get("/InsertScript", controller.insertScript);
router.post("/sendEmailForgotPassword", controller.sendEmailTempPassword);
router.post("/sendEmailLeadForm", controller.sendEmailLeadForm);
router.get("/simpro/employees", controller.getSimproEmployees);
router.get("/simpro/teams", controller.getSimproTeams);



module.exports = router;
