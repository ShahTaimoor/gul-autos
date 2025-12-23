const { BadRequestError } = require('../errors');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw new BadRequestError(errors[0].message);
    }

    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }
    next();
  };
};

module.exports = validate;

