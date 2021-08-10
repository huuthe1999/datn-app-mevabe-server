const { check } = require('express-validator');

exports.validatorCreateMilkNote = [
    check('date', 'Ngày không được để trống').notEmpty(),
]