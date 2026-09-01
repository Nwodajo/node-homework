const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().trim().min(3).max(30).required(),

  email: Joi.string().trim().email().required(),

  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .pattern(/[^A-Za-z0-9]/)
    .required(),
});

module.exports = userSchema;
module.exports.userSchema = userSchema;// Revision verified: validation tests pass.
