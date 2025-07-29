class Response {
  static success(res, data, statusCode, message, status = "Success") {
    return res.status(statusCode).json({
      data,
      message: message,
      statusCode: statusCode,
      status: status,
    });
  }

  static error(res, statusCode, status = "Failure", message) {
    return res.status(statusCode).json({
      message: message,
      statusCode: statusCode,
      status: status,
    });
  }
}

module.exports = Response;
