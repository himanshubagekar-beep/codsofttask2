// app.js - Full Correct Version

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const winston = require("./winston");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const compression = require("compression");
const chalk = require("chalk");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const quizRouter = require("./routes/quizRouter");
const config = require("./config");

const mongoose = require("mongoose");

const app = express();

// MongoDB URL
const DB = config.mongoUrl;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const con = await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(chalk.bgGreen.black(`MongoDB Connected: ${con.connection.host}`));
  } catch (error) {
    console.error(chalk.bgRed.black("MongoDB Connection Failed: "), error);
    process.exit(1);
  }
};

connectDB();

// Enable trust proxy (for rate limiting behind proxies)
app.enable("trust proxy");

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Security middlewares
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(cors());
app.options("*", cors());
app.use(compression());

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Logger
app.use(morgan("combined", { stream: winston.stream }));

// Cookie parser
app.use(cookieParser("12345-67890"));

// Rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, try again later.",
});
app.use("/", limiter);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/quizes", quizRouter);

// Optional: redirect unknown pages to homepage (prevents unnecessary 404)
app.get("*", (req, res, next) => {
  res.redirect("/");
});

// Catch 404 (if any route still fails)
app.use(function (req, res, next) {
  next(createError(404, "Page Not Found"));
});

// Global error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Log the error
  winston.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`
  );

  // Render error page
  res.status(err.status || 500);
  res.render("error", { title: "Error" });
});

module.exports = app;