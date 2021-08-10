const express = require("express");

const checkAuth = require("../middleware/auth");
const commentControllers = require("../controllers/comment-controllers");
const fileUpload = require("../utils/multer");
const router = express.Router();
const {
    validatorCreateHighLevelComment,
} = require("../helpers/validators/validator-comment");

router.get('/all/:sid', commentControllers.getAllComment);

router.get('/high-level/:sid', commentControllers.getHighLevelComment);

router.get('/low-level/:cid', commentControllers.getLowLevelComment);

router.use(checkAuth);

router.post('/high-level/:sid', validatorCreateHighLevelComment, commentControllers.createHighLevelComment);

router.post('/low-level/:sid/:cid', validatorCreateHighLevelComment, commentControllers.createLowLevelComment);

router.put('/:cid', validatorCreateHighLevelComment, commentControllers.updateComment);

router.delete('/high-level/:cid', commentControllers.removeHighLevelComment);

router.delete('/low-level/:hid/:lid', commentControllers.removeLowLevelComment);//hid: high comment - lid : low comment

module.exports = router;