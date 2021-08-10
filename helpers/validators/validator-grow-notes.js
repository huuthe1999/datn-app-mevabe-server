const { check } = require('express-validator');

exports.validatorCreateGrowNote = [
    check('data', 'Chỉ số không được để trống').notEmpty().isNumeric().withMessage('Chỉ số không hợp lệ'),
    check('date', 'Ngày không được để trống').notEmpty(),
]