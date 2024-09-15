const dummy = (blogs) => {
  return 1;
};

/**
 * Finds total like count of a Blog list
 * @param blogs: Array
 * */
const totalLikes = (blogs) => {
  const likes = blogs.reduce((acc, blog) => {
    return acc + (blog.likes ?? 0);
  }, 0);
  return likes;
};

const favoriteBlog = (blogs) => {
  let mostLiked = 0;
  let largestLikeCount = 0;
  blogs.forEach((blog, idx) => {
    if (largestLikeCount < (blog.likes ?? 0)) {
      mostLiked = idx;
      largestLikeCount = blog.likes;
    }
  });

  return blogs[mostLiked];
};

/**
 * Takes a list of blogs with author name property required
 * finds the author with most number of blogs and returns their name and count of blogs.
 */
const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null;
  let currentMostBlogs = blogs[0].author ?? 0;
  const blogCountMap = {};
  for (let i in blogs) {
    if (!blogs[i].author) return null;
    const current = blogs[i].author;
    if (blogCountMap[current]) blogCountMap[current]++;
    else blogCountMap[current] = 1;

    if (blogCountMap[current] > blogCountMap[currentMostBlogs]) {
      currentMostBlogs = current;
    }
  }
  return {
    author: currentMostBlogs,
    blogs: blogCountMap[currentMostBlogs],
  };
};

/**
 * Takes a list of blogs with author name property required
 * finds the author with most number of likes and returns their name and total likes.
 */
const mostLikes = (blogs) => {
  if (blogs.length === 0) return null;
  let currentMostLikedBlogs = blogs[0].author ?? 0;
  const blogLikesMap = {};
  for (let i in blogs) {
    if (!blogs[i].author) return null;
    const current = blogs[i];
    if (blogLikesMap[current.author])
      blogLikesMap[current.author] += current.likes;
    else blogLikesMap[current.author] = current.likes;

    if (blogLikesMap[current.author] > blogLikesMap[currentMostLikedBlogs]) {
      currentMostLikedBlogs = current.author;
    }
  }
  return {
    author: currentMostLikedBlogs,
    likes: blogLikesMap[currentMostLikedBlogs],
  };
};

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes };
