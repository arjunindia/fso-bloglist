const { test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blogs");
const User = require("../models/users");

const api = supertest(app);

test("blog list is in json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

const initialBlogs = [
  {
    title: "Hello",
    author: "arjun",
    url: "a.com",
    likes: 100000000,
  },
  {
    title: "Dracula",
    author: "Bram Stoker",
    url: "https://www.britannica.com/topic/Dracula-novel",
    likes: 200000000,
  },
];

const initialUsers = [
  {
    username: "arjun",
    name: "Arjun",
    passwordHash:
      "$2a$10$ZP5fu.JZlSUdPR11gqel4uZ0HMBQoDuDNw2Pc.L7P2jc8ETDFnd7O", // "arjun"
  },
  {
    username: "Bram",
    name: "Bram",
    passwordHash:
      "$2a$10$AmEXo0m6Cz3y0KhKeU6hSONHd.0CiPke/fg7puC/YNJ/UbPPJNruO", // "bram"
  },
];

beforeEach(async () => {
  await Blog.deleteMany({});
  const blogObject1 = new Blog(initialBlogs[0]);
  await blogObject1.save();
  const blogObject2 = new Blog(initialBlogs[1]);
  await blogObject2.save();

  await User.deleteMany({});
  let userObject = new User(initialUsers[0]);
  userObject.blogs.push(blogObject1._id);
  userObject.blogs.push(blogObject2._id);
  await userObject.save();
  userObject = new User(initialUsers[1]);
  await userObject.save();
});

test("there are two blogs", async () => {
  const response = await api.get("/api/blogs");

  assert.strictEqual(response.body.length, 2);
});

test("the blog list contains Dracula entry", async () => {
  const response = await api.get("/api/blogs");

  const contents = response.body.map((e) => e.title);
  assert.strictEqual(contents.includes("Dracula"), true);
});

test("a valid blog can be added ", async () => {
  const token = await api
    .post("/api/login")
    .send({ username: "arjun", password: "arjun" })
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => res.body.token);

  const newBlog = {
    title: "Async Await",
    author: "TC39",
    url: "https://github.com/tc39/proposal-async-await",
    likes: 1600,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .set("Authorization", `Bearer ${token}`)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const response = await api.get("/api/blogs");

  const titles = response.body.map((r) => r.title);
  const urls = response.body.map((r) => r.url);

  assert.strictEqual(response.body.length, initialBlogs.length + 1);

  assert(titles.includes("Async Await"));
  assert(urls.includes("https://github.com/tc39/proposal-async-await"));
});

test("401 if not logged in", async () => {
  const newBlog = {
    title: "Async Await",
    author: "TC39",
    url: "https://github.com/tc39/proposal-async-await",
    likes: 1600,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(401)
    .expect("Content-Type", /application\/json/);
});

test("If new blog added does not have like parameter it defaults to 0", async () => {
  const token = await api
    .post("/api/login")
    .send({ username: "arjun", password: "arjun" })
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => res.body.token);

  const newBlog = {
    title: "Async Await",
    author: "TC39",
    url: "https://github.com/tc39/proposal-async-await",
  };

  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const response = await api.get("/api/blogs");

  const currAdded = response.body.find((r) => r.author === "TC39");

  assert.strictEqual(currAdded.likes, 0);
});

test("if the title or url properties are missing, status 400", async () => {
  const token = await api
    .post("/api/login")
    .send({ username: "arjun", password: "arjun" })
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => res.body.token);

  const noTitleBlog = {
    author: "TC39",
    url: "https://github.com/tc39/proposal-async-await",
  };

  const noUrlBlog = {
    title: "Async Await",
    author: "TC39",
  };

  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(noTitleBlog)
    .expect(400)
    .expect("Content-Type", /application\/json/);
  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(noUrlBlog)
    .expect(400)
    .expect("Content-Type", /application\/json/);
});

test("Result contains the `id` parameter", async () => {
  const response = await api.get("/api/blogs");
  const filtered = response.body.filter((blog) => {
    if (blog.id && !blog._id) return true;
  });

  assert.strictEqual(filtered.length, initialBlogs.length);
});

test("Can delete using API", async () => {
  const response = await api.get("/api/blogs");
  const firstId = response.body[0].id;
  const firstTitle = response.body[0].title;

  const token = await api
    .post("/api/login")
    .send({ username: "arjun", password: "arjun" })
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => res.body.token);

  const deleteResponse = await api
    .delete("/api/blogs/" + firstId)
    .set("Authorization", `Bearer ${token}`);
  assert.strictEqual(deleteResponse.body.title, firstTitle);
  const afterResponse = await api.get("/api/blogs");
  assert.strictEqual(afterResponse.body.length, 1);
  await api
    .delete("/api/blogs/" + "598278573289578927")
    .set("Authorization", `Bearer ${token}`)
    .expect(401 || 400);
});

test("401 if not logged in", async () => {
  const response = await api.get("/api/blogs");
  const firstId = response.body[0].id;

  await api
    .delete("/api/blogs/" + firstId)
    .expect(401)
    .expect("Content-Type", /application\/json/);
});

test("401 if deleted blog does not belong to user", async () => {
  const response = await api.get("/api/blogs");
  const firstId = response.body[0].id;

  const token = await api
    .post("/api/login")
    .send({ username: "Bram", password: "bram" })
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => res.body.token);

  await api
    .delete("/api/blogs/" + firstId)
    .set("Authorization", `Bearer ${token}`)
    .expect(401)
    .expect("Content-Type", /application\/json/);
});

test("Can update using API", async () => {
  const response = await api.get("/api/blogs");
  const firstId = response.body[0].id;
  const toUpdate = {
    title: "HI!",
    likes: 200,
  };

  const token = await api
    .post("/api/login")
    .send({ username: "arjun", password: "arjun" })
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => res.body.token);
  const updateResponse = await api
    .put("/api/blogs/" + firstId)
    .send(toUpdate)
    .set("Authorization", `Bearer ${token}`);
  assert.strictEqual(toUpdate.title, updateResponse.body.title);
  assert.strictEqual(toUpdate.likes, updateResponse.body.likes);
  const afterResponse = await api.get("/api/blogs");
  const afterValue = afterResponse.body.find(
    (blog) => blog.title === toUpdate.title,
  );
  assert.strictEqual(afterValue.likes, toUpdate.likes);
  await api
    .put("/api/blogs/" + "598278573289578927")
    .set("Authorization", `Bearer ${token}`)
    .expect(400);
});

after(async () => {
  await mongoose.connection.close();
});
