import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Load environment variables

dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google AI
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
    console.error("Missing GOOGLE_API_KEY in environment variables");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function generateQuiz(courseName, quantity) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate ${quantity} multiple-choice quiz questions for the course "${courseName}".
            Each question should have 4 options and 1 correct answer. The questions should be 
            challenging but fair, testing understanding rather than memorization.
            
            Return the response in this exact JSON format:
            [
                {
                    "question": "What is the question text?",
                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                    "answer": "Option 1"
                }
            ]`;

        const response = await model.generateContent(prompt);
        const result = await response.response.text();

        // Validate and parse JSON response
        try {
            const quizData = JSON.parse(result);

            // Validate structure of quiz data
            if (!Array.isArray(quizData)) {
                throw new Error("Quiz data must be an array");
            }

            for (const question of quizData) {
                if (!question.question || !Array.isArray(question.options) ||
                    question.options.length !== 4 || !question.answer) {
                    throw new Error("Invalid question format");
                }

                if (!question.options.includes(question.answer)) {
                    throw new Error("Answer must be one of the options");
                }
            }

            return quizData;
        } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            return null;
        }
    } catch (error) {
        console.error("Error generating quiz:", error);
        return null;
    }
}

// Routes
app.post("/api/generate-quiz", async (req, res) => {
    try {
        const { courseName, quantity } = req.body;
        console.log(courseName);

        // Validate input
        if (!courseName || typeof courseName !== 'string') {
            return res.status(400).json({
                success: false,
                error: "Course name is required and must be a string"
            });
        }

        // Generate quiz
        const quiz = await generateQuiz(courseName, quantity);

        if (!quiz) {
            return res.status(500).json({
                success: false,
                error: "Failed to generate quiz"
            });
        }

        return res.json({
            success: true,
            data: quiz
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
