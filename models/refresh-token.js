const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    token: String,
    createdByIp: String,
    revoked: Date,
    revokedByIp: String,
    replacedByToken: String,
    created: {type:Number, default: new Date().getTime()},
});

module.exports = mongoose.model('RefreshToken', schema);