const { test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blogs");

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

beforeEach(async () => {
  await Blog.deleteMany({});
  let blogObject = new Blog(initialBlogs[0]);
  await blogObject.save();
  blogObject = new Blog(initialBlogs[1]);
  await blogObject.save();
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
  const newBlog = {
    title: "Async Await",
    author: "TC39",
    url: "https://github.com/tc39/proposal-async-await",
    likes: 1600,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const response = await api.get("/api/blogs");

  const titles = response.body.map((r) => r.title);
  const urls = response.body.map((r) => r.url);

  assert.strictEqual(response.body.length, initialBlogs.length + 1);

  assert(titles.includes("Async Await"));
  assert(urls.includes("https://github.com/tc39/proposal-async-await"));
});

test("If new blog added does not have like parameter it defaults to 0", async () => {
  const newBlog = {
    title: "Async Await",
    author: "TC39",
    url: "https://github.com/tc39/proposal-async-await",
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const response = await api.get("/api/blogs");

  const currAdded = response.body.find((r) => r.author === "TC39");

  assert.strictEqual(currAdded.likes, 0);
});

test("if the title or url properties are missing, status 400", async () => {
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
    .send(noTitleBlog)
    .expect(400)
    .expect("Content-Type", /application\/json/);
  await api
    .post("/api/blogs")
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
  const deleteResponse = await api.delete("/api/blogs/" + firstId);
  assert.strictEqual(deleteResponse.body.title, firstTitle);
  const afterResponse = await api.get("/api/blogs");
  assert.strictEqual(afterResponse.body.length, 1);
  await api.delete("/api/blogs/" + "598278573289578927").expect(400);
});

test("Can update using API", async () => {
  const response = await api.get("/api/blogs");
  const firstId = response.body[0].id;
  const toUpdate = {
    title: "HI!",
    likes: 200,
  };
  const updateResponse = await api.put("/api/blogs/" + firstId).send(toUpdate);
  assert.strictEqual(toUpdate.title, updateResponse.body.title);
  assert.strictEqual(toUpdate.likes, updateResponse.body.likes);
  const afterResponse = await api.get("/api/blogs");
  const afterValue = afterResponse.body.find(
    (blog) => blog.title === toUpdate.title,
  );
  assert.strictEqual(afterValue.likes, toUpdate.likes);
  await api.put("/api/blogs/" + "598278573289578927").expect(400);
});

after(async () => {
  await mongoose.connection.close();
});
