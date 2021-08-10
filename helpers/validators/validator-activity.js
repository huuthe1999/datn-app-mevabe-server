const { check } = require("express-validator");

exports.validatorCreateActivity = [
    check("childId", "Id bé không được bỏ trống!").notEmpty(),
    check("startTime", "Thời gian bắt đầu không được bỏ trống!")
        .notEmpty()
        .isFloat()
        .withMessage("Thời gian bắt đầu phải ở dạng số"),
    check("endTime", "Thời gian kết thúc không được bỏ trống!")
        .notEmpty()
        .isFloat()
        .withMessage("Thời gian kết thúc phải ở dạng số"),
    check("active", "Vui lòng chọn loại hoạt động!")
        .notEmpty()
        .isIn([0, 1, 2, 3, 4, 5, 6])
        .withMessage(
            "Hoạt động quy định : 0 - Đi dạo, 1 - Tắm, 2 - Tắm nắng, 3 - Mát-xa, 4 - Chơi, 5 - Đọc sách, 6 - Nghe nhạc"
        ),
    check("note").isLength({ max: 200 }).withMessage("Note tối đa 200 kí tự!"),
];
