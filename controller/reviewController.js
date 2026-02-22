import Course from "../model/courseModel.js";
import Review from "../model/reviewModel.js";

export const createReview = async (req, res) => {
  try {
    const { rating, comment, courseId } = req.body;
    const userId = req.userId;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course is Not found" });
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

    await course.reviews.push(review._id)
    course.save()

    return res.status(200).json(review);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "please try again ! " });
  }
};

export const getReviews = async (req, res) => {
  try {
    const review = await Review.find({})
      .populate("user","name photoUrl description")
      .sort({ reviewedAt: -1 });

    return res.status(200).json(review);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "please try again ! " });
  }
};
