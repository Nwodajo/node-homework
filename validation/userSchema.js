const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .required(),

  email: Joi.string()
    .trim()
    .email()
    .required(),

  password: Joi.string()
    .min(8)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[^a-zA-Z0-9]/)
    .required(),
});

module.exports = {
  userSchema,
};