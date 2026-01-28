import { Post } from "../models/postModel.js"; // Adjust the import path as necessary

export const updatePostStatus = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(now.getUTCDate() - 2);

  try {
    const posts = await Post.find({
      $or: [
        { "poll.status": { $in: ["upcoming", "active"] } },
        { "survey.status": { $in: ["upcoming", "active"] } },
      ],
    });

    for (const post of posts) {
      // Update poll status
      if (post.poll && post.poll.deadline) {
        const creationDate = post.poll.deadline;

        if (creationDate <= sevenDaysAgo) {
          post.poll.status = "past";
        } else if (creationDate <= now) {
          post.poll.status = "active";
        } else {
          post.poll.status = "upcoming";
        }
      }

      // Update survey status
      if (post.survey && post.survey.deadline) {
        const creationDate = post.survey.deadline;
        if (creationDate <= sevenDaysAgo) {
          post.survey.status = "past";
        } else if (creationDate <= now) {
          post.survey.status = "active";
        } else {
          post.survey.status = "upcoming";
        }
      }

      await post.save();
    }
  } catch (error) {
  }
};