import Stripe from "stripe";
import dotenv from "dotenv";
import Course from "../models/courseModel.js";
import User from "../models/userModel.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createStripeCheckout = async (req, res) => {
  try {
    const { courseId} = req.body;
    const userId = req.userId; 
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: course.title,
            },
            unit_amount: course.Price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        courseId: courseId.toString(),
        userId: userId.toString(),
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/viewcourse/${courseId}`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({
      message: "Stripe Checkout failed",
      error: error.message,
    });
  }
};
export const verifyCheckout = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const { courseId, userId } = session.metadata;

      const user = await User.findById(userId);
      const course = await Course.findById(courseId);

      if (!user.enrolledCourses) {
        user.enrolledCourses = [];
      }

      if (!user.enrolledCourses.includes(courseId)) {
        user.enrolledCourses.push(courseId);
        await user.save();
      }

      if (!course.enrolledStudents.includes(userId)) {
        course.enrolledStudents.push(userId);
        await course.save();
      }

      return res.status(200).json({ message: "Enrollment successful" });
    }

    res.status(400).json({ message: "Payment not completed" });
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};

export const freeEnrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId).populate("lectures");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.isPaid) {
      return res.status(400).json({ message: "This course is paid" });
    }

    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }

    if (!course.enrolledStudents.includes(userId)) {
      course.enrolledStudents.push(userId);
      await course.save();
    }

    res.status(200).json({ message: "Enrolled Successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
