const { check } = require('express-validator');

exports.validatorCreateHighLevelComment = [
    check('content', 'Nội dung bình luận không được bỏ trống').notEmpty(),
]