const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
const blogsRouter = require("./controllers/blogs");
const { MONGODB_URI, PORT } = require("./utils/config");

const mongoUrl = MONGODB_URI;
mongoose.connect(mongoUrl);

app.use(cors());
app.use(express.json());

app.use("/api/blogs", blogsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
