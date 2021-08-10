
const jwt = require("jsonwebtoken");
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
});

const generateToken = (user, secretSignature, tokenLife) => {
  return new Promise((resolve, reject) => {
    const userData = {
      userId: user.id || user.userId,
      role: user.role || '',
      // name: user.name,
      // avatar: user.avatar,
      // phone: user.phone,
      // email: user.email,
    }

    jwt.sign(
      { data: userData },
      secretSignature,
      {
        expiresIn: tokenLife,
      },
      (error, token) => {
        if (error) {
          return reject(error);
        }
        resolve(token);
      });
  });
}
const verifyToken = (token, secretKey) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        return reject(error);
      }
      resolve(decoded);
    });
  });
}

const getAppleSigningKey = (kid) => {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (error, key) => {
        if(error){
           return reject(error);
        }
        const signingKey = key.getPublicKey();
        resolve(signingKey);
    })
  })
}

exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.getAppleSigningKey = getAppleSigningKey;