// validate(zodSchema) parses req.body and replaces it with the cleaned values.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error); // handled in error.js
  req[source] = result.data;
  next();
};
