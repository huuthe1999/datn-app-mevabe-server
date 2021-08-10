//validator
const { validationResult } = require("express-validator");

//config
const configAuth = require("../configs/auth");
const bcrypt = require("bcryptjs");

//login social
const google = require("googleapis").google;
const fetch = require("node-fetch");
//jwt
const jwt = require("jsonwebtoken");

//helpers
const jwtHelper = require("../helpers/jwt.helper");
const download = require("../helpers/download");
const imagesController = require("./images-controller");

//token config
const accessTokenLife = process.env.ACCESS_TOKEN_LIFE;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

//models
const CustomError = require("../models/custom-error");
const User = require("../models/user");
const Admin = require("../models/admin");
const RefreshToken = require("../models/refresh-token");

//middleware
const mailer = require("../helpers/mailer");

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];

        return CustomError(res, firstError, -1001);
    }

    const { name, email, password, phone } = req.body;

    let existingUser;

    try {
        existingUser = await User.find({
            $or: [
                { phone: phone, accountType: "normal" },
                { email: email, accountType: "normal" },
            ],
        })
            .select("email phone accountType")
            .exec();
    } catch (err) {
        return CustomError(res, "Đăng kí thất bại ! Thử lại", -1101);
    }

    if (existingUser.length > 0) {
        if (existingUser[0].email === email) {
            return CustomError(
                res,
                "Email đã được đăng kí ! Thử lại bằng email khác",
                -1002
            );
        }
        if (existingUser[0].phone === phone) {
            return CustomError(
                res,
                "Số điện thoại đã được đăng kí ! Thử lại bằng số điện thoại khác",
                -1003
            );
        }

        return CustomError(
            res,
            "Email hoặc số điện thoại đã tồn tại, thử lại",
            -1004
        );
    }

    let hashedPassword;

    try {
        hashedPassword = await bcrypt.hash(
            password,
            configAuth.hashPassword.salt
        );
    } catch (err) {
        return CustomError(res, "Không thể mã hóa mật khẩu ! Thử lại", -1200);
    }

    const createdUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        isFirstLogin: true,
        children: [],
        createAt: new Date().getTime(),
        updateAt: new Date().getTime(),
    });

    try {
        await createdUser.save();
    } catch (err) {
        return CustomError(res, "Đăng kí thất bại ! Thử lại", -1102);
    }

    res.json({
        message: "Đăng kí tài khoản thành công",
        status: 200,
        data: {
            userId: createdUser.id,
            phone: createdUser.phone,
            email: createdUser.email,
        },
    });
};

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];
        return CustomError(res, firstError, -2001);
    }

    const { username, password } = req.body;
    let existingUser;

    try {
        existingUser = await User.find({
            $or: [
                { phone: username, accountType: "normal" },
                { email: username, accountType: "normal" },
            ],
        }).exec();
    } catch (err) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -2101);
    }

    if (existingUser.length < 1) {
        return CustomError(res, "Người dùng không tồn tại ! Thử lại", -2002);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(
            password,
            existingUser[0].password
        );
    } catch (err) {
        return CustomError(res, "Xác thực mật khẩu thất bại ! Thử lại", -2201);
    }

    if (!isValidPassword) {
        return CustomError(res, "Mật khẩu không trùng khớp ! Thử lại", -2003);
    }

    let accessToken;
    let refreshToken;
    try {
        accessToken = await jwtHelper.generateToken(
            existingUser[0],
            accessTokenSecret,
            accessTokenLife
        );

        refreshToken = await jwtHelper.generateToken(
            existingUser[0],
            refreshTokenSecret,
            refreshTokenLife
        );
    } catch (err) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -2202);
    }

    const newRefreshToken = new RefreshToken({
        userId: existingUser[0].id,
        token: refreshToken,
        createdByIp: req.ip,
    });

    try {
        await newRefreshToken.save();
    } catch (err) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -2102);
    }

    let isFirstLogin = existingUser[0].isFirstLogin;
    if (isFirstLogin == true) {
        existingUser[0].isFirstLogin = false;
        try {
            await existingUser[0].save();
        } catch (err) {
            return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -2103);
        }
    }

    res.json({
        message: "Đăng nhập thành công!",
        status: 200,
        data: {
            userId: existingUser[0].id,
            name: existingUser[0].name,
            avatar: existingUser[0].avatar,
            phone: existingUser[0].phone,
            email: existingUser[0].email,
            isFirstLogin,
            accessToken,
            refreshToken,
        },
    });
};

