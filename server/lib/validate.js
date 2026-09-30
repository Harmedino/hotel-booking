const { z } = require('zod');
const { badRequest } = require('./errors');

// Parses req[source] with a zod schema and replaces it with the parsed value.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join('.');
      return next(badRequest(field ? `${field}: ${issue.message}` : issue.message, result.error.flatten().fieldErrors));
    }
    if (source === 'query') {
      req.validQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date (YYYY-MM-DD)')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'must be a valid date');

const uuid = z.string().uuid('is not a valid id');

module.exports = { validate, z, isoDate, uuid };
