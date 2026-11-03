export function notFound(req, res, _next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value entered for: ${Object.keys(err.keyValue).join(', ')}`;
  } else if (err.name === 'CastError') {
    statusCode = 404;
    message = `Invalid ${err.path}`;
  }

  console.error(err);

  // In production, never leak internal error details (which can include file
  // paths, DB URIs, etc.) for genuine 5xx server errors. Return a safe generic
  // message and keep the full detail in the server log above. Expected client
  // errors (4xx above: validation, duplicates, cast) are safe to return.
  const clientMessage =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : message;

  res.status(statusCode).json({ success: false, message: clientMessage });
}
