const express = require("express");
const router = express.Router();
const Quiz = require("../models/quizes");

// List all quizzes
router.get("/", async (req, res) => {
  const quizes = await Quiz.find();
  res.render("quizes", { quizes });
});

// Show create quiz form
router.get("/create", (req, res) => {
  res.render("createQuiz");
});

// Save new quiz
router.post("/create", async (req, res) => {

  const questions = [];

  for (let i = 1; i <= 5; i++) {
    questions.push({
      question: req.body[`q${i}`],
      options: [
        req.body[`q${i}a`],
        req.body[`q${i}b`],
        req.body[`q${i}c`],
        req.body[`q${i}d`]
      ],
      correctAnswer: req.body[`q${i}Correct`]
    });
  }

  const quiz = new Quiz({
    title: req.body.title,
    description: req.body.description,
    questions: questions
  });

  await quiz.save();
  res.redirect("/quizes");
});

// Take a quiz
router.get("/take/:id", async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  res.render("takeQuiz", { quiz });
});

// Submit quiz answers
router.post("/take/:id", async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  let score = 0;
  const total = quiz.questions.length;
  const userAnswers = req.body;

  quiz.questions.forEach((q, i) => {
    if (userAnswers[`q${i}`] === q.correctAnswer) score++;
  });

  res.render("quizResult", { quiz, score, total });
});

// Delete quiz
router.get("/delete/:id", async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.redirect("/quizes");
});

module.exports = router;