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
  const authors = response.body.map((r) => r.author);

  assert.strictEqual(response.body.length, initialBlogs.length + 1);

  assert(titles.includes("Async Await"));
  assert(authors.includes("TC39"));
});

test("Result contains the `id` parameter", async () => {
  const response = await api.get("/api/blogs");
  const filtered = response.body.filter((blog) => {
    if (blog.id && !blog._id) return true;
  });

  assert.strictEqual(filtered.length, initialBlogs.length);
});

after(async () => {
  await mongoose.connection.close();
});
