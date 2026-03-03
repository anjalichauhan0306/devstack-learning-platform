import express from "express";
import { deleteQuiz, generateQuiz,  getQuizByCourseId ,submitQuiz, updateQuiz} from "../controllers/quizController.js";
import isAuth  from "../middlewares/isAuth.js";

const quizRouter = express.Router();

quizRouter.post("/generatequiz/:courseId", isAuth, generateQuiz);
quizRouter.get("/getquiz/:courseId", isAuth, getQuizByCourseId);
quizRouter.post("/submit", isAuth, submitQuiz);
quizRouter.post("/updatequiz/:quizId", isAuth, updateQuiz);
quizRouter.delete("/deletequiz/:quizId", isAuth, deleteQuiz);

export default quizRouter;
