import { Post } from "../models/postModel.js";
import { Comment } from "../models/commentModel.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import ErrorHandler from "../utils/errorHandler.js";
import mongoose from "mongoose";
import { User } from "../models/userModel.js";

export const createPost = async (req, res) => {
  try {
    const { title, description, type, important, poll, survey, marketplace } =
      req.body;
    const createdBy = req.user.id;

    // Helper function to safely parse JSON
    const safeParse = (data) => {
      try {
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    };

    const parsedPoll = safeParse(poll);
    const parsedSurvey = safeParse(survey);
    const parsedMarketplace = safeParse(marketplace);

    // Validate required fields
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and type are required.",
      });
    }

    // Validate post type specific fields
    let typeSpecificData = {};

    switch (type) {
      case "announcements":
        if (important === undefined) {
          return res.status(400).json({
            success: false,
            message: "The 'important' field is required for announcements.",
          });
        }
        typeSpecificData.important = important;
        break;

      case "poll":
        if (
          !parsedPoll?.question ||
          !parsedPoll?.options ||
          parsedPoll.options.length < 2
        ) {
          return res.status(400).json({
            success: false,
            message: "Polls require a question and at least 2 options.",
          });
        }

        const pollDeadline = new Date(parsedPoll.deadline);
        if (!parsedPoll.deadline || isNaN(pollDeadline.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Valid poll deadline is required.",
          });
        }

        typeSpecificData.poll = {
          question: parsedPoll.question,
          options: parsedPoll.options.map((option) => ({
            text: option.text || option,
            votes: 0,
            votedBy: [],
          })),
          deadline: pollDeadline,
          status: pollDeadline > new Date() ? "upcoming" : "active",
        };
        break;

      case "survey":
        if (!parsedSurvey?.questions || parsedSurvey.questions.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Surveys require at least one question.",
          });
        }

        const surveyDeadline = new Date(parsedSurvey.deadline);
        if (!parsedSurvey.deadline || isNaN(surveyDeadline.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Valid survey deadline is required.",
          });
        }

        typeSpecificData.survey = {
          questions: parsedSurvey.questions.map((question) => ({
            question: question.question,
            type: question.type,
            options: question.options || [],
            responses: [],
            ratings: [],
          })),
          deadline: surveyDeadline,
          status: surveyDeadline > new Date() ? "upcoming" : "active",
        };
        break;

      case "marketplace":
        if (!parsedMarketplace) {
          return res.status(400).json({
            success: false,
            message: "Marketplace data is required.",
          });
        }

        if (!parsedMarketplace.itemType || !parsedMarketplace.location) {
          return res.status(400).json({
            success: false,
            message: "Marketplace posts require itemType and location.",
          });
        }

        if (parsedMarketplace.itemType === "sale" && !parsedMarketplace.price) {
          return res.status(400).json({
            success: false,
            message: "Price is required for items listed for sale.",
          });
        }

        typeSpecificData.marketplace = {
          itemType: parsedMarketplace.itemType,
          price: parsedMarketplace.price,
          location: parsedMarketplace.location,
          status: parsedMarketplace.status || "available",
          tags: parsedMarketplace.tags || [],
          seller: createdBy,
          contactMessages: [],
        };
        break;

      default:
        // For general posts, no additional validation needed
        break;
    }

    // Handle attachments
    let attachments = [];
    if (req.files?.attachments?.length > 0) {
      attachments = await Promise.all(
        req.files.attachments.map(async (file) => {
          const uploaded = await uploadOnCloudinary(file.path);
          if (!uploaded) {
            throw new Error("Error uploading attachment files");
          }
          return {
            url: uploaded.url,
            fileType: file.mimetype,
            publicId: uploaded.public_id,
          };
        })
      );
    }

    // Create post data object
    const postData = {
      title,
      description,
      type,
      createdBy,
      attachments,
      ...typeSpecificData,
    };

    // Create and save post
    const newPost = new Post(postData);
    await newPost.save();

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};

