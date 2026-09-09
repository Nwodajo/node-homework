const { userSchema } = require("../validation/userSchema");
const {
  taskSchema,
  patchTaskSchema,
} = require("../validation/taskSchema");

describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      {
        name: "Bob",
        email: "bob@sample.com",
        password: "password",
      },
      { abortEarly: false },
    );

    expect(
      error?.details.some(
        (detail) => detail.context?.key === "password",
      ),
    ).toBe(true);
  });

  it("2. requires that an email be specified", () => {
  const user = {
    name: "Bob Smith",
    email: "bob@sample.com",
    password: "Pa$$word20",
  };

  delete user.email;

  const { error } = userSchema.validate(user, {
    abortEarly: false,
  });

  expect(error?.details.some(
    (detail) => detail.context?.key === "email"
  )).toBe(true);
});

it("3. does not accept an invalid email", () => {
  const user = {
    name: "Bob Smith",
    email: "not-an-email",
    password: "Pa$$word20",
  };

  const { error } = userSchema.validate(user, {
    abortEarly: false,
  });

  expect(error?.details.some(
    (detail) => detail.context?.key === "email"
  )).toBe(true);
});

it("4. requires a password", () => {
  const user = {
    name: "Bob Smith",
    email: "bob@sample.com",
    password: "Pa$$word20",
  };

  delete user.password;

  const { error } = userSchema.validate(user, {
    abortEarly: false,
  });

  expect(error?.details.some(
    (detail) => detail.context?.key === "password"
  )).toBe(true);
});

it("5. requires name", () => {
  const user = {
    name: "Bob Smith",
    email: "bob@sample.com",
    password: "Pa$$word20",
  };

  delete user.name;

  const { error } = userSchema.validate(user, {
    abortEarly: false,
  });

  expect(error?.details.some(
    (detail) => detail.context?.key === "name"
  )).toBe(true);
});

  it("6. the name must be valid", () => {
    const { error } = userSchema.validate(
      {
        name: "Bo",
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
      { abortEarly: false },
    );

    expect(
      error?.details.some(
        (detail) => detail.context?.key === "name",
      ),
    ).toBe(true);
  });

  it("7. valid user object returns no error", () => {
    const { error } = userSchema.validate({
      name: "Bob",
      email: "bob@sample.com",
      password: "Pa$$word20",
    });

    expect(error).toBeFalsy();
  });
});

describe("taskSchema validation tests", () => {
  it("8. the task schema requires a title", () => {
    const { error } = taskSchema.validate({
      isCompleted: false,
    });

    expect(
      error?.details.some(
        (detail) => detail.context?.key === "title",
      ),
    ).toBe(true);
  });

  it("9. isCompleted must be valid if specified", () => {
    const { error } = taskSchema.validate({
      title: "Test task",
      isCompleted: "not-a-boolean",
    });

    expect(
      error?.details.some(
        (detail) => detail.context?.key === "isCompleted",
      ),
    ).toBe(true);
  });

  it("10. isCompleted defaults to false when not specified", () => {
    const { value } = taskSchema.validate({
      title: "Test task",
    });

    expect(value.isCompleted).toBe(false);
  });

  it("11. isCompleted remains true when true is provided", () => {
    const { value } = taskSchema.validate({
      title: "Test task",
      isCompleted: true,
    });

    expect(value.isCompleted).toBe(true);
  });
});

describe("patchTaskSchema validation tests", () => {
  it("12. patchTaskSchema does not require a title", () => {
    const { error } = patchTaskSchema.validate({
      isCompleted: true,
    });

    expect(error).toBeFalsy();
  });

  it("13. isCompleted remains undefined when not provided", () => {
    const { value } = patchTaskSchema.validate({
      title: "Updated task",
    });

    expect(value.isCompleted).toBeUndefined();
  });
});