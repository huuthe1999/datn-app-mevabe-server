const { check } = require('express-validator');

exports.validatorCreateStatus = [
    check('title', 'Tiêu đề không được để trống').notEmpty(),
]