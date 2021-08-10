module.exports = {
    'facebookAuth': {
        'clientID': process.env.FACEBOOK_CLIENT_ID,
        'clientSecret': process.env.FACEBOOK_CLIENT_SECRET,
        'callbackURL': `${process.env.HOST_URL}/api/auths/facebook/callback`
    },
    'googleAuth': {
        'clientID': process.env.GOOGLE_CLIENT_ID,
        'clientSecret': process.env.GOOGLE_CLIENT_SECRET,
        'callbackURL': `${process.env.HOST_URL}/api/auths/google/callback`
    },
    'hashPassword': {
        salt: 12
    }
};