export const getCountyPosts = async (req, res) => {
  try {
    const requestingUserId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Validate pagination parameters
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ success: false, message: 'Invalid page or limit' });
    }

    // Fetch user to get county (assuming this is unchanged)
    const user = await User.findById(requestingUserId);
    if (!user || !user.location?.county) {
      return res.status(400).json({ success: false, message: 'User or county not found' });
    }
    const userCounty = user.location.county;

    const posts = await Post.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator',
        },
      },
      { $unwind: '$creator' },
      {
        $match: {
          'creator.location.county': userCounty,
          type: { $in: ['announcements', 'poll', 'survey', 'general', 'marketplace', 'issue'] },
        },
      },
      // Add userVote field
      {
        $addFields: {
          userVote: {
            $reduce: {
              input: { $ifNull: ['$votedUsers', []] },
              initialValue: null,
              in: {
                $cond: [
                  { $eq: ['$$this.userId', new mongoose.Types.ObjectId(requestingUserId)] },
                  '$$this.voteType',
                  '$$value',
                ],
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          type: 1,
          createdAt: 1,
          updatedAt: 1,
          attachments: 1,
          upVotes: 1,
          downVotes: 1,
          important: 1,
          commentCount: 1,
          createdBy: {
            _id: '$creator._id',
            username: '$creator.username',
            email: '$creator.email',
            avatar: '$creator.avatar',
          },
          marketplace: 1,
          poll: 1,
          userVote: 1, // Ensure userVote is included
        },
      },
    ]);

    // Calculate total posts for pagination
    const totalPosts = await Post.countDocuments({
      createdBy: { $in: await User.find({ 'location.county': userCounty }).distinct('_id') },
      type: { $in: ['announcements', 'poll', 'survey', 'general', 'marketplace', 'issue'] },
    });

    // Format posts (assuming this is unchanged)
    const formattedPosts = posts.map((post) => ({
      ...post,
      createdBy: {
        _id: post.createdBy._id,
        username: post.createdBy.username,
        email: post.createdBy.email,
        avatar: post.createdBy.avatar,
      },
    }));

    // Fetch trending posts (assuming this is unchanged)
    const trending = await Post.find({
      createdBy: { $in: await User.find({ 'location.county': userCounty }).distinct('_id') },
      upVotes: { $gt: 0 },
    })
      .sort({ upVotes: -1 })
      .limit(5)
      .select('_id title upVotes');

    res.status(200).json({
      success: true,
      posts: formattedPosts,
      trending,
      county: userCounty,
      totalPosts,
    });
  } catch (error) {
    console.error('Error in getCountyPosts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper functions
function getTimeRemaining(endtime) {
  if (!endtime) return { days: 0, hours: 0, formatted: "No deadline" };

  const total = Date.parse(endtime) - Date.parse(new Date());
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);

  return {
    days,
    hours,
    formatted: `${days}d ${hours}h left`,
  };
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// SurveyAndPoll
export const getSurveyAndPollPosts = async (req, res) => {
  try {
    // Fetch posts where type is either "survey" or "poll"
    const posts = await Post.find({
      type: { $in: ["survey", "poll"] },
    })
      .populate("createdBy", "username email") // Populate the createdBy field with user details
      .sort({ createdAt: -1 }); // Sort by creation date in descending order

    // If no posts are found, return a 404 response
    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No survey or poll posts found.",
      });
    }

    // Map the posts to include the required fields
    const formattedPosts = posts.map((post) => {
      const response = {
        _id: post._id,
        title: post.title, // Include title
        description: post.description, // Include description
        type: post.type, // Include type
        createdBy: post.createdBy, // Include createdBy
        createdAt: post.createdAt, // Include createdAt
        updatedAt: post.updatedAt, // Include updatedAt
        attachments: post.attachments,
      };

      // Include survey or poll based on the post type
      if (post.type === "survey") {
        response.survey = post.survey; // Include survey details
      } else if (post.type === "poll") {
        response.poll = post.poll; // Include poll details
      }

      return response;
    });

    // Return the fetched posts
    res.status(200).json({
      success: true,
      message: "Survey and poll posts fetched successfully.",
      posts: formattedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching survey and poll posts.",
      error: error.message,
    });
  }
};
export const submitVote = async (req, res) => {
  try {
    const { postId } = req.params;
    const { option, response, rating, userId } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Handle poll voting logic
    if (post.type === "poll") {
      // Check if user has already voted in ANY option of this poll
      const hasUserVotedInPoll = post.poll.options.some((opt) =>
        opt.votedBy?.some(
          (vote) => vote && vote.userId && vote.userId.toString() === userId
        )
      );

      if (hasUserVotedInPoll) {
        return res.status(400).json({
          success: false,
          message: "You have already voted in this poll",
        });
      }

      // Find the selected option
      const pollOption = post.poll.options.find(
        (opt) => opt._id.toString() === option
      );

      if (!pollOption) {
        return res.status(400).json({
          success: false,
          message: "Invalid option",
        });
      }

      // Initialize votedBy array if it doesn't exist
      if (!pollOption.votedBy || !Array.isArray(pollOption.votedBy)) {
        pollOption.votedBy = [];
      }

      // Increment the vote count and add the user to votedBy
      pollOption.votes += 1;
      pollOption.votedBy.push({ userId });
    } else if (post.type === "survey") {
      const surveyQuestion = post.survey.questions[0]; // Assuming there's only one question for simplicity

      if (surveyQuestion.type === "multiple-choice") {
        // Log survey options and selected option ID

        // Check if options is an array of strings or objects
        if (typeof surveyQuestion.options[0] === "string") {
          // If options is an array of strings, treat option as an index
          const selectedOptionIndex = parseInt(option, 10);

          if (
            isNaN(selectedOptionIndex) ||
            selectedOptionIndex < 0 ||
            selectedOptionIndex >= surveyQuestion.options.length
          ) {
            return res.status(400).json({
              success: false,
              message: "Invalid option",
            });
          }

          // Check if the user has already voted for this question
          const hasUserVoted = surveyQuestion.votes.some(
            (vote) => vote && vote.userId && vote.userId.toString() === userId
          );

          if (hasUserVoted) {
            return res.status(400).json({
              success: false,
              message: "You have already voted for this question",
            });
          }

          // Add the vote with userId
          surveyQuestion.votes.push({
            optionIndex: selectedOptionIndex,
            userId,
          });
        } else {
          // If options is an array of objects, treat option as an _id
          const surveyOption = surveyQuestion.options.find(
            (opt) => opt._id.toString() === option
          );

          if (!surveyOption) {
            return res.status(400).json({
              success: false,
              message: "Invalid option",
            });
          }

          // Check if the user has already voted for this question
          const hasUserVoted = surveyQuestion.votes.some(
            (vote) => vote && vote.userId && vote.userId.toString() === userId
          );

          if (hasUserVoted) {
            return res.status(400).json({
              success: false,
              message: "You have already voted for this question",
            });
          }

          // Add the vote with userId
          surveyQuestion.votes.push({
            optionIndex: surveyQuestion.options.indexOf(surveyOption),
            userId,
          });
        }
      } else if (surveyQuestion.type === "open-ended") {
        // Handle open-ended response logic
        if (!response) {
          return res.status(400).json({
            success: false,
            message: "Response is required for open-ended questions",
          });
        }

        // Check if the user has already responded to this question
        const hasUserResponded = surveyQuestion.responses.some(
          (resp) => resp && resp.userId && resp.userId.toString() === userId
        );

        if (hasUserResponded) {
          return res.status(400).json({
            success: false,
            message: "You have already responded to this question",
          });
        }

        // Add the response with userId
        surveyQuestion.responses.push({
          response,
          userId,
        });
      } else if (surveyQuestion.type === "rating") {
        // Handle rating logic
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            message: "Invalid rating. Must be a number between 1 and 5",
          });
        }

        // Check if the user has already rated this question
        const hasUserRated = surveyQuestion.ratings.some(
          (rate) => rate && rate.userId && rate.userId.toString() === userId
        );

        if (hasUserRated) {
          return res.status(400).json({
            success: false,
            message: "You have already rated this question",
          });
        }

        // Add the rating with userId
        surveyQuestion.ratings.push({
          rating,
          userId,
        });
      }
    }

    // Save the updated post
    await post.save();

    res.status(200).json({
      success: true,
      message: "Vote submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting vote",
      error: error.message,
    });
  }
};
export const viewResults = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate postId
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
    }

    // Find the post with only necessary fields
    const post = await Post.findById(postId, {
      type: 1,
      poll: 1,
      survey: 1,
    }).exec();

    // Check if the post exists
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if the post is a poll or survey
    if (post.type !== "poll" && post.type !== "survey") {
      return res.status(400).json({
        success: false,
        message: "This post is not a poll or survey",
      });
    }

    // Initialize the results object
    const results = {};

    // Handle poll results
    if (post.type === "poll" && post.poll) {
      results.poll = {
        question: post.poll.question,
        options: post.poll.options.map((option) => ({
          text: option.text,
          votes: option.votes,
          votedBy: option.votedBy,
        })),
        totalVotes: post.poll.options.reduce(
          (acc, option) => acc + option.votes,
          0
        ),
      };
    }

    // Handle survey results
    if (post.type === "survey" && post.survey) {
      results.survey = {
        questions: await Promise.all(
          post.survey.questions.map(async (question) => {
            const questionResult = {
              question: question.question,
              type: question.type,
            };

            // Handle multiple-choice questions
            if (question.type === "multiple-choice") {
              questionResult.options = await Promise.all(
                question.options.map(async (option, index) => {
                  const votes = question.votes.filter(
                    (vote) => vote.optionIndex === index
                  );
                  const votedByUsers = await Promise.all(
                    votes.map(async (vote) => {
                      const user = await User.findById(vote.userId, {
                        username: 1,
                      }).exec();
                      return user ? user.username : "Unknown User";
                    })
                  );

                  return {
                    text: option,
                    votes: votes.length,
                    votedBy: votedByUsers,
                  };
                })
              );
              questionResult.totalVotes = question.votes.length;
            }

            // Handle open-ended questions
            if (question.type === "open-ended") {
              questionResult.responses = await Promise.all(
                question.responses.map(async (response) => {
                  const user = await User.findById(response.userId, {
                    username: 1,
                  }).exec();
                  return {
                    response: response.response,
                    userId: response.userId,
                    username: user ? user.username : "Unknown User",
                  };
                })
              );
              questionResult.totalResponses = question.responses.length;
            }

            // Handle rating questions
            if (question.type === "rating") {
              const totalRatings = question.ratings.length;
              const averageRating =
                totalRatings > 0
                  ? question.ratings.reduce(
                      (acc, rating) => acc + rating.rating,
                      0
                    ) / totalRatings
                  : 0;

              questionResult.ratings = await Promise.all(
                question.ratings.map(async (rating) => {
                  const user = await User.findById(rating.userId, {
                    username: 1,
                  }).exec();
                  return {
                    rating: rating.rating,
                    userId: rating.userId,
                    username: user ? user.username : "Unknown User",
                  };
                })
              );
              questionResult.averageRating = averageRating;
              questionResult.totalRatings = totalRatings;
            }

            return questionResult;
          })
        ),
        totalQuestions: post.survey.questions.length,
      };
    }

    // Return the results
    return res.status(200).json({
      success: true,
      results: results,
    });
  } catch (error) {
    console.error("Error in viewResults controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//MarketPlace
// Fetch marketplace posts
export const getMarketplacePosts = async (req, res) => {
  try {
    const { itemType, searchQuery, minPrice, maxPrice, location, sortOption } =
      req.query;

    // Build the query
    const query = { type: "marketplace" };

    // Filter by itemType if provided
    if (itemType && ["sale", "free", "wanted"].includes(itemType)) {
      query["marketplace.itemType"] = itemType;
    }

    // Search by title, description, or location if searchQuery is provided
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { "marketplace.location": { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query["marketplace.price"] = {};
      if (minPrice) query["marketplace.price"].$gte = Number(minPrice);
      if (maxPrice) query["marketplace.price"].$lte = Number(maxPrice);
    }

    // Filter by location
    if (location) {
      query["marketplace.location"] = { $regex: location, $options: "i" };
    }

    // Fetch posts from the database
    let posts = await Post.find(query)
      .populate("createdBy", "username email") // Populate the createdBy field with user details
      .populate("marketplace.seller", "username email rating") // Populate the seller field with user details
      .sort({ createdAt: -1 }); // Default sort by latest first

    // Apply sorting
    if (sortOption) {
      switch (sortOption) {
        case "newest":
          posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case "oldest":
          posts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case "priceAsc":
          posts.sort((a, b) => a.marketplace.price - b.marketplace.price);
          break;
        case "priceDesc":
          posts.sort((a, b) => b.marketplace.price - a.marketplace.price);
          break;
        default:
          break;
      }
    }

    // Format the response
    const formattedPosts = posts.map((post) => ({
      id: post._id,
      title: post.title,
      description: post.description,
      itemType: post.marketplace.itemType,
      price: post.marketplace.price,
      location: post.marketplace.location,
      status: post.marketplace.status,
      tags: post.marketplace.tags || [], // Include tags if available
      images: post.attachments.map((attachment) => attachment.url), // Use attachments for images
      seller: post.marketplace.seller, // Use populated seller for seller details
      createdAt: post.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching marketplace posts",
      error: error.message,
    });
  }
};
export const sendMessageToSeller = async (req, res) => {
  try {
    const { postId } = req.params;
    const { message } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Ensure the post is a marketplace post
    if (post.type !== "marketplace") {
      return res.status(400).json({
        success: false,
        message: "This post is not a marketplace post.",
      });
    }

    // Add the message to the post
    post.marketplace.contactMessages.push({
      userId: req.user._id, // Use the authenticated user's ID
      message,
    });

    await post.save();

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

// Delete a post (Only the creator can delete)
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // Assuming user ID is available via authentication middleware

    const post = await Post.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);
    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting post",
      error: error.message,
    });
  }
};

// Get all posts (Feed)
export const getAllPosts = async (req, res) => {
  try {
    // Step 1: Delete all posts where createdBy is null
    // await Post.deleteMany({ createdBy: null });

    // Step 2: Fetch all remaining posts and populate createdBy with user details
    const posts = await Post.find()
      .populate("createdBy", "username email avatar avatarPublicId") // Populate user details
      .sort({ createdAt: -1 }); // Sort by creation date in descending order

    // Step 3: Return the remaining posts
    res.status(200).json({
      success: true,
      message:
        "Posts fetched successfully after cleaning up null createdBy posts",
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

// Get a single post by ID
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate(
      "createdBy",
      "name email avatar username"
    );

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching post",
      error: error.message,
    });
  }
};

// Upvote a post (User can only upvote once)
export const upvotePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Check if the user has already voted
    const existingVoteIndex = post.votedUsers.findIndex(
      (vote) => vote.userId.toString() === userId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = post.votedUsers[existingVoteIndex];
      if (existingVote.voteType === "upvote") {
        return res.status(400).json({
          success: false,
          message: "You have already upvoted this post",
        });
      } else {
        // User previously downvoted, switch to upvote
        post.downVotes -= 1;
        post.votedUsers[existingVoteIndex].voteType = "upvote";
        post.upVotes += 1;
      }
    } else {
      // New upvote
      post.upVotes += 1;
      post.votedUsers.push({ userId, voteType: "upvote" });
    }

    const updatedPost = await post.save();
    res.status(200).json({
      success: true,
      message: "Post upvoted successfully",
      upVotes: updatedPost.upVotes,
      downVotes: updatedPost.downVotes,
    });
  } catch (error) {
    console.error("Error upvoting post:", error);
    res.status(500).json({
      success: false,
      message: "Error upvoting post",
      error: error.message,
    });
  }
};

// Downvote a post (User can only downvote once)
export const downvotePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Check if the user has already voted
    const existingVoteIndex = post.votedUsers.findIndex(
      (vote) => vote.userId.toString() === userId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = post.votedUsers[existingVoteIndex];
      if (existingVote.voteType === "downvote") {
        return res.status(400).json({
          success: false,
          message: "You have already downvoted this post",
        });
      } else {
        // User previously upvoted, switch to downvote
        post.upVotes -= 1;
        post.votedUsers[existingVoteIndex].voteType = "downvote";
        post.downVotes += 1;
      }
    } else {
      // New downvote
      post.downVotes += 1;
      post.votedUsers.push({ userId, voteType: "downvote" });
    }

    const updatedPost = await post.save();
    res.status(200).json({
      success: true,
      message: "Post downvoted successfully",
      downVotes: updatedPost.downVotes,
      upVotes: updatedPost.upVotes,
    });
  } catch (error) {
    console.error("Error downvoting post:", error);
    res.status(500).json({
      success: false,
      message: "Error downvoting post",
      error: error.message,
    });
  }
};

// Remove a vote from a post
export const removeVote = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Check if the user has voted
    const existingVoteIndex = post.votedUsers.findIndex(
      (vote) => vote.userId.toString() === userId.toString()
    );

    if (existingVoteIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You haven't voted on this post yet",
      });
    }

    // Remove the vote and adjust counts
    const existingVote = post.votedUsers[existingVoteIndex];
    if (existingVote.voteType === "upvote") {
      post.upVotes -= 1;
    } else {
      post.downVotes -= 1;
    }

    // Remove the vote from the array
    post.votedUsers.splice(existingVoteIndex, 1);

    const updatedPost = await post.save();
    res.status(200).json({
      success: true,
      message: "Vote removed successfully",
      upVotes: updatedPost.upVotes,
      downVotes: updatedPost.downVotes,
    });
  } catch (error) {
    console.error("Error removing vote:", error);
    res.status(500).json({
      success: false,
      message: "Error removing vote",
      error: error.message,
    });
  }
};

