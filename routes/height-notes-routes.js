const express = require("express");

const checkAuth = require("../middleware/auth");
const growNotesController = require("../controllers/height-notes-controllers");
const {
    validatorCreateGrowNote
} = require("../helpers/validators/validator-grow-notes");
const router = express.Router();

router.use(checkAuth);

router.get("/:gid", growNotesController.getGrowNoteByID);

router.get("/all/:cid", growNotesController.getAllGrowNoteByChildID);

router.put("/:gid", growNotesController.updateChildGrowNoteByID);

router.delete("/:gid", growNotesController.deleteChildGrowNoteByID);

router.post("/:cid", validatorCreateGrowNote, growNotesController.createGrowNoteByChildID);

router.get("/standard/all", growNotesController.getStandardGrowNote);

router.post("/standard/all", growNotesController.createStandardGrowNote);

module.exports = router;