const loginAdmin = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];
        return CustomError(res, firstError, -10001);
    }

    const { username, password } = req.body;
    let existingUser;

    try {
        existingUser = await Admin.find({ username: username }).exec();
    } catch (err) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -10101);
    }

    if (existingUser.length < 1) {
        return CustomError(res, "Người dùng không tồn tại ! Thử lại", -10002);
    }

    if (password != existingUser[0].password) {
        return CustomError(res, "Mật khẩu không trùng khớp ! Thử lại", -10003);
    }

    let accessToken;
    let refreshToken;
    try {
        accessToken = await jwtHelper.generateToken(
            existingUser[0],
            accessTokenSecret,
            accessTokenLife
        );

        refreshToken = await jwtHelper.generateToken(
            existingUser[0],
            refreshTokenSecret,
            refreshTokenLife
        );
    } catch (err) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -10202);
    }

    const newRefreshToken = new RefreshToken({
        userId: existingUser[0].id,
        token: refreshToken,
        createdByIp: req.ip,
    });

    try {
        await newRefreshToken.save();
    } catch (err) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -10102);
    }

    res.json({
        message: "Đăng nhập thành công!",
        status: 200,
        data: {
            userId: existingUser[0].id,
            name: existingUser[0].name,
            avatar: existingUser[0].avatar,
            phone: existingUser[0].phone,
            email: existingUser[0].email,
            accessToken,
            refreshToken,
        },
    });
};

const googleLogin = async (req, res, next) => {
    if (!req.body.accessToken) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -3001); //Lỗi body k chứa accessToken
    }

    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2();
    oauth2Client.setCredentials({ access_token: req.body.accessToken });
    const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
    });

    oauth2.userinfo.get(async (error, response) => {
        if (error) {
            return CustomError(res, "Đăng nhập thất bại ! Thử lại", -3201); //Lấy thông tin user từ google thất bại
        } else {
            const profile = response.data;
            try {
                let user = await User.find({
                    email: profile.email,
                    accountType: "google",
                });

                let accessToken;
                let refreshToken;
                let isFirstLogin;

                if (user.length == 0) {
                    isFirstLogin = true;
                    let hashedPassword;

                    try {
                        hashedPassword = await bcrypt.hash(
                            profile.id,
                            configAuth.hashPassword.salt
                        );
                        hashedPassword = await bcrypt.hash(
                            hashedPassword,
                            configAuth.hashPassword.salt
                        );
                    } catch (err) {
                        return CustomError(
                            res,
                            "Đăng nhập thất bại ! Thử lại",
                            -3202
                        );
                        ` // Lỗi hash mật khẩu`;
                    }

                    const newUser = new User({
                        avatar:
                            profile.picture ||
                            process.env.CLOUDDINARY_DEFAULT_AVATAR_USER,
                        name: profile.name,
                        email: profile.email,
                        password: hashedPassword,
                        accountType: "google",
                        isFirstLogin: true,
                        children: [],
                        createAt: new Date().getTime(),
                        updateAt: new Date().getTime(),
                    });

                    try {
                        await newUser.save();
                    } catch (err) {
                        return CustomError(
                            res,
                            "Đăng nhập thất bại ! Thử lại",
                            -3102
                        );
                    }
                    user = newUser;
                } else {
                    user = user[0];
                    isFirstLogin = false;
                }

                try {
                    accessToken = await jwtHelper.generateToken(
                        user,
                        accessTokenSecret,
                        accessTokenLife
                    );

                    refreshToken = await jwtHelper.generateToken(
                        user,
                        refreshTokenSecret,
                        refreshTokenLife
                    );
                } catch (err) {
                    return CustomError(
                        res,
                        "Đăng nhập thất bại ! Thử lại",
                        -3203
                    ); // Lỗi generateToken
                }

                const newRefreshToken = new RefreshToken({
                    userId: user.id || user.userId,
                    token: refreshToken,
                    createdByIp: req.ip,
                });

                try {
                    await newRefreshToken.save();
                } catch (err) {
                    return CustomError(
                        res,
                        "Đăng nhập thất bại ! Thử lại.",
                        -3103
                    ); // Lỗi save new refresh token
                }

                res.json({
                    message: "Đăng nhập thành công!",
                    status: 200,
                    data: {
                        userId: user.id,
                        name: user.name,
                        avatar: user.avatar,
                        phone: user.phone,
                        email: user.email,
                        isFirstLogin,
                        accessToken,
                        refreshToken,
                    },
                });
            } catch (err) {
                return CustomError(res, "Đăng nhập thất bại ! Thử lại", -3101);
            }
        }
    });
};

