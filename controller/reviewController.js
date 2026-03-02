import Courses from "../model/courseModel.js";
import Review from "../model/reviewModel.js";

export const createReview = async (req, res) => {
  try {
    const { rating, comment, courseId } = req.body;
    const userId = req.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    

  

    const course = await Courses.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course is Not found" });
    }
const isEnrolled = course.enrolledStudents.some(
      (id) => id.toString() === userId.toString()
    );
  if (!isEnrolled) {
      return res.status(403).json({ message: "Enroll first to review" });
    }
    const alreadyReviewed = await Review.findOne({
      course: courseId,
      user: userId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: "You have already reviewed " });
    }

    const review = new Review({
      course: courseId,
      user: userId,
      rating,
      comment,
    });

    course.reviews.push(review._id);
    await review.save();
    await course.save();

    return res.status(200).json(review);
  } catch (error) {
     return res.status(500).json({ message: "please try again ! " });
  }
};

export const getReviews = async (req, res) => {
  try {
    const review = await Review.find({})
      .populate("user", "name photoUrl description")
      .sort({ reviewedAt: -1 });

    return res.status(200).json(review);
  } catch (error) {
     return res.status(500).json({ message: "please try again ! " });
  }
};
