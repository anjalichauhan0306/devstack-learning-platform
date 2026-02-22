import Stripe from "stripe";
import dotenv from "dotenv";
import Course from '../model/courseModel.js'
import User from "../model/userModel.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createStripeCheckout = async (req, res) => {
  try {
    const { courseId, userId } = req.body;

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
      success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/viewcourse/${courseId}`,
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
    console.log(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const freeEnrollCourse = async (req, res) => {
  try {
    // const { userId, courseId } = req.body;
    const { courseId, userId } = req.body;

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
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// import razorpay from 'razorpay';
// import dotenv from 'dotenv'
// import Course from '../model/courseModel.js'

// dotenv.config()
// const RazorpyInstance =  new razorpay({
//     key_id : process.env.RAZORPAY_KEY_ID ,
//     key_secret :process.env.RAZORPAY_SECREAT_KEY
// })

// export const RazorpayOrder = async (req,res) => {
//     try {
// const {courseId} = req.body
// const course = await Course.findById(courseId)

// if(!course){
//     return res.status(404).json({message : "Course iS not Found"})
// }

//         const options = {
//             amount : course.Price*100,
//             currency : 'INR',
//             receipt :  `${courseId}.toString()`
//         }

//         const order = await RazorpyInstance.orders.create(options)

//         return res.status(200).json(order)
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({message : `Failed to Create Razorpay Order ${error}`})
//     }
// }

// export const verifyPayment = async (req,res) => {
//     try {
//         const {courseId , userId , orderId} = req.body
//         const orderInfo = await RazorpyInstance.orders.fetch(razorpay_order_id)

//         if(orderInfo.status === 'paid'){
//             const user = await User.findById(userId)
//             if(!user){
//                 return res.status(404).json({message:"User Not Found"})
//             }
// if (!user.enrolledCourses.includes(courseId)) {
//   await user.enrolledCourses.push(courseId);
//   await user.save();
// }

// const course = await Course.findById(courseId).populate("lectures");

// if (!course.enrolledStudents.includes(userId)) {
//   await course.enrolledCourses.push(userId);
//   await course.save();
// }
//             }
//             return res.status(200).json({message:"payment verifed and enrollement successfully"})

//     } catch (error) {
//         return res.status(200).json({message:`payment verifed failed ${error}`})
//     }
// }