const facebookLogin = async (req, res, next) => {
    if (!req.body.userID) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -4001); //Lỗi body k chứa accessToken
    }

    if (!req.body.accessToken) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -4002); //Lỗi body k chứa accessToken
    }

    let { userID, accessToken } = req.body;

    let user;
    try {
        user = await User.find({
            socialId: userID,
            accountType: "facebook",
        });
    } catch (err) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -4101);
    }

    let refreshToken;
    let isFirstLogin;

    if (user.length == 0) {
        let name, email, picture, id, phone;

        let urlGraphFacebook = `https://graph.facebook.com/${userID}/?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;

        try {
            await fetch(urlGraphFacebook, {
                method: "GET",
            })
                .then((response) => response.json())
                .then((response) => {
                    name = response.name;
                    email = response.email || "";
                    phone = response.phone || "";
                    id = response.id;
                    picture = response.picture.data.url || "";
                });
        } catch (err) {
            return CustomError(res, "Đăng nhập thất bại ! Thử lại", -4201); //Lỗi lấy thông tin từ facebook
        }
        download(picture, "uploads/images/facebookAvatar.png", async () => {
            picture = await imagesController.uploadImageTemplate(
                "uploads/images/facebookAvatar.png",
                "facebook",
                id
            );

            isFirstLogin = true;
            let hashedPassword;

            try {
                hashedPassword = await bcrypt.hash(
                    phone || email,
                    configAuth.hashPassword.salt
                );
                hashedPassword = await bcrypt.hash(
                    hashedPassword,
                    configAuth.hashPassword.salt
                );
            } catch (err) {
                return CustomError(res, "Đăng nhập thất bại ! Thử lại", -4202); // Lỗi hash mật khẩu
            }

            const newUser = new User({
                avatar: picture || process.env.CLOUDDINARY_DEFAULT_AVATAR_USER,
                name: name || "",
                email: email || "",
                phone: phone || "",
                password: hashedPassword,
                accountType: "facebook",
                socialId: id,
                children: [],
                createAt: new Date().getTime(),
                updateAt: new Date().getTime(),
            });

            try {
                await newUser.save();
            } catch (err) {
                return CustomError(res, "Đăng nhập thất bại ! Thử lại", -4102);
            }
            user = newUser;

            try {
                accessToken = await jwtHelper.generateToken(
                    user,
                    accessTokenSecret,
                    accessTokenLife
                );

                refreshToken = await jwtHelper.generateToken(
                    user,
                    refreshTokenSecret,
                    refreshTokenLife
                );
            } catch (err) {
                return CustomError(res, "Đăng nhập thất bại ! Thử lại", -4203); // Lỗi generateToken
            }

            const newRefreshToken = new RefreshToken({
                userId: user.id || user.userId,
                token: refreshToken,
                createdByIp: req.ip,
            });

            try {
                await newRefreshToken.save();
            } catch (err) {
                return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -4103); // Lỗi save new refresh token
            }

            res.json({
                message: "Đăng nhập thành công!",
                status: 200,
                data: {
                    userId: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    phone: user.phone,
                    email: user.email,
                    isFirstLogin,
                    accessToken,
                    refreshToken,
                },
            });
        });
    } else {
        user = user[0];
        isFirstLogin = false;

        try {
            accessToken = await jwtHelper.generateToken(
                user,
                accessTokenSecret,
                accessTokenLife
            );

            refreshToken = await jwtHelper.generateToken(
                user,
                refreshTokenSecret,
                refreshTokenLife
            );
        } catch (err) {
            return CustomError(res, "Đăng nhập thất bại ! Thử lại", -4203); // Lỗi generateToken
        }

        const newRefreshToken = new RefreshToken({
            userId: user.id || user.userId,
            token: refreshToken,
            createdByIp: req.ip,
        });

        try {
            await newRefreshToken.save();
        } catch (err) {
            return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -4103); // Lỗi save new refresh token
        }

        res.json({
            message: "Đăng nhập thành công!",
            status: 200,
            data: {
                userId: user.id,
                name: user.name,
                avatar: user.avatar,
                phone: user.phone,
                email: user.email,
                isFirstLogin,
                accessToken,
                refreshToken,
            },
        });
    }
};

const appleLogin = async (req, res, next) => {
    console.log("LOGIN APPLE");

    console.log("Req: " + req);

    if (!req.body.appleUser) {
        console.log("Đăng nhập thất bại ! Thử lại -9001");
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9001); //Lỗi body k chứa appleUser
    }

    if (!req.body.identityToken) {
        console.log("Đăng nhập thất bại ! Thử lại -9002");
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9002); //Lỗi body k chứa identityToken
    }

    const { appleUser, identityToken } = req.body;

    if (appleUser) console.log(appleUser);
    if (identityToken) console.log(identityToken);

    let id, email, json, kid;

    try {
        json = jwt.decode(identityToken, { complete: true });
        kid = json.header.kid;
    } catch (err) {
        console.log("Đăng nhập thất bại ! Thử lại -9203");
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9203); // Lỗi decode token, token không hợp lệ
    }

    let appleKey;
    try {
        appleKey = await jwtHelper.getAppleSigningKey(kid);
    } catch (err) {
        console.log("Đăng nhập thất bại ! Thử lại -9204");
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9204); // Lỗi jwt get apple signing key
    }

    if (!appleKey) {
        console.log("Đăng nhập thất bại ! Thử lại -9201");
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9201); //Lỗi lấy thông tin từ apple
    }

    let payload;

    try {
        payload = await jwtHelper.verifyToken(identityToken, appleKey);
    } catch (err) {
        console.log("Đăng nhập thất bại ! Thử lại -9205");
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9205); //Lỗi jwt verify token
    }

    if (payload && payload.sub === appleUser) {
        id = payload.sub;
        email = payload.email;

        try {
            let user = await User.find({
                socialId: id,
                accountType: "apple",
            });

            let accessToken;
            let refreshToken;
            let isFirstLogin;

            if (user.length == 0) {
                isFirstLogin = true;
                let hashedPassword;

                try {
                    hashedPassword = await bcrypt.hash(
                        id,
                        configAuth.hashPassword.salt
                    );
                    hashedPassword = await bcrypt.hash(
                        hashedPassword,
                        configAuth.hashPassword.salt
                    );
                } catch (err) {
                    console.log("Đăng nhập thất bại ! Thử lại -9202");
                    return CustomError(
                        res,
                        "Đăng nhập thất bại ! Thử lại",
                        -9202
                    ); // Lỗi hash mật khẩu
                }

                const newUser = new User({
                    avatar: process.env.CLOUDDINARY_DEFAULT_AVATAR_USER,
                    name: email,
                    email,
                    password: hashedPassword,
                    accountType: "apple",
                    socialId: id,
                    children: [],
                    createAt: new Date().getTime(),
                    updateAt: new Date().getTime(),
                });

                try {
                    await newUser.save();
                } catch (err) {
                    console.log("Đăng nhập thất bại ! Thử lại -9102");
                    return CustomError(
                        res,
                        "Đăng nhập thất bại ! Thử lại",
                        -9102
                    );
                }
                user = newUser;
            } else {
                user = user[0];
                isFirstLogin = false;
            }

            try {
                accessToken = await jwtHelper.generateToken(
                    user,
                    accessTokenSecret,
                    accessTokenLife
                );

                refreshToken = await jwtHelper.generateToken(
                    user,
                    refreshTokenSecret,
                    refreshTokenLife
                );
            } catch (err) {
                console.log("Đăng nhập thất bại ! Thử lại -9206");
                return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9206); // Lỗi generateToken
            }

            const newRefreshToken = new RefreshToken({
                userId: user.id || user.userId,
                token: refreshToken,
                createdByIp: req.ip,
            });

            try {
                await newRefreshToken.save();
            } catch (err) {
                console.log("Đăng nhập thất bại ! Thử lại -9103");
                return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -9103); // Lỗi save new refresh token
            }

            res.json({
                message: "Đăng nhập thành công!",
                status: 200,
                data: {
                    userId: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    phone: user.phone,
                    email: user.email,
                    isFirstLogin,
                    accessToken,
                    refreshToken,
                },
            });
        } catch (err) {
            console.log("Đăng nhập thất bại ! Thử lại -9101");
            return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9101);
        }
    } else {
        console.log("Đăng nhập thất bại ! Thử lại -9201");
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -9201); //Lỗi lấy thông tin từ apple
    }
};

const zaloLogin = async (req, res, next) => {
    if (!req.body.accessToken) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -8001); //Lỗi body k chứa accessToken
    }

    const { accessToken } = req.body;

    let name, email, picture, id, birthday;

    let urlGraphZalo = `https://graph.zalo.me/v2.0/me?access_token=${accessToken}&fields=id,birthday,name,picture`;

    try {
        await fetch(urlGraphZalo, {
            method: "GET",
        })
            .then((response) => response.json())
            .then((response) => {
                name = response.name;
                email = response.email;
                picture = response.picture.data.url;
                birthday = response.birthday || "";
                id = response.id;
            });

        try {
            let user = await User.find({
                socialId: id,
                accountType: "zalo",
            });

            let accessToken;
            let refreshToken;
            let isFirstLogin;

            if (user.length == 0) {
                isFirstLogin = true;
                let hashedPassword;

                try {
                    hashedPassword = await bcrypt.hash(
                        id,
                        configAuth.hashPassword.salt
                    );
                    hashedPassword = await bcrypt.hash(
                        hashedPassword,
                        configAuth.hashPassword.salt
                    );
                } catch (err) {
                    return CustomError(
                        res,
                        "Đăng nhập thất bại ! Thử lại",
                        -8202
                    ); // Lỗi hash mật khẩu
                }

                const newUser = new User({
                    avatar:
                        picture || process.env.CLOUDDINARY_DEFAULT_AVATAR_USER,
                    name,
                    email,
                    birthday,
                    password: hashedPassword,
                    accountType: "zalo",
                    socialId: id,
                    children: [],
                    createAt: new Date().getTime(),
                    updateAt: new Date().getTime(),
                });

                try {
                    await newUser.save();
                } catch (err) {
                    return CustomError(
                        res,
                        "Đăng nhập thất bại ! Thử lại",
                        -8102
                    );
                }
                user = newUser;
            } else {
                user = user[0];
                isFirstLogin = false;
            }

            try {
                accessToken = await jwtHelper.generateToken(
                    user,
                    accessTokenSecret,
                    accessTokenLife
                );

                refreshToken = await jwtHelper.generateToken(
                    user,
                    refreshTokenSecret,
                    refreshTokenLife
                );
            } catch (err) {
                return CustomError(res, "Đăng nhập thất bại ! Thử lại", -8203); // Lỗi generateToken
            }

            const newRefreshToken = new RefreshToken({
                userId: user.id || user.userId,
                token: refreshToken,
                createdByIp: req.ip,
            });

            try {
                await newRefreshToken.save();
            } catch (err) {
                return CustomError(res, "Đăng nhập thất bại ! Thử lại.", -8103); // Lỗi save new refresh token
            }

            res.json({
                message: "Đăng nhập thành công!",
                status: 200,
                data: {
                    userId: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    phone: user.phone,
                    email: user.email,
                    isFirstLogin,
                    accessToken,
                    refreshToken,
                },
            });
        } catch (err) {
            return CustomError(res, "Đăng nhập thất bại ! Thử lại", -8101);
        }
    } catch (err) {
        return CustomError(res, "Đăng nhập thất bại ! Thử lại", -8201); //Lỗi lấy thông tin từ zalo
    }
};

