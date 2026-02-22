import { Quiz } from "../model/quizModel.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Course from "../model/courseModel.js";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* ======================================
   GENERATE QUIZ (AI)
====================================== */
export const generateQuiz = async (req, res) => {
  let newQuiz;

  try {
    const { courseId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!courseId)
      return res.status(400).json({ message: "Course ID missing" });

    const course = await Course.findById(courseId).populate("lectures quizzes");

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Prevent duplicate quiz
    const existQuiz = await Quiz.findOne({ userId, courseId });
    if (existQuiz && existQuiz.questions?.length > 0) {
      return res.status(400).json({ message: "Quiz already generated" });
    }

    newQuiz = await Quiz.create({ userId, courseId, questions: [] });
    const prompt = `
Generate 10 technical multiple choice questions for the course titled:
genearate the questions based on the course title and the lecture titles of the course.  The questions should be in English. Each question should have 4 options and only 1 correct answer. Also provide a brief explanation for the correct answer. Format the response in JSON as shown below: "${course.title}"

quiz have must be hard level and should test the in depth understanding of the course content. 

Return ONLY valid JSON in this format:

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

No extra text.
`;

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

    console.error("Generate Quiz Error:", error);
    if (newQuiz) await Quiz.findByIdAndDelete(newQuiz._id);
    return res
      .status(500)
      .json({ message: `Quiz generation failed: ${error.message}` });

  }
};

// GET Quiz by Course ID
export const getQuizByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!courseId) {
      return res.status(400).json({ message: "Course ID missing" });
    }

    // Find the quiz for this course
    const quiz = await Quiz.findOne({ courseId }).populate("questions");

    if (!quiz) {
      return res.status(404).json({ message: `Quiz not found for this course ${courseId}`});
    }
    
    quiz.attempts = quiz.attempts.filter(a => a.userId.toString() === req.userId);

    return res.status(200).json({ quiz });
  } catch (error) {
    console.error("Get Quiz Error:", error);
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

/* ======================================
   SUBMIT QUIZ
====================================== */
export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const MAX_ATTEMPTS = 5;
    if (!quizId || !answers) 
      return res.status(400).json({ message: "Missing data" });

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    const total = quiz.questions.length;

    // Calculate score correctly
    answers.forEach(a => {
      const qIndex = a.questionIndex;
      const selected = a.selectedAnswer;

      if (quiz.questions[qIndex].correctAnswer === quiz.questions[qIndex].options[selected]) {
        score++;
      }
    });

    if (quiz.attempts.length >= 5) {
  const lastAttempt = quiz.attempts[quiz.attempts.length - 1];

  const now = new Date();
  const lastDate = new Date(lastAttempt.date);

  const diffHours = (now - lastDate) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return res.status(400).json({
      message:
        "Maximum attempts reached. Please revise the course and try again after 24 hours.",
    });
  } else {
    // 🔥 RESET attempts after 24h
    quiz.attempts = [];
  }
}

    quiz.attempts = quiz.attempts || [];
    quiz.attempts.push({ score, total, date: new Date()  , userId: req.userId });
    await quiz.save();

    
    const percentage = Math.round((score / total) * 100);


    return res.status(200).json({
      message: "Quiz submitted successfully",
      score,
      total,
      percentage,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - quiz.attempts.length), 
      quiz,
    });

  } catch (error) {
    
    console.error("Submit Quiz Error:", error);
    return res.status(500).json({ message: `Submission failed: ${error.message}` });
  }
};


