import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function generateQuiz(courseName, quantity, difficulty) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate ${quantity} multiple-choice quiz questions with difficulty of ${difficulty} for the course "${courseName}".
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
        const result = response.response.candidates[0].content.parts[0].text;

        // Parse and validate JSON response
        try {
            const quizData = JSON.parse(result);

            if (!Array.isArray(quizData)) throw new Error("Quiz data must be an array");

            for (const question of quizData) {
                if (!question.question || !Array.isArray(question.options) || question.options.length !== 4 || !question.answer) {
                    throw new Error("Invalid question format");
                }

                if (!question.options.includes(question.answer)) {
                    throw new Error("Answer must be one of the options");
                }
            }

            return quizData;
        } catch (parseError) {
            console.error("❌ Failed to parse AI response:", parseError);
            return null;
        }
    } catch (error) {
        console.error("❌ Error generating quiz:", error);
        return null;
    }
}

// Controller function for quiz route
export const generateQuizHandler = async (req, res) => {
    try {
        const { courseName, quantity, difficulty } = req.body;

        if (!courseName || typeof courseName !== "string") {
            return res.status(400).json({ success: false, error: "Course name is required and must be a string" });
        }

        const quiz = await generateQuiz(courseName, quantity, difficulty);

        if (!quiz) {
            return res.status(500).json({ success: false, error: "Failed to generate quiz" });
        }

        return res.json({ success: true, data: quiz });
    } catch (error) {
        console.error("❌ Server error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