// Add comment to a post
export const addComment = async (req, res) => {
  try {
    const { postId, message } = req.body;
    const userId = req.user.id;

    if (!postId || !message) {
      return res.status(400).json({
        success: false,
        message: "Post ID and message are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    // Check if post exists
    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Create a new comment
    const comment = new Comment({
      postId,
      userId,
      message,
    });
    await comment.save();

    // Add comment reference to the post using $addToSet to prevent duplicates
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { comments: comment._id } },
      { new: true }
    ).populate("comments");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message,
    });
  }
};
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate postId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    // Check if post exists
    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get comments with user details and total count
    const [comments, total] = await Promise.all([
      Comment.find({ postId })
        .populate("userId", "username avatar") // Include user details
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ postId }),
    ]);

    res.status(200).json({
      success: true,
      message: comments.length
        ? "Comments retrieved successfully"
        : "No comments found for this post",
      comments,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting post comments:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving comments",
      error: error.message,
    });
  }
};

//poll
export const createPoll = async (req, res) => {
  try {
    const { title, solutions } = req.body;
    const createdBy = req.user._id;

    // Validate required fields
    if (
      !title ||
      !solutions ||
      !Array.isArray(solutions) ||
      solutions.length < 2 ||
      solutions.length > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and 2 to 5 solutions are required.",
      });
    }

    // Format solutions with initial votes
    const formattedSolutions = solutions.map((solution) => ({
      text: solution,
      votes: 0,
    }));

    const newPoll = new Post({
      title,
      type: "poll",
      createdBy,
      solutions: formattedSolutions,
    });

    await newPoll.save();
    res.status(201).json({
      success: true,
      message: "Poll created successfully",
      poll: newPoll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating poll",
      error: error.message,
    });
  }
};