const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => error.msg)[0];
        return CustomError(res, firstError, -5001);
    } else {
        const user = await User.findOne({
            email: email,
            accountType: "normal",
        });
        if (user) {
            const token = jwt.sign(
                {
                    _id: user._id,
                },
                process.env.SECRET_KEY_RESET_PASSWORD,
                {
                    expiresIn: "15m",
                }
            );
            try {
                mailer.sendMailResetPassword(email, token);
            } catch (err) {
                return CustomError(res, "Gửi email thất bại!", -5201);
            }

            return res.json({
                message: `Link Reset Password đã được gửi tới ${email} `,
                status: 200,
            });
        } else {
            return CustomError(res, "Tài khoản email không tồn tại", -5002);
        }
    }
};

const resetPassword = async (req, res, next) => {
    let { newPassword, token } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return CustomError(res, firstError, -6001);
    } else {
        try {
            const decoded = await jwt.verify(
                token,
                process.env.SECRET_KEY_RESET_PASSWORD
            );
            try {
                const findUser = await User.findById(decoded._id);
                if (findUser) {
                    let hashedPassword;
                    try {
                        hashedPassword = await bcrypt.hash(
                            newPassword,
                            configAuth.hashPassword.salt
                        );
                    } catch (err) {
                        return CustomError(
                            res,
                            "Không thể mã hóa mật khẩu ! Thử lại",
                            -6201
                        );
                    }
                    findUser.password = hashedPassword;
                    try {
                        await findUser.save();
                        return res.json({
                            message: "Thay đổi mật khẩu thành công !",
                            status: 200,
                        });
                    } catch (error) {
                        return CustomError(
                            res,
                            "Không thể thay đổi mật khẩu ! Thử lại",
                            -6102
                        );
                    }
                } else {
                    return CustomError(
                        res,
                        "Không tìm thấy user qua email!",
                        -6101
                    );
                }
            } catch (error) {
                return CustomError(
                    res,
                    "Không thể thay đổi mật khẩu ! Thử lại",
                    -6101
                );
            }
        } catch (error) {
            return CustomError(
                res,
                "Link reset mật khẩu đã hết hạn ! Thử lại",
                -6003
            );
        }
    }
};

