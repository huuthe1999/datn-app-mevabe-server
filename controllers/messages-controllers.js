const Conversations = require("../models/conversation");
const Messages = require("../models/message");
const CustomError = require("../models/custom-error");
const Logger = require("../helpers/logger");

class APIfeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    paginating() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 9;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

const createMessage = async (message) => {
    try {
        const { sender, recipient, text, media } = message;

        if (!recipient || (!text.trim() && media.length === 0)) {
            //Logger.error("Error create message", { recipient, text, media });
            // return CustomError(res, "Tạo message thất bại, thử lại!", -1001);
            return false;
        }

        const time = new Date().getTime();

        const newConversation = await Conversations.findOneAndUpdate(
            {
                $or: [
                    { recipients: [sender, recipient] },
                    { recipients: [recipient, sender] },
                ],
            },
            {
                recipients: [sender, recipient],
                isSeen: false,
                createAt: time,
                updateAt: time,
            },
            { new: true, upsert: true }
        );

        const newMessage = new Messages({
            conversation: newConversation._id,
            sender,
            recipient,
            text,
            media,
            time,
            createAt: time,
            updateAt: time,
        });
        newConversation.lastMessage = newMessage._id;
        await newMessage.save();
        await newConversation.save();

        //Logger.info("Create message success by user: " + req.jwtDecoded.data.userId);
        // res.json({
        //     message: "Success",
        //     status: 200,
        //     data: {
        //         message: newMessage,
        //     },
        // });

        return true;
    } catch (err) {
        //Logger.error("Create message failed by user: " + req.jwtDecoded.data.userId);
        // return CustomError(res, "Tạo message thất bại, thử lại!", -1101);
        return false;
    }
};

const updateMessage = async (req, res) => {
    const { text } = req.body;

    if (!text.trim()) {
        return CustomError(res, "Tạo message thất bại, thử lại!", -2001);
    }

    try {
        let message = await Messages.findOneAndUpdate(
            { _id: req.params.mid, sender: req.jwtDecoded.data.userId },
            { text, updateAt: new Date().getTime() },
            { new: true }
        );

        res.json({
            message: "Success",
            status: 200,
            data: {
                message,
            },
        });
    } catch (err) {
        return CustomError(
            res,
            "Update thông tin messages thất bại, thử lại!",
            -2101
        );
    }
};

const getConversations = async (req, res) => {
    try {
        const userId = req.jwtDecoded.data.userId;
        const features = new APIfeatures(
            Conversations.find({
                recipients: userId,
            })
                .populate("lastMessage")
                .lean(),
            req.query
        ).paginating();

        const conversations = await features.query
            .sort("-updatedAt")
            .populate("recipients", "avatar name");

        conversations.map((conversation) => {
            conversation.recipients.map((recipient) => {
                if (recipient._id != userId) {
                    conversation.recipient = recipient;
                }
            });
            delete conversation.recipients;
        });

        res.json({
            message: "Success",
            status: 200,
            data: {
                conversations,
                result: conversations.length,
            },
        });
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin conversations thất bại, thử lại!",
            -3101
        );
    }
};

const getMessages = async (req, res) => {
    try {
        const userId = req.jwtDecoded.data.userId;
        const features = new APIfeatures(
            Messages.find({
                $or: [
                    { sender: userId, recipient: req.params.uid },
                    { sender: req.params.uid, recipient: userId },
                ],
            }),
            req.query
        ).paginating();

        const messages = await features.query.sort("-createAt").lean();

        messages.reverse();

        res.json({
            message: "Success",
            status: 200,
            data: {
                messages,
                result: messages.length,
            },
        });
    } catch (err) {
        return CustomError(
            res,
            "Lấy thông tin messages thất bại, thử lại!",
            -4101
        );
    }
};

const deleteMessages = async (req, res) => {
    try {
        await Messages.findOneAndDelete({
            _id: req.params.mid,
            sender: req.jwtDecoded.data.userId,
        });
        res.json({
            message: "Success",
            status: 200,
        });
    } catch (err) {
        return CustomError(res, "Xoá messages thất bại, thử lại!", -5101);
    }
};

const deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversations.findOneAndDelete({
            $or: [
                { recipients: [req.jwtDecoded.data.userId, req.params.uid] },
                { recipients: [req.params.uid, req.jwtDecoded.data.userId] },
            ],
        });

        await Messages.deleteMany({ conversation: conversation._id });

        res.json({
            message: "Success",
            status: 200,
        });
    } catch (err) {
        return CustomError(res, "Xoá conversation thất bại, thử lại!", -6101);
    }
};

const seenConversation = async (req, res) => {
    try {
        let conversation = await Conversations.findOneAndUpdate(
            { _id: req.params.cid },
            { isSeen: true },
            { new: true }
        );

        res.json({
            message: "Success",
            status: 200,
            data: {
                conversation,
            },
        });
    } catch (err) {
        return CustomError(
            res,
            "Update thông tin conversation thất bại, thử lại!",
            -7101
        );
    }
};

exports.createMessage = createMessage;
exports.updateMessage = updateMessage;
exports.getConversations = getConversations;
exports.getMessages = getMessages;
exports.deleteMessages = deleteMessages;
exports.deleteConversation = deleteConversation;
exports.seenConversation = seenConversation;
