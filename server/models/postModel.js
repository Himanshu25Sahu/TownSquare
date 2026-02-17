import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "issue",
        "poll",
        "general",
        "marketplace",
        "announcements",
        "survey",
      ],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    upVotes: {
      type: Number,
      default: 0,
    },
    downVotes: {
      type: Number,
      default: 0,
    },
    important: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        url: { type: String, required: true },
        fileType: { type: String, required: true },
        publicId: { type: String },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    votedUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        voteType: { type: String, enum: ["upvote", "downvote"] },
      },
    ],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    // Fields for polls
    poll: {
      question: { type: String }, // The poll question
      options: [
        {
          text: { type: String, required: true }, // The text of the option
          votes: { type: Number, default: 0 }, // Number of votes for this option
          votedBy: [
            {
              userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Users who voted for this option
            },
          ],
        },
      ],
      deadline: { type: Date }, // Deadline for the poll
      status: {
        type: String,
        enum: ["active", "upcoming", "past"],
        default: "active",
      }, // Status of the poll
      allowMultiple: {
        type: Boolean,
        default: false,
      },
    },
    // Fields for surveys
    survey: {
      questions: [
        {
          question: { type: String, required: true }, // The survey question
          type: {
            type: String,
            enum: ["multiple-choice", "open-ended", "rating"],
            required: true,
          }, // Type of question
          options: [{ type: String }], // Options for multiple-choice questions
          votes: [
            {
              optionIndex: { type: Number }, // Index of the selected option
              userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User who voted
            },
          ], // Votes for multiple-choice options
          responses: [
            {
              response: { type: String }, // Open-ended response
              userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User who responded
            },
          ], // Responses for open-ended questions
          ratings: [
            {
              rating: { type: Number, min: 1, max: 5 }, // Rating value
              userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User who rated
            },
          ], // Ratings for rating questions
        },
      ],
      deadline: { type: Date }, // Deadline for the survey
      status: {
        type: String,
        enum: ["active", "upcoming", "past"],
        default: "active",
      }, // Status of the survey
    },
    // Fields for marketplace
    // In your Post schema, change the marketplace field to:
    marketplace: {
      type: {
        itemType: {
          type: String,
          enum: ["sale", "free", "wanted"],
          required: function () {
            return this.parent().type === "marketplace";
          },
        },
        price: {
          type: Number,
          required: function () {
            return (
              this.parent().itemType === "sale" &&
              this.parent().type === "marketplace"
            );
          },
        },
        location: {
          type: String,
          required: function () {
            return this.parent().type === "marketplace";
          },
        },
        status: {
          type: String,
          enum: ["available", "sold", "pending"],
          default: "available",
        },
        tags: [{ type: String }],
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: function () {
            return this.parent().type === "marketplace";
          },
        },
        contactMessages: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            message: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            isRead: { type: Boolean, default: false }, // Add this field
          },
        ],
      },
      required: false, // ← This is the key change
    },
  },
  { timestamps: true },
);

// Middleware to dynamically calculate the "past" status based on the deadline
postSchema.pre("save", function (next) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 2);

  // Update poll status
  if (this.poll && this.poll.deadline) {
    if (this.poll.deadline <= sevenDaysAgo) {
      this.poll.status = "past";
    } else if (this.poll.status === "upcoming" && this.poll.deadline <= now) {
      this.poll.status = "active";
    } else if (this.poll.status === "upcoming" && this.poll.deadline > now) {
      this.poll.status = "upcoming";
    }
  }

  // Update survey status
  if (this.survey && this.survey.deadline) {
    if (this.survey.deadline <= sevenDaysAgo) {
      this.survey.status = "past";
    } else if (
      this.survey.status === "upcoming" &&
      this.survey.deadline <= now
    ) {
      this.survey.status = "active";
    } else if (
      this.survey.status === "upcoming" &&
      this.survey.deadline > now
    ) {
      this.survey.status = "upcoming";
    }
  }

  next();
});

export const Post = mongoose.model("Post", postSchema);
