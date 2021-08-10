const express = require("express");
const {
    validatorSignUp,
    validatorSignIn,
    validatorForgotPassword,
    validatorResetPassword
} = require("../helpers/validators/validator-auth");

const authsController = require("../controllers/auths-controllers");

const router = express.Router();

router.post('/signup', validatorSignUp, authsController.signup);

router.post('/login', validatorSignIn, authsController.login);

router.post('/login/google', authsController.googleLogin);

router.post('/login/facebook', authsController.facebookLogin);

router.post('/login/apple', authsController.appleLogin);

router.post('/login/zalo', authsController.zaloLogin);

router.post('/admins/login', validatorSignIn, authsController.loginAdmin);

router.post(
    "/forgot-password",
    validatorForgotPassword,
    authsController.forgotPassword
);

router.post(
    "/reset-password",
    validatorResetPassword,
    authsController.resetPassword
);

router.post('/refresh-token', authsController.refreshToken);

module.exports = router;