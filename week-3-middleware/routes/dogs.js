const express = require("express");
const dogs = require("../dogData");

const {
  ValidationError,
  NotFoundError,
} = require("../errors");

const router = express.Router();

// GET /dogs
router.get("/dogs", (req, res) => {
  return res.status(200).json(dogs);
});

// POST /adopt
router.post("/adopt", (req, res, next) => {
  try {
    const { name, address, email, dogName } = req.body;

    // The required fields are name, email, and dogName.
    // Address can be optional.
    if (!name || !email || !dogName) {
      throw new ValidationError("Missing required fields");
    }

    const dog = dogs.find(
      (currentDog) =>
        currentDog.name.toLowerCase() === dogName.toLowerCase()
    );

    if (!dog || dog.status !== "available") {
      throw new NotFoundError("Dog not found or not available");
    }

    return res.status(201).json({
      message: `Adoption request received. We will contact you at ${email} for further details.`,
      application: {
        name,
        address,
        email,
        dogName,
        applicationId: Date.now(),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /error
router.get("/error", (req, res, next) => {
  next(new Error("Test error"));
});

module.exports = router;