const refreshToken = async (req, res, next) => {
    const refreshTokenFromClient = req.body.refreshToken;

    const refreshTokenDB = await RefreshToken.findOne({
        token: refreshTokenFromClient,
    }).populate("user");

    if (!refreshTokenDB || refreshTokenDB.revoked) {
        return CustomError(res, "Refresh token không hợp lệ!", -7002);
    }

    let refreshToken = refreshTokenDB.token;

    if (refreshToken) {
        try {
            const decoded = await jwtHelper.verifyToken(
                refreshTokenFromClient,
                refreshTokenSecret
            );

            const userData = decoded.data;
            let accessToken;

            try {
                accessToken = await jwtHelper.generateToken(
                    userData,
                    accessTokenSecret,
                    accessTokenLife
                );

                refreshToken = await jwtHelper.generateToken(
                    userData,
                    refreshTokenSecret,
                    refreshTokenLife
                );
            } catch (err) {
                return CustomError(res, "Refresh token thất bại!", -7201);
            }

            refreshTokenDB.revoked = new Date().getTime();
            refreshTokenDB.revokedByIp = req.ip;
            refreshTokenDB.replacedByToken = refreshToken;

            //generate new refreshToken
            const newRefreshToken = new RefreshToken({
                userId: userData.userId,
                token: refreshToken,
                createdByIp: req.ip,
            });

            try {
                await refreshTokenDB.save();
                await newRefreshToken.save();
            } catch (err) {
                return CustomError(res, "Refresh token thất bại!", -7101);
            }

            res.json({
                message: "Refresh token thành công!",
                status: 200,
                data: {
                    userId: userData.userId,
                    // phone: userData.phone,
                    // email: userData.email,
                    accessToken,
                    refreshToken,
                },
            });
        } catch (err) {
            return CustomError(res, "Refresh token không hợp lệ!", -7002);
        }
    } else {
        return CustomError(res, "Không tìm thấy refresh token!", -7001);
    }
};

exports.signup = signup;
exports.login = login;
exports.refreshToken = refreshToken;
exports.googleLogin = googleLogin;
exports.facebookLogin = facebookLogin;
exports.appleLogin = appleLogin;
exports.zaloLogin = zaloLogin;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.loginAdmin = loginAdmin;
