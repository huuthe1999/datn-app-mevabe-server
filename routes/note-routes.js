const express = require("express");

const checkAuth = require("../middleware/auth");
const notesController = require("../controllers/notes-controllers");
const {
    validatorCreateNote
} = require("../helpers/validators/validator-note");
const router = express.Router();

router.use(checkAuth);

router.get("/:nid", notesController.getNoteByID);

router.get("/all/:cid", notesController.getAllNoteByChildID);

router.get("/reminder/:cid", notesController.getAllReminderNoteByChildID);

router.get("/user/all", notesController.getAllNoteByUserID);

router.get("/user/reminder", notesController.getAllReminderNoteByUserID);

router.put("/:nid", notesController.updateNoteByID);

router.delete("/:nid", notesController.deleteNoteByID);

router.post("/:cid", validatorCreateNote, notesController.createNoteByChildID);

module.exports = router;