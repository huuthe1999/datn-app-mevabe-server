const { check } = require('express-validator');

exports.validatorCreateChild = [
    check('name', 'Tên không được để trống').notEmpty(),
    check('birthday', 'Ngày sinh nhật không được để trống').notEmpty(),
    check('gender', 'Giới tính không được để trống').notEmpty().isIn([0, 1, 2]).withMessage("Quy định: 0 - Không xác định, 1 - Bé trai, 2 - Bé gái"),
]
