import express from "express";
import { generateQuiz,  getQuizByCourseId ,submitQuiz} from "../controller/quizController.js";
import isAuth  from "../middleware/isAuth.js";
const quizRouter = express.Router();


quizRouter.post("/generatequiz/:courseId", isAuth, generateQuiz);
quizRouter.get("/getquiz/:courseId", isAuth, getQuizByCourseId);
quizRouter.post("/submit", isAuth, submitQuiz);

export default quizRouter;