export const getAllAnnouncements = async (req, res) => {
  try {
    // Fetch all announcements and populate the createdBy field with user details
    const announcements = await Post.find({ type: "announcements" })
      .populate("createdBy", "username avatar") // Populate username and avatar
      .sort({ createdAt: -1 }); // Sort by creation date in descending order

    // If no announcements are found
    if (announcements.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No announcements found.",
        announcements: [],
      });
    }

    // Return the announcements
    res.status(200).json({
      success: true,
      message: "Announcements fetched successfully",
      announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message,
    });
  }
};

//marketPlace ContactMessage fetching
// Get marketplace contact messages for a seller
export const getMarketplaceMessages = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Find all marketplace posts by this seller that have contact messages
    const postsWithMessages = await Post.find({
      type: "marketplace",
      "marketplace.seller": sellerId,
      "marketplace.contactMessages.0": { $exists: true }
    })
    .populate({
      path: "marketplace.contactMessages.userId",
      select: "username email avatar"
    })
    .sort({ "marketplace.contactMessages.createdAt": -1 });

    if (!postsWithMessages || postsWithMessages.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No marketplace messages found",
        messages: []
      });
    }

    // Format the response to include all messages (both read and unread)
    const formattedMessages = postsWithMessages.flatMap(post => {
      return post.marketplace.contactMessages.map(message => ({
        postId: post._id,
        postTitle: post.title,
        postDescription: post.description,
        postPrice: post.marketplace.price,
        postLocation: post.marketplace.location,
        postStatus: post.marketplace.status,
        postAttachments: post.attachments.map(attachment => ({
          url: attachment.url,
          fileType: attachment.fileType
        })),
        messageId: message._id,
        message: message.message,
        createdAt: message.createdAt,
        isRead: message.isRead,
        sender: {
          userId: message.userId._id,
          username: message.userId.username,
          email: message.userId.email,
          avatar: message.userId.avatar
        }
      }));
    });

    res.status(200).json({
      success: true,
      message: "Marketplace messages retrieved successfully",
      messages: formattedMessages,
      totalMessages: formattedMessages.length
    });

  } catch (error) {
    console.error("Error fetching marketplace messages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching marketplace messages",
      error: error.message
    });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { postId, messageId } = req.params;
    const sellerId = req.user._id;

    // Find the post and verify the seller owns it
    const post = await Post.findOne({
      _id: postId,
      type: "marketplace",
      "marketplace.seller": sellerId
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not the seller"
      });
    }

    // Find the message and update its read status
    const message = post.marketplace.contactMessages.id(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    message.isRead = true;
    await post.save();

    // Return the updated message
    const updatedMessage = {
      messageId: message._id,
      isRead: message.isRead
    };

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      updatedMessage
    });

  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking message as read",
      error: error.message
    });
  }
};

