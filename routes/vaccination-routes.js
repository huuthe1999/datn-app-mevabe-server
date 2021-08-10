const express = require("express");

const checkAuth = require("../middleware/auth");
const vaccinationsController = require("../controllers/vaccinations-controllers");
const {
    validatorUpdateVaccinationShotChild
} = require("../helpers/validators/validator-vaccination-shot-child");
const router = express.Router();

router.use(checkAuth);

router.get("/all/:cid", vaccinationsController.getAllVaccinationByChildId);

router.get("/all/shot/:cid", vaccinationsController.getAllVaccinationShotsByChildId);

router.get("/shot/:cid/:sid", vaccinationsController.getVaccinationShotByIdAndChildId);

router.put("/shot/child/:cid/:sid", validatorUpdateVaccinationShotChild, vaccinationsController.updateVaccinationShotChildByIdAndChildId);

router.post("/", vaccinationsController.createVaccination);

router.post("/shot", vaccinationsController.createVaccinationShot);

module.exports = router;