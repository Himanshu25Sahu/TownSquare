import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { postRouter } from "./routes/postRouter.js";
import { userRouter } from "./routes/userRouter.js";
import { emergencyRouter } from "./routes/emergencyRouter.js";
import { error } from "./middlewares/error.js";
import session from 'express-session';
import { MessageRouter } from "./routes/messageRouter.js";

export const app = express();
dotenv.config()

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
// app.use(Error)
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // allow requests from your frontend
    credentials: true, // if you're using cookies or HTTP authentication
  })
);
const isProduction = process.env.NODE_ENV === "production";
// console.log("#############################",isProduction);
// Add this temporary middleware before your routes
// app.use((req, res, next) => {
//   console.log('Incoming cookies:', req.cookies);
//   console.log('Incoming headers:', req.headers);
//   next();
// });
app.use(session({
  secret: process.env.SESSION_SECRET, // move to .env ideally
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProduction,       // send cookie only over HTTPS in production
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax", // support cross-origin cookie if needed
  },
}));
app.set("trust proxy", 1);

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.get("/health", (req, res) => {
  res.send("Server is up and running!");
});
app.use("/user", userRouter);
app.use('/post',postRouter);
app.use("/emergency",emergencyRouter);
app.use('/message',MessageRouter)
app.use(error);