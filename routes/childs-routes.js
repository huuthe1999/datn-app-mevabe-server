const express = require("express");

const checkAuth = require("../middleware/auth");
const childsController = require("../controllers/childs-controllers.js");
const {
    validatorCreateChild,
} = require("../helpers/validators/validator-child");

const router = express.Router();

router.use(checkAuth);

router.get("/all", childsController.getChildsByMe);

router.get("/user/:uid", childsController.getChildsByUserID);

router.get("/:cid", childsController.getChildByID);

router.put("/:cid", childsController.updateChildByID);

router.post("/", validatorCreateChild, childsController.createChild);

router.delete("/:cid", childsController.removeChildById);

module.exports = router;
