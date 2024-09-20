const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/users");

usersRouter.post("/", async (request, response, next) => {
  const { username, name, password } = request.body;

  if (!password || password.length < 3) {
    return response.status(400).json({ error: "Password is too short!" });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  try {
    const savedUser = await user.save();

    response.status(201).json(savedUser);
  } catch (e) {
    next(e);
  }
});

usersRouter.get("/", async (_request, response) => {
  const users = await User.find({}).populate("blogs", {
    url: 1,
    title: 1,
    author: 1,
  });
  response.json(users);
});

module.exports = usersRouter;
