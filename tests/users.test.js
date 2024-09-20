const { test, beforeEach, describe, after } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/users");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", name: "any", passwordHash });

    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await usersInDb();

    const newUser = {
      username: "mluukkai",
      name: "Matti Luukkainen",
      password: "salainen",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes(newUser.username));
  });

  test("username is unique", async () => {
    const usersAtStart = await usersInDb();
    const newUser = {
      username: "root",
      name: "any",
      password: "salainen",
    };
    await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("password must exist", async () => {
    const usersAtStart = await usersInDb();
    const newUser = {
      username: "mluukkai",
      name: "Matti Luukkainen",
    };
    await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("username must be >3 characters", async () => {
    const usersAtStart = await usersInDb();
    const newUser = {
      username: "a",
      name: "Matti Luukkainen",
      password: "salainen",
    };
    await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
  test("password must be >3 characters", async () => {
    const usersAtStart = await usersInDb();
    const newUser = {
      username: "mluukkai",
      name: "Matti Luukkainen",
      password: "sa",
    };
    await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});
after(async () => {
  await mongoose.connection.close();
});
