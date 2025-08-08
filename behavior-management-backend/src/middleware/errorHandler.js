const errorHandler = (err, req, res, next) => {
  // Default error shape
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Log full error server-side
  console.error('Error:', err);

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  }

  // Validation library errors (Joi/Zod style)
  if (err.isJoi) {
    statusCode = 400;
    message = err.details.map(detail => detail.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

module.exports = errorHandler; 