const jwtHelper = require("../helpers/jwt.helper");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

module.exports = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const tokenFromClient = req.headers.authorization.split(" ")[1];

    if (tokenFromClient) {
      try {
        const decoded = await jwtHelper.verifyToken(
          tokenFromClient,
          accessTokenSecret
        );

        req.jwtDecoded = decoded;

        next();
      } catch (err) {
        res.status(401).json({
          message: "Authentication failed!",
        });
      }
    } else {
      res.status(401).json({
        message: "Authentication failed!",
      });
    }
  } catch (err) {
    res.status(401).json({
      message: "Authentication failed!",
    });
  }
};
