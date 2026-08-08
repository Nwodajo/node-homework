const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required(),
  isCompleted: Joi.boolean().default(false),
});

const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255),
  isCompleted: Joi.boolean(),
}).min(1);

module.exports = {
  taskSchema,
  patchTaskSchema,
};