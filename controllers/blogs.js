const blogsRouter = require("express").Router();

const Blog = require("../models/blogs");
const User = require("../models/users");

blogsRouter.get("/", async (_request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

blogsRouter.post("/", async (request, response, next) => {
  const user = await User.findById(request.user.id);
  const blog = new Blog({
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes,
    user: user.id,
  });

  try {
    const result = await blog.save();
    response.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

blogsRouter.put("/:id", async (request, response, next) => {
  const id = request.params.id;
  const body = request.body;
  if (!body) return response.status(400).json({ error: "Invalid body!" });
  try {
    const result = await Blog.findByIdAndUpdate(id, body, { new: true });
    response.json(result);
  } catch (e) {
    next(e);
  }
});

blogsRouter.delete("/:id", async (request, response, next) => {
  const id = request.params.id;
  try {
    const deleted = await Blog.findByIdAndDelete(id);
    response.json(deleted);
  } catch (e) {
    next(e);
  }
});

module.exports = blogsRouter;
