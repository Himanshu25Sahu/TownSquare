

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { Card } from "../components/Card";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment-timezone";
import {
  HiOutlinePencilAlt,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineShoppingBag,
  HiOutlineChatAlt2,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlinePaperClip,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlinePhotograph,
  HiOutlineDocument,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineCurrencyDollar,
  HiOutlineTag,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineArrowRight,
} from "react-icons/hi";
import { HiMegaphone } from "react-icons/hi2";
import "./CreatePost.css";
import { useSelector } from "react-redux";

const MAX_UPLOADS = 3;

// Fixed easing values for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
      duration: 0.5,
      ease: [0.6, 0.05, 0.01, 0.9],
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, 0.05, 0.01, 0.9],
    },
  },
};

const buttonHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

const iconAnimation = {
  rest: { rotate: 0 },
  hover: {
    rotate: 15,
    scale: 1.2,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

function CreatePost() {
  const { token } = useSelector((state) => state.user);
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "general",
    important: false,
    poll: { question: "", options: ["", ""], deadline: null },
    survey: { questions: [{ question: "", type: "multiple-choice", options: ["", ""] }], deadline: null },
    marketplace: {
      itemType: "sale",
      price: 0,
      location: "",
      status: "available",
      tags: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("general");
  const [uploadsRemaining, setUploadsRemaining] = useState(MAX_UPLOADS);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (name === "type") {
      setActiveTab(value);
    }
  };

  const handleMarketplaceChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      marketplace: { ...formData.marketplace, [name]: value },
    });
  };

  const handlePollQuestionChange = (e) => {
    setFormData({
      ...formData,
      poll: { ...formData.poll, question: e.target.value },
    });
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...formData.poll.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      poll: { ...formData.poll, options: newOptions },
    });
  };

  const addPollOption = () => {
    setFormData({
      ...formData,
      poll: { ...formData.poll, options: [...formData.poll.options, ""] },
    });
  };

  const removePollOption = (index) => {
    if (formData.poll.options.length <= 2) return;
    const newOptions = [...formData.poll.options];
    newOptions.splice(index, 1);
    setFormData({
      ...formData,
      poll: { ...formData.poll, options: newOptions },
    });
  };

  const handleSurveyQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.survey.questions];
    newQuestions[index][field] = value;
    
    if (field === "type" && value === "multiple-choice" && (!newQuestions[index].options || newQuestions[index].options.length === 0)) {
      newQuestions[index].options = ["", ""];
    }
    
    setFormData({
      ...formData,
      survey: { ...formData.survey, questions: newQuestions },
    });
  };

  const addSurveyQuestion = () => {
    setFormData({
      ...formData,
      survey: {
        ...formData.survey,
        questions: [
          ...formData.survey.questions,
          { question: "", type: "multiple-choice", options: ["", ""] },
        ],
      },
    });
  };

  const removeSurveyQuestion = (index) => {
    if (formData.survey.questions.length <= 1) return;
    const newQuestions = [...formData.survey.questions];
    newQuestions.splice(index, 1);
    setFormData({
      ...formData,
      survey: { ...formData.survey, questions: newQuestions },
    });
  };

  const handleSurveyOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...formData.survey.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setFormData({
      ...formData,
      survey: { ...formData.survey, questions: newQuestions },
    });
  };

  const addSurveyOption = (questionIndex) => {
    const newQuestions = [...formData.survey.questions];
    newQuestions[questionIndex].options.push("");
    setFormData({
      ...formData,
      survey: { ...formData.survey, questions: newQuestions },
    });
  };

  const removeSurveyOption = (questionIndex, optionIndex) => {
    const newQuestions = [...formData.survey.questions];
    if (newQuestions[questionIndex].options.length <= 2) return;
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setFormData({
      ...formData,
      survey: { ...formData.survey, questions: newQuestions },
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > MAX_UPLOADS) {
      alert(`You can only upload a maximum of ${MAX_UPLOADS} files.`);
      return;
    }
    setFiles([...files, ...selectedFiles]);
    setUploadsRemaining(MAX_UPLOADS - (files.length + selectedFiles.length));
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    setUploadsRemaining(MAX_UPLOADS - newFiles.length);
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) {
      return <HiOutlinePhotograph className="create-post-file-type-icon" />;
    }
    return <HiOutlineDocument className="create-post-file-type-icon" />;
  };

  const validateForm = () => {
    if (!formData.title || !formData.description) {
      throw new Error("Title and description are required");
    }

    if (formData.type === "poll") {
      if (!formData.poll.question || formData.poll.options.some(opt => !opt.trim())) {
        throw new Error("Poll requires a question and all options must be filled");
      }
      if (!formData.poll.deadline) {
        throw new Error("Poll deadline is required");
      }
    }

    if (formData.type === "survey") {
      if (formData.survey.questions.some(q => !q.question.trim())) {
        throw new Error("All survey questions must be filled");
      }
      if (!formData.survey.deadline) {
        throw new Error("Survey deadline is required");
      }
      formData.survey.questions.forEach(q => {
        if (q.type === "multiple-choice" && q.options.some(opt => !opt.trim())) {
          throw new Error("All multiple-choice options must be filled");
        }
      });
    }

    if (formData.type === "marketplace") {
      if (!formData.marketplace.itemType || !formData.marketplace.location) {
        throw new Error("Item type and location are required for marketplace posts");
      }
      if (formData.marketplace.itemType === "sale" && !formData.marketplace.price) {
        throw new Error("Price is required for items listed for sale");
      }
    }

    if (formData.type === "announcements" && formData.important === undefined) {
      throw new Error("Please specify if this is an important announcement");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      validateForm();

      const postData = new FormData();
      postData.append("title", formData.title);
      postData.append("description", formData.description);
      postData.append("type", formData.type);
      postData.append("important", formData.important);

      if (formData.type === "poll") {
        postData.append("poll", JSON.stringify({
          question: formData.poll.question,
          options: formData.poll.options,
          deadline: formData.poll.deadline
        }));
      }

      if (formData.type === "survey") {
        postData.append("survey", JSON.stringify({
          questions: formData.survey.questions,
          deadline: formData.survey.deadline
        }));
      }

      if (formData.type === "marketplace") {
        postData.append("marketplace", JSON.stringify({
          itemType: formData.marketplace.itemType,
          price: formData.marketplace.price,
          location: formData.marketplace.location,
          status: formData.marketplace.status,
          tags: formData.marketplace.tags || [],
        }));
      }

      if (files.length > 0) {
        files.forEach((file) => {
          postData.append("attachments", file);
        });
      }

      if (!token) {
        throw new Error("User is not authenticated");
      }

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_BASEURL}/post/create`, postData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Post created successfully!");

      setFormData({
        title: "",
        description: "",
        type: "general",
        important: false,
        poll: { question: "", options: ["", ""], deadline: null },
        survey: { questions: [{ question: "", type: "multiple-choice", options: ["", ""] }], deadline: null },
        marketplace: { itemType: "sale", price: 0, location: "", status: "available", tags: [] },
      });
      setFiles([]);
      setActiveTab("general");
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`create-post-container ${theme}`}>
      <motion.main
        className="create-post-main"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className="create-post-header" variants={itemVariants}>
          <h1 className="create-post-page-title">Create New Post</h1>
          <p className="create-post-page-subtitle">
            Share your thoughts, questions, or concerns with the community
          </p>
        </motion.div>

        <motion.div className="create-post-type-tabs" variants={itemVariants}>
          <motion.button
            className={`create-post-type-tab ${
              activeTab === "general" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("general");
              setFormData({ ...formData, type: "general" });
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ y: 0, transition: { duration: 0.1 } }}
          >
            <motion.div whileHover={iconAnimation}>
              <HiOutlineChatAlt2 />
            </motion.div>
            <span>General</span>
          </motion.button>
          <motion.button
            className={`create-post-type-tab ${
              activeTab === "issue" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("issue");
              setFormData({ ...formData, type: "issue" });
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ y: 0, transition: { duration: 0.1 } }}
          >
            <motion.div whileHover={iconAnimation}>
              <HiOutlineExclamationCircle />
            </motion.div>
            <span>Issue</span>
          </motion.button>
          <motion.button
            className={`create-post-type-tab ${
              activeTab === "poll" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("poll");
              setFormData({ ...formData, type: "poll" });
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ y: 0, transition: { duration: 0.1 } }}
          >
            <motion.div whileHover={iconAnimation}>
              <HiOutlineClipboardList />
            </motion.div>
            <span>Poll</span>
          </motion.button>
          <motion.button
            className={`create-post-type-tab ${
              activeTab === "marketplace" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("marketplace");
              setFormData({ ...formData, type: "marketplace" });
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ y: 0, transition: { duration: 0.1 } }}
          >
            <motion.div whileHover={iconAnimation}>
              <HiOutlineShoppingBag />
            </motion.div>
            <span>Marketplace</span>
          </motion.button>
          <motion.button
            className={`create-post-type-tab ${
              activeTab === "announcements" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("announcements");
              setFormData({ ...formData, type: "announcements" });
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ y: 0, transition: { duration: 0.1 } }}
          >
            <motion.div whileHover={iconAnimation}>
              <HiMegaphone />
            </motion.div>
            <span>Announcements</span>
          </motion.button>
          <motion.button
            className={`create-post-type-tab ${
              activeTab === "survey" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("survey");
              setFormData({ ...formData, type: "survey" });
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            whileTap={{ y: 0, transition: { duration: 0.1 } }}
          >
            <motion.div whileHover={iconAnimation}>
              <HiOutlineDocumentText />
            </motion.div>
            <span>Survey</span>
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="create-post-card">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  className="create-post-error-message"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <HiOutlineExclamationCircle className="create-post-message-icon" />
                  </motion.div>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  className="create-post-success-message"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.2, repeat: 1 }}
                  >
                    <HiOutlineCheckCircle className="create-post-message-icon" />
                  </motion.div>
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <motion.div className="create-post-form-group" variants={fadeIn}>
                <label htmlFor="title">
                  <HiOutlinePencilAlt className="create-post-input-icon" /> 
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive title"
                  className="create-post-form-control"
                  required
                />
              </motion.div>

              <motion.div className="create-post-form-group" variants={fadeIn}>
                <label htmlFor="description">
                  <HiOutlineDocumentText className="create-post-input-icon" /> 
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide details about your post"
                  className="create-post-form-control"
                  rows="5"
                  required
                ></textarea>
              </motion.div>

              <AnimatePresence mode="wait">
                {activeTab === "poll" && (
                  <motion.div
                    className="create-post-poll-options-container"
                    key="poll-options"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.6, 0.05, 0.01, 0.9] }}
                  >
                    <label>
                      <HiOutlineClipboardList className="create-post-input-icon" /> 
                      Poll Question
                    </label>
                    <input
                      type="text"
                      value={formData.poll.question}
                      onChange={handlePollQuestionChange}
                      placeholder="Enter your poll question"
                      className="create-post-form-control"
                      required
                    />
                    <label>Poll Options</label>
                    {formData.poll.options.map((option, index) => (
                      <motion.div
                        key={index}
                        className="create-post-poll-option-input"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handlePollOptionChange(index, e.target.value)
                          }
                          placeholder={`Option ${index + 1}`}
                          className="create-post-form-control"
                          required
                        />
                        {formData.poll.options.length > 2 && (
                          <motion.button
                            type="button"
                            className="create-post-remove-option-btn"
                            onClick={() => removePollOption(index)}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <HiOutlineX />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                    <motion.button
                      type="button"
                      className="create-post-add-option-btn"
                      onClick={addPollOption}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonHover}
                    >
                      <motion.div variants={iconAnimation}>
                        <HiOutlinePlus className="create-post-btn-icon" />
                      </motion.div>
                      Add Option
                    </motion.button>
                    <label>
                      <HiOutlineCalendar className="create-post-input-icon" /> 
                      Poll Deadline
                    </label>
                    <DatePicker
                      selected={formData.poll.deadline}
                      onChange={(date) =>
                        setFormData({
                          ...formData,
                          poll: { ...formData.poll, deadline: date },
                        })
                      }
                      dateFormat="MMMM d, yyyy"
                      className="create-post-form-control"
                      placeholderText="Select deadline"
                      minDate={new Date()}
                      required
                    />
                  </motion.div>
                )}

                {activeTab === "survey" && (
                  <motion.div
                    className="create-post-survey-questions-container"
                    key="survey-questions"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.6, 0.05, 0.01, 0.9] }}
                  >
                    <label>
                      <HiOutlineDocumentText className="create-post-input-icon" /> 
                      Survey Questions
                    </label>
                    {formData.survey.questions.map((question, index) => (
                      <motion.div
                        key={index}
                        className="create-post-survey-question-input"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) =>
                            handleSurveyQuestionChange(
                              index,
                              "question",
                              e.target.value
                            )
                          }
                          placeholder={`Question ${index + 1}`}
                          className="create-post-form-control"
                          required
                        />
                        <select
                          value={question.type}
                          onChange={(e) =>
                            handleSurveyQuestionChange(
                              index,
                              "type",
                              e.target.value
                            )
                          }
                          className="create-post-form-control"
                        >
                          <option value="multiple-choice">
                            Multiple Choice
                          </option>
                          <option value="open-ended">Open Ended</option>
                          <option value="rating">Rating</option>
                        </select>
                        {question.type === "multiple-choice" && (
                          <div className="create-post-survey-options-container">
                            {question.options.map((option, optIndex) => (
                              <motion.div
                                key={optIndex}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: optIndex * 0.05,
                                  duration: 0.3,
                                }}
                              >
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) =>
                                    handleSurveyOptionChange(
                                      index,
                                      optIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Option ${optIndex + 1}`}
                                  className="create-post-form-control"
                                  required
                                />
                                {question.options.length > 2 && (
                                  <motion.button
                                    type="button"
                                    className="create-post-remove-option-btn"
                                    onClick={() => removeSurveyOption(index, optIndex)}
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <HiOutlineX />
                                  </motion.button>
                                )}
                              </motion.div>
                            ))}
                            <motion.button
                              type="button"
                              className="create-post-add-option-btn"
                              onClick={() => addSurveyOption(index)}
                              initial="rest"
                              whileHover="hover"
                              whileTap="tap"
                              variants={buttonHover}
                            >
                              <motion.div variants={iconAnimation}>
                                <HiOutlinePlus className="create-post-btn-icon" />
                              </motion.div>
                              Add Option
                            </motion.button>
                          </div>
                        )}
                        {formData.survey.questions.length > 1 && (
                          <motion.button
                            type="button"
                            className="create-post-remove-question-btn"
                            onClick={() => removeSurveyQuestion(index)}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <HiOutlineX />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                    <motion.button
                      type="button"
                      className="create-post-add-question-btn"
                      onClick={addSurveyQuestion}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonHover}
                    >
                      <motion.div variants={iconAnimation}>
                        <HiOutlinePlus className="create-post-btn-icon" />
                      </motion.div>
                      Add Question
                    </motion.button>
                    <label>
                      <HiOutlineCalendar className="create-post-input-icon" /> 
                      Survey Deadline
                    </label>
                    <DatePicker
                      selected={formData.survey.deadline}
                      onChange={(date) =>
                        setFormData({
                          ...formData,
                          survey: { ...formData.survey, deadline: date },
                        })
                      }
                      dateFormat="MMMM d, yyyy"
                      className="create-post-form-control"
                      placeholderText="Select deadline"
                      minDate={new Date()}
                      required
                    />
                  </motion.div>
                )}

                {activeTab === "announcements" && (
                  <motion.div
                    className="create-post-announcements-fields"
                    key="announcements-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.6, 0.05, 0.01, 0.9] }}
                  >
                    <div className="create-post-form-group">
                      <label htmlFor="important">
                        <HiOutlineExclamationCircle className="create-post-input-icon" /> 
                        Important Announcement
                      </label>
                      <input
                        type="checkbox"
                        id="important"
                        name="important"
                        checked={formData.important}
                        onChange={handleChange}
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === "marketplace" && (
                  <motion.div
                    className="create-post-marketplace-fields"
                    key="marketplace-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.6, 0.05, 0.01, 0.9] }}
                  >
                    <div className="create-post-form-group">
                      <label htmlFor="itemType">
                        <HiOutlineTag className="create-post-input-icon" /> Item
                        Type
                      </label>
                      <select
                        id="itemType"
                        name="itemType"
                        value={formData.marketplace.itemType}
                        onChange={handleMarketplaceChange}
                        className="create-post-form-control"
                        required
                      >
                        <option value="sale">For Sale</option>
                        <option value="free">Free</option>
                        <option value="wanted">Wanted</option>
                      </select>
                    </div>

                    {formData.marketplace.itemType === "sale" && (
                      <div className="create-post-form-group">
                        <label htmlFor="price">
                          <HiOutlineCurrencyDollar className="create-post-input-icon" /> 
                          Price
                        </label>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={formData.marketplace.price}
                          onChange={handleMarketplaceChange}
                          placeholder="Enter price"
                          className="create-post-form-control"
                          required
                          min="0"
                        />
                      </div>
                    )}

                    <div className="create-post-form-group">
                      <label htmlFor="location">
                        <HiOutlineLocationMarker className="create-post-input-icon" /> 
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.marketplace.location}
                        onChange={handleMarketplaceChange}
                        placeholder="Enter location"
                        className="create-post-form-control"
                        required
                      />
                    </div>

                    <div className="create-post-form-group">
                      <label htmlFor="status">
                        <HiOutlineTag className="create-post-input-icon" /> 
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.marketplace.status}
                        onChange={handleMarketplaceChange}
                        className="create-post-form-control"
                        required
                      >
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="create-post-form-group">
                      <label htmlFor="tags">
                        <HiOutlineTag className="create-post-input-icon" /> Tags
                        (optional)
                      </label>
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.marketplace.tags?.join(", ") || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            marketplace: {
                              ...formData.marketplace,
                              tags: e.target.value
                                .split(",")
                                .map((tag) => tag.trim()),
                            },
                          })
                        }
                        placeholder="Enter tags separated by commas (e.g., furniture, vintage)"
                        className="create-post-form-control"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div className="create-post-form-group" variants={fadeIn}>
                <label htmlFor="attachments">
                  <HiOutlinePaperClip className="create-post-input-icon" /> 
                  Attachments
                </label>
                <div className="create-post-file-upload-container">
                  <motion.label
                    className="create-post-file-upload-label"
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonHover}
                  >
                    <motion.div variants={iconAnimation}>
                      <HiOutlineUpload className="create-post-upload-icon" />
                    </motion.div>
                    Choose Files
                    <input
                      type="file"
                      id="attachments"
                      onChange={handleFileChange}
                      multiple
                      className="create-post-file-input"
                      disabled={uploadsRemaining === 0}
                    />
                  </motion.label>
                  <span className="create-post-file-help-text">
                    Upload images or documents (optional) - {uploadsRemaining} 
                    uploads remaining
                  </span>
                </div>

                {files.length > 0 && (
                  <motion.div
                    className="create-post-file-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {files.map((file, index) => (
                      <motion.div
                        key={index}
                        className="create-post-file-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ x: 5 }}
                      >
                        {getFileIcon(file.type)}
                        <span className="create-post-file-name">
                          {file.name}
                        </span>
                        <motion.button
                          type="button"
                          className="create-post-remove-file-btn"
                          onClick={() => removeFile(index)}
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <HiOutlineTrash />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                className="create-post-form-actions"
                variants={fadeIn}
              >
                <motion.button
                  type="button"
                  className="create-post-cancel-button"
                  onClick={() => window.history.back()}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonHover}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  onClick={handleSubmit}
                  className={`create-post-primary-button ${
                    isSubmitting ? "submitting" : ""
                  }`}
                  disabled={isSubmitting}
                  initial="rest"
                  whileHover={!isSubmitting ? "hover" : "rest"}
                  whileTap={!isSubmitting ? "tap" : "rest"}
                  variants={buttonHover}
                >
                  {isSubmitting ? (
                    <>
                      <span className="create-post-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Post
                      <motion.div
                        variants={iconAnimation}
                        className="create-post-button-icon-container"
                      >
                        <HiOutlineArrowRight className="create-post-button-icon" />
                      </motion.div>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}

export default CreatePost;