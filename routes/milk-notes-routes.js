const express = require("express");

const checkAuth = require("../middleware/auth");
const milkNotesController = require("../controllers/milk-notes-controllers");
const {
    validatorCreateMilkNote,
} = require("../helpers/validators/validator-milk-notes");

const router = express.Router();

router.use(checkAuth);

router.get("/:mid", milkNotesController.getMilkNoteByID);

router.get("/all/:cid", milkNotesController.getAllMilkNoteByChildID);

router.put("/:mid", milkNotesController.updateMilkNoteByID);

router.delete("/:mid", milkNotesController.deleteMilkNoteByID);

router.post("/:cid", validatorCreateMilkNote, milkNotesController.createMilkNoteByChildID);

module.exports = router;