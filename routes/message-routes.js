const express = require("express");

const checkAuth = require("../middleware/auth");
const messagesController = require("../controllers/messages-controllers");

const router = express.Router();

router.use(checkAuth);

// router.post("/", messagesController.createMessage);

router.put("/:mid", messagesController.updateMessage);

router.get('/conversations', messagesController.getConversations)

router.get('/:uid', messagesController.getMessages)

router.put('/conversation/seen/:cid', messagesController.seenConversation);

router.delete('/:mid', messagesController.deleteMessages)

router.delete('/conversation/:uid', messagesController.deleteConversation)

module.exports = router;
