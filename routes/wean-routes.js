const express = require("express");

const checkAuth = require("../middleware/auth");
const weanControllers = require("../controllers/wean-controllers");
const {
    validatorCreateWean,
} = require("../helpers/validators/validator-wean-child");

const router = express.Router();

router.use(checkAuth);

router.post("/", validatorCreateWean, weanControllers.createWean);

router.get("/", weanControllers.getWean);

router.get("/material", weanControllers.getMaterial);

router.put("/:wid", weanControllers.updateWean);

router.delete("/:wid", weanControllers.removeWean);

module.exports = router;
