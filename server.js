import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/Utils/Db.js";
import quizRoutes from "./src/Routes/quizRoutes.js"
dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/quiz", quizRoutes);


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
