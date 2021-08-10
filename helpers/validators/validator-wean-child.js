const { check } = require("express-validator");

exports.validatorCreateWean = [
    check("childId", "Id bé không được bỏ trống!").notEmpty(),
    check("date", "Thời gian ăn dặm không được bỏ trống!")
        .notEmpty()
        .isFloat({ max: new Date().getTime() })
        .withMessage("Ngày phải nhỏ hơn ngày hiện tại"),
    check("nameFood", "Tên món ăn không được bỏ trống!").notEmpty(),
    check("cooking", "Cách chế biến không được bỏ trống!")
        .notEmpty()
        .isIn([0, 1, 2, 3])
        .withMessage(
            "Quy định: 0 - Xây nhuyễn, 1 - Rây (nghiền nhỏ), 2 - Mềm (nhừ), 3 - Thô"
        ),
    check("foodAmount", "Lượng thức ăn không được bỏ trống!")
        .notEmpty()
        .isNumeric()
        .withMessage("Lượng thức ăn là số")
        .isFloat({ min: 1 })
        .withMessage("Lượng thức ăn phải lớn hơn 0"),
    check("unit", "Đơn vị ăn không được bỏ trống!")
        .notEmpty()
        .isIn([0, 1, 2])
        .withMessage("Quy định: 0 - Bát, 1 - Gram, 2 - Ml"),
    check("rating")
        .isIn([0, 1, 2, 3])
        .withMessage(
            "Rating quy định : 0 - Rất thích, 1 - Hơi thích, 2 - Bình thường, 3 - Không thích"
        ),
];
