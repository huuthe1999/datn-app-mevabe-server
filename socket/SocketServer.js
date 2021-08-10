const Logger = require("../helpers/logger");
const messagesController = require("../controllers/messages-controllers");
const Notification = require("../helpers/pusher-admin.js");

let users = [];

const SocketServer = (io, socket) => {
    socket.on("joinUser", async (user) => {
        const existingUser = users.find((u) => u._id === user._id);

        if (existingUser) {
            user.room = existingUser.room;
        } else {
            user.room = Date.now();
        }

        socket.join(user.room);
        users.push({ ...user, socketId: socket.id });

        Logger.info("User connected to server.", {
            ...user,
        });

        Logger.info("USER ON SERVER.", {
            users: users.map((user) => user._id),
        });
    });

    socket.on("disconnect", async () => {
        const user = users.find((user) => user.socketId === socket.id);
        users = users.filter((user) => user.socketId !== socket.id);

        if (user) socket.leave(user.room);

        Logger.info("USER DISCONNECT TO SERVER.", {
            listUsers: users.map((user) => user._id),
            socketId: socket.id,
            userId: user ? user._id : "empty",
        });
    });

    // Message
    socket.on("addMessage", async (msg) => {
        Logger.info("User send messages to server.", {
            ...msg,
        });

        const sender = users.find((user) => user.socketId === socket.id);
        if(sender){
            console.log("sender: " + sender._id);
            const sendMessageResult = await messagesController.createMessage(msg);
            console.log(sendMessageResult);

            const recipients = users.filter(
                (user) => user._id === msg.recipient
            );

            if (sendMessageResult) {
                socket.to(sender.room).emit("addMessageToClientSender", msg);

                msg.sender = sender;
                msg.status = true;
                Logger.info("Recipient: ", {
                    recipient: recipients.length > 0 ? recipients[0] : "empty",
                });

                if (recipients.length > 0) {
                    socket.to(recipients[0].room).emit("addMessageToClient", msg);

                    const text = msg.text.trim() ? msg.text : "Đã gửi ảnh cho bạn!";
                    Notification.beamsPushNotificationToUsers(
                        [recipients[0]._id],
                        sender.name,
                        text,
                        {
                            ACTION: 102,
                            USER_ID: sender._id,
                            NAME: sender.name,
                            AVATAR: sender.avatar,
                        }
                    );
                }
            } else {
                Logger.info("Send message FAILED", {
                    sender: sender || "empty",
                    recipient: recipients.length > 0 ? recipients[0] : "empty",
                });
                msg.status = false;
                sender && socket.emit("addMessageToClientCallBack", msg);
            }
        }else{
            console.log("sender: "+ "empty");
        }
    });
};

module.exports = SocketServer;
