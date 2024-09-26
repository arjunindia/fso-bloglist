const blogsRouter = require("express").Router();

const Blog = require("../models/blogs");
const { tokenExtractor, userExtractor } = require("../middleware/auth");

blogsRouter.get("/", async (_request, response) => {
  const blogs = await Blog.find({}).populate("user");
  response.json(blogs);
});

blogsRouter.use(tokenExtractor);
blogsRouter.use(userExtractor);
blogsRouter.post("/", async (request, response, next) => {
  if (request.body === undefined)
    return response.status(400).json({ error: "Invalid body!" });
  try {
    let user = request.user;

    const blog = new Blog({
      title: request.body.title,
      author: request.body.author,
      url: request.body.url,
      likes: request.body.likes,
      user: user.id,
    });

    const result = await blog.save();
    user.blogs.push(result._id);
    await user.save();
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
    let user = request.user;
    if (!user.blogs.includes(id))
      return response.status(401).json({ error: "Unauthorized!" });
    user.blogs = user.blogs.filter((blog) => blog !== id);
    await user.save();
    const deleted = await Blog.findByIdAndDelete(id);
    response.json(deleted);
  } catch (e) {
    next(e);
  }
});

module.exports = blogsRouter;
