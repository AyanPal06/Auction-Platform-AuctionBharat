class ErrorHandeler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal server error.";
  err.statusCode = err.statusCode || 500;

  if (err.name === "JsonWebTokenError") {
    const message = "Json web token is invalid,try again";
    err = new ErrorHandeler(message, 400);
  }
  if (err.name === "TokenExpiredError") {
    const message = "Json web token is expired,try again";
    err = new ErrorHandeler(message, 400);
  }
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}`;
    err = new ErrorHandeler(message, 400);
  }

  const errorMessage = err.errors
    ? Object.values(err.errors)
        .map((error) => error.message)
        .join(" ")
    : err.message;
    // console.log(err);

    return res.status(err.statusCode).json({
        success:false,
        message: errorMessage,
    });
};

export default ErrorHandeler;
