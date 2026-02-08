/**
 * Wraps an async route handler to automatically catch errors.
 */
export function asyncHandler(fn) {
  return async (request, reply) => {
    try {
      return await fn(request, reply);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  };
}

/**
 * Normalise pagination params from query string.
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
