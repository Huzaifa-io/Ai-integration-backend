import express from "express";
import { generateQuizHandler } from "../Controllers/quizController.js";

const router = express.Router();

// Route to generate a quiz
router.post("/generate-quiz", generateQuizHandler);

export default router;