// Get messages for a specific marketplace post
export const getPostMessages = async (req, res) => {
  try {
    const { postId } = req.params;
    const sellerId = req.user._id; // Authenticated user must be the seller

    // Find the post and verify the seller owns it
    const post = await Post.findOne({
      _id: postId,
      type: "marketplace",
      "marketplace.seller": sellerId
    })
    .populate({
      path: "marketplace.contactMessages.userId",
      select: "username email avatar" // User details of message senders
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not the seller"
      });
    }

    // Format the messages
    const formattedMessages = post.marketplace.contactMessages.map(message => ({
      messageId: message._id,
      message: message.message,
      createdAt: message.createdAt,
      isRead: message.isRead || false,
      sender: {
        userId: message.userId._id,
        username: message.userId.username,
        email: message.userId.email,
        avatar: message.userId.avatar
      }
    }));

    res.status(200).json({
      success: true,
      message: "Post messages retrieved successfully",
      post: {
        id: post._id,
        title: post.title,
        description: post.description,
        price: post.marketplace.price,
        location: post.marketplace.location,
        status: post.marketplace.status,
        attachments: post.attachments.map(attachment => ({
          url: attachment.url,
          fileType: attachment.fileType
        }))
      },
      messages: formattedMessages,
      totalMessages: formattedMessages.length
    });

  } catch (error) {
    console.error("Error fetching post messages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post messages",
      error: error.message
    });
  }
};
