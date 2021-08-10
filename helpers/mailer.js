const Mailgen = require("mailgen");
const nodemailer = require("nodemailer");

const mailGenerator = new Mailgen({
    theme: "salted",
    product: {
        name: "Đồ án tốt nghiệp - Mẹ và bé",
        link: process.env.CLIENT_URL,
        // Optional logo
        // logo: 'https://mailgen.js/img/logo.png'
    },
});

const sendMailResetPassword = async (email, token) => {
    const emailContent = {
        body: {
            name: email,
            intro: "Bạn nhận được email này bởi vì bạn đã xác nhận yêu cầu được đặt lại mật khẩu cho tài khoản của bạn.",
            action: {
                instructions:
                    "Nhấp vào nút bên dưới để đặt lại mật khẩu của bạn",
                button: {
                    color: "#DC4D2F",
                    text: "Reset your password",
                    link: `${process.env.CLIENT_URL}/reset-mat-khau?token=${token}&email=${email}`,
                },
            },
            outro: "Nếu bạn không yêu cầu lấy lại mật khẩu, vui lòng không thực hiện email này.",
        },
    };

    const emailBody = mailGenerator.generate(emailContent);

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_FROM,
            pass: process.env.MAIL_PASSWORD_FROM,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    const mainOptions = {
        from: process.env.MAIL_FROM,
        to: email,
        subject: "Email Reset mật khẩu cho tài khoản của bạn",
        html: emailBody,
    };

    return await transporter.sendMail(mainOptions);
};

exports.sendMailResetPassword = sendMailResetPassword;
