const { check } = require('express-validator');

exports.validatorUpdateVaccinationShotChild = [
    //check('status', 'status không được để trống').notEmpty().isIn([0, 1, 2]).withMessage("Quy định: 0 - chưa tiêm, 1 - đã tiêm, 2 - bỏ qua"),
]