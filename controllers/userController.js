const register = (req, res) => {
  const { name, email, password } = req.body;

  const user = {
    name,
    email,
    password,
  };

  global.users.push(user);
  global.user_id = user;

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
};

const logon = (req, res) => {
  const { email, password } = req.body;

  const user = global.users.find(
    (currentUser) =>
      currentUser.email === email && currentUser.password === password
  );

  if (!user) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  global.user_id = user;

  return res.status(200).json({
    name: user.name,
    email: user.email,
  });
};

const logoff = (req, res) => {
  global.user_id = null;

  return res.sendStatus(200);
};

module.exports = {
  register,
  logon,
  logoff,
};