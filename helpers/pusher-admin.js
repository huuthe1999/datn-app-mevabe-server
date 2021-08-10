const PushNotifications = require("@pusher/push-notifications-server");

let beamsClient = new PushNotifications({
    instanceId: "2e59579b-2ed1-4557-a9c1-4a8e976b030f",
    secretKey:
        "299CFF552CFDB07214BC85C8BFC93B71AB8ACA7CAC8C4AB4CEB4CE9D1FA8112E",
});

const authBeams = async (req, res, next) => {
    const { userId } = req.query;

    if (userId === undefined) {
        res.send(401, "Inconsistent request");
    } else {
        const beamsToken = beamsClient.generateToken(userId);
        console.log("LOGIN BEAMS BY USER ID:" + userId);
        console.log("TOKEN: " + beamsToken);
        res.send(JSON.stringify(beamsToken));
    }
};

const pushNotificationToInterests = async (req, res, next) => {
    await beamsClient
        .publishToInterests(["debug-hello"], {
            fcm: {
                notification: {
                    title: "Hello",
                    body: "Hello, world!",
                },
            },
        })
        .then((publishResponse) => {
            console.log("Just published:", publishResponse.publishId);

            res.json({
                message: "Success",
                status: 200,
                data: {
                    publishResponse,
                },
            });
        })
        .catch((error) => {
            console.log("Error:", error);
        });
};

const pushNotificationToUsers = async (req, res, next) => {
    const users = req.body.users;
    const title = "Thinh phan tan";
    const body = "Chao ban!";
    const data = {
        ACTION: 102,
        USER_ID: "123adsdjasdlasdasd",
        NAME: "Thinh Phan Tan",
        AVATAR: "https://res.cloudinary.com/dknvhah81/image/upload/v1614582614/default/default-image_c2znfe.png"
    };

    await beamsClient
        .publishToUsers(users, {
            fcm: {
                notification: {
                    title,
                    body,
                },
                data
            },
            web: {
                notification: {
                    title: "Hello",
                    body: "Hello, world!",
                    deep_link:
                        "https://pusher.com/docs/beams/guides/publish-to-specific-user/web",
                },
            },
        })
        .then((publishResponse) => {
            console.log("Just published:", publishResponse.publishId);

            res.json({
                message: "Success",
                status: 200,
                data: {
                    publishResponse,
                },
            });
        })
        .catch((error) => {
            console.log("Error:", error);
        });
};

const beamsPushNotificationToUsers = async (userIds, title, body, data) => {
    console.log("Send notification to user!");
    userIds.map((userId) => {
        console.log("user: " + userId);
    })
    console.log("title: " + title);
    console.log("body: " + body);
    console.log("data: " + data);
    await beamsClient
        .publishToUsers(userIds, {
            fcm: {
                notification: {
                    title,
                    body,
                },
                data
            },
        })
        .then((publishResponse) => {
            console.log("Just published:", publishResponse.publishId);
        })
        .catch((error) => {
            console.log("Error:", error);
        });
}

exports.pushNotificationToInterests = pushNotificationToInterests;
exports.authBeams = authBeams;
exports.pushNotificationToUsers = pushNotificationToUsers;
exports.beamsPushNotificationToUsers= beamsPushNotificationToUsers;