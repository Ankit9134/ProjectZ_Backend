const Joi = require("joi");

const validateRestaurant = Joi.object({
  firmName: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .error((errors) => {
      return errors.map(
        () => new Error("Firm name is required; it is a compulsory field")
      );
    }),

  area: Joi.string().alphanum().min(3).max(50).required(),
  city: Joi.string().min(3).max(50).required(),
  category: Joi.string().required(),
  cuisines: Joi.string().required(),
  dietary: Joi.string().required(),
  image: Joi.string().required(), // Use `uri()` if it's a URL path
  location: Joi.string().required(),
  ratings: Joi.number().min(0).max(5).required(),
  popularity: Joi.number().min(0).max(10).required(),
  video: Joi.string().optional(),
});

module.exports = validateRestaurant;
