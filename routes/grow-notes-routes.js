const express = require("express");

const checkAuth = require("../middleware/auth");
const growNotesController = require("../controllers/grow-notes-controllers");
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

router.get("/standard/all", validatorCreateGrowNote, growNotesController.getStandardGrowNote);

router.post("/standard/all", validatorCreateGrowNote, growNotesController.createStandardGrowNote);

module.exports = router;