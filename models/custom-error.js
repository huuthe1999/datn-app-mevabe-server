const CustomError = (res, message, errorCode) => {
  res.json({
    message,
    status: errorCode,
  });
};

module.exports = CustomError;
