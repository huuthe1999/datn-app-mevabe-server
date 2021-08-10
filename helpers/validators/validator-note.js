const { check } = require('express-validator');

exports.validatorCreateNote = [
    check('content', 'Nội dung không được bỏ trống!').notEmpty(),
    check('remindAt', 'Thời gian nhắc nhở không được bỏ trống!').notEmpty(),
]