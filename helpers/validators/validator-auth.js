const { check, oneOf } = require('express-validator');


exports.validatorSignUp = [
    check('name', 'Họ tên không được để trống').notEmpty(),
    check('email').notEmpty().withMessage('Email không được trống').isEmail().withMessage('Email không hợp lệ'),
    check('phone', 'Số điện thoại không được để trống').notEmpty()
        .matches(/^[0-9]+$/).withMessage('Số điện thoại chứa kí tự không phải số')
        .isLength({ min: 10, max: 10 }).withMessage('Số điện thoại phải đúng 10 kí tự'),
    check('password', 'Mật khẩu không được để trống').notEmpty(),
    check('password').isLength({
        min: 8
    }).withMessage('Mật khẩu phải chứa ít nhất 8 kí tự')
    //         .matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất 1 số'),
    //     check('password').matches(/^(?=.*[a-z])/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự thường'),
    //     check('password').matches(/^(?=.*[A-Z])/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự hoa'),
    //     check('password').matches(/^(?=.*[@$!%*#?&]).*$/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự đặc biệt')
    //
]

exports.validatorSignIn = [
    check('username', 'Email hoặc số điện thoại không được trống').notEmpty(),
    check('password', 'Mật khẩu không được để trống').notEmpty()
]

// exports.validatorSignIn = [
//     oneOf([check('email').isEmail().withMessage('Email không hợp lệ'),
//     check('phone').matches(/^[0-9]+$/).withMessage('Số điện thoại chứa kí tự không phải số')
//         .isLength({ min: 10, max: 10 }).withMessage('Số điện thoại phải đúng 10 kí tự')]
//     ), check('password', 'Mật khẩu không được để trống').notEmpty()

// ]

exports.validatorForgotPassword = [
    check('email').notEmpty().withMessage('Email không được rỗng !').isEmail().withMessage('Email không hợp lệ !')
];

exports.validatorResetPassword = [
    check('newPassword').notEmpty().withMessage('Mật khẩu không được rỗng !').isLength({ min: 8 }).withMessage('Mật khẩu chứa ít nhất 8 kí tự'),
    check('token', 'Token không được rỗng !').notEmpty()
    // check('newPassword').matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất 1 số'),
    // check('newPassword').matches(/^(?=.*[a-z])/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự thường'),
    // check('newPassword').matches(/^(?=.*[A-Z])/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự hoa'),
    // check('newPassword').matches(/^(?=.*[@$!%*#?&]).*$/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự đặc biệt')
];

exports.validatorChangePassword = [
    check('newPassword').notEmpty().isLength({ min: 8 }).withMessage('Mật khẩu chứa ít nhất 8 kí tự'),
    check('newPassword').matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất 1 số'),
    check('newPassword').matches(/^(?=.*[a-z])/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự thường'),
    check('newPassword').matches(/^(?=.*[A-Z])/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự hoa'),
    check('newPassword').matches(/^(?=.*[@$!%*#?&]).*$/).withMessage('Mật khẩu phải chứa ít nhất 1 kí tự đặc biệt')
];

