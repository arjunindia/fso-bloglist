const bcrypt = require("bcrypt");
const User = require("../models/users");
const loginRouter = require("express").Router();
const jsonwebtoken = require("jsonwebtoken");
const { JWT_SECRET } = require("../utils/config");

loginRouter.post("/", async (request, response, next) => {
  const { username, password } = request.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return response.status(401).json({ error: "User not found!" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return response.status(401).json({ error: "Incorrect password!" });
    }

    const userObject = {
      username,
      id: user.id,
    };
    const token = jsonwebtoken.sign(userObject, JWT_SECRET, {
      expiresIn: 60 * 60 * 24,
    });

    response.json({ token });
  } catch (e) {
    next(e);
  }
});

module.exports = loginRouter;
