const { check } = require('express-validator');

exports.validatorCreateAppointment = [
    check('address', 'Địa chỉ không được bỏ trống').notEmpty(),
    check('date', 'Ngày không được để trống').notEmpty(),
]