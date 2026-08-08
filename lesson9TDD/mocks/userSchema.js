const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().trim().min(1).max(30).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).required(),
});

module.exports = userSchema;
module.exports.userSchema = userSchema;