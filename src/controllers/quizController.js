import { Quiz } from "../models/quizModel.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Courses from "../models/courseModel.js";
import User from "../models/userModel.js";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateQuiz = async (req, res) => {
  let newQuiz;

  try {
    const { courseId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!courseId)
      return res.status(400).json({ message: "Course ID missing" });

    const course =
      await Courses.findById(courseId).populate("lectures quizzes");

    if (!course) return res.status(404).json({ message: "Course not found" });

    const existQuiz = await Quiz.findOne({
      userId,
      courseId,
    }).lean();
    if (existQuiz && existQuiz.questions?.length > 0) {
      return res.status(400).json({ message: "Quiz already generated" });
    }

    newQuiz = await Quiz.create({ userId, courseId, questions: [] });
    const prompt = `Generate 10 technical multiple choice questions for the course titled:
                    genearate the questions based on the course title and the lecture titles of the course.  The questions should be in English. Each question should have 4 options and only 1 correct answer. Also provide a brief explanation for the correct answer. Format the response in JSON as shown below: "${course.title}" quiz have must be hard level and should test the in depth understanding of the course content. Return ONLY valid JSON in this format:

                    {
                      "questions": [
                        {
                          "question": "String",
                          "options": ["String","String","String","String"],
                          "correctAnswer": "String",
                          "explanation": "String"
                        }
                      ]
                    }  
                    No extra text.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = result.text || "";
    const cleanText = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (err) {
      console.error("JSON Parse Error:", err, "AI Response:", cleanText);
      await Quiz.findByIdAndDelete(newQuiz._id);
      return res.status(500).json({ message: "AI returned invalid JSON" });
    }

    const generatedQuestions = parsed.questions || [];
    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      await Quiz.findByIdAndDelete(newQuiz._id);
      return res.status(500).json({ message: "No questions generated" });
    }

    newQuiz.questions = generatedQuestions;
    await newQuiz.save();

    if (!course.quizzes) {
      course.quizzes = [];
    }

    course.quizzes.push(newQuiz._id);
    await course.save();

    return res
      .status(201)
      .json({ message: "Final course quiz generated", quiz: newQuiz });
  } catch (error) {
    if (newQuiz) await Quiz.findByIdAndDelete(newQuiz._id);
    return res
      .status(500)
      .json({ message: `Quiz generation failed: ${error.message}` });
  }
};

export const getQuizByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!courseId) {
      return res.status(400).json({ message: "Course ID missing" });
    }

    const quiz = await Quiz.findOne({ courseId }).populate("questions");

    if (!quiz) {
      return res
        .status(404)
        .json({ message: `Quiz not found for this course ${courseId}` });
    }

    const user = await User.findById(req.userId);
    if (user.role === "Educator") {
      return res.status(200).json({ quiz });
    }

    quiz.attempts = quiz.attempts.filter(
      (a) => a.userId.toString() === req.userId,
    );

    return res.status(200).json({ quiz });
  } catch (error) {
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.userId;
    const MAX_ATTEMPTS = 5;

    if (!quizId || !answers)
      return res.status(400).json({ message: "Missing data" });

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const userAttempts = quiz.attempts.filter(
      (a) => a.userId.toString() === userId.toString(),
    );

    if (userAttempts.length >= MAX_ATTEMPTS) {
      const lastAttempt = userAttempts[userAttempts.length - 1];
      const now = new Date();
      const lastDate = new Date(lastAttempt.date);
      const diffHours = (now - lastDate) / (1000 * 60 * 60);

      if (diffHours < 24) {
        return res.status(400).json({
          message:
            "Maximum attempts reached for today. Please try again after 24 hours.",
        });
      }
    }
    let score = 0;
    const total = quiz.questions.length;

    answers.forEach((a) => {
      const qIndex = a.questionIndex;
      const selected = a.selectedAnswer;

      if (
        quiz.questions[qIndex] &&
        quiz.questions[qIndex].options[selected] !== undefined
      ) {
        if (
          quiz.questions[qIndex].correctAnswer ===
          quiz.questions[qIndex].options[selected]
        ) {
          score++;
        }
      }
    });

    const percentage = Math.round((score / total) * 100);

    const newAttempt = {
      score,
      total,
      date: new Date(),
      userId: userId,
    };

    quiz.attempts.push(newAttempt);
    await quiz.save();

    const updatedUserAttempts = quiz.attempts.filter(
      (a) => a.userId.toString() === userId.toString(),
    );

    return res.status(200).json({
      message: "Quiz submitted successfully",
      score,
      total,
      percentage,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - updatedUserAttempts.length),
      quiz,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Submission failed: ${error.message}` });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questions } = req.body;
    const userId = req.userId;

    if (!quizId || !questions) {
      return res.status(400).json({ message: "Missing data" });
    }

    const quiz = await Quiz.findOne({
      _id: quizId,
      userId,
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    await Quiz.findByIdAndUpdate(
      quizId,
      { questions: questions },
      { new: true },
    );

    return res.status(200).json({
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Update failed: ${error.message}`,
    });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    const quiz = await Quiz.findOneAndDelete({
      _id: quizId,
      userId,
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    return res.status(200).json({
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: `Delete failed: ${error.message}`,
    });
  }
};
