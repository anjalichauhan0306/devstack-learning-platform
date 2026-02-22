import express from "express";
import {
  createCourse,
  createLecture,
  editCourse,
  editLecture,
  getAllEnrolledStudents,
  getCourseById,
  getCourseLecture,
  getCreatorById,
  getCreatorCourses,
  getPublished,
  removeCourse,
  removeLecture,
} from "../controller/courseController.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { searchWithAi } from "../controller/searchAiController.js";
import { generateCertificate } from "../controller/certificateController.js";

const courseRouter = express.Router();

courseRouter.post("/create", isAuth, upload.single("thumbnail"), createCourse);
courseRouter.get("/getpublished", getPublished);
courseRouter.get("/getcreator", isAuth, getCreatorCourses);
courseRouter.post(
  "/editcourse/:courseId",
  isAuth,
  upload.single("thumbnail"),
  editCourse,
);

courseRouter.get("/getcourse/:courseId", isAuth, getCourseById);
courseRouter.delete("/delete/:courseId", isAuth, removeCourse);

// For Lecture

courseRouter.post("/createlecture/:courseId", isAuth, createLecture);
courseRouter.get("/courselecture/:courseId", isAuth, getCourseLecture);
courseRouter.post(
  "/editlecture/:courseId/:lectureId",
  isAuth,
  upload.single("videoUrl"),
  editLecture,
);
courseRouter.delete("/deletelecture/:lectureId", isAuth, removeLecture);
courseRouter.post("/creator", isAuth, getCreatorById);
courseRouter.get("/getcreator/:creatorId", getCreatorById);
courseRouter.get("/getenrolled", isAuth, getAllEnrolledStudents);

// For search
courseRouter.post("/search", searchWithAi);

// For certificate
courseRouter.post("/certificate/:courseId", isAuth,generateCertificate );

export default courseRouter;
