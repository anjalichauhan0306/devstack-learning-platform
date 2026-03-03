import User from "../model/userModel.js";
import Course from "../model/courseModel.js"


export const getEducators = async (req, res) => {
  try {
    const educators = await User.aggregate([
      {
        $match: { role: { $in: ["Educator", "Student"] } }
      },
      {
        $lookup: {
          from: "courses", 
          localField: "_id",
          foreignField: "creator",
          as: "createdCourses"
        }
      },
      {
        $addFields: {
          totalCourses: { $size: "$createdCourses" },

          totalStudents: {
            $sum: {
              $map: {
                input: "$createdCourses",
                as: "course",
                in: {
                  $size: {
                    $ifNull: ["$$course.enrolledStudents", []]
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          password: 0,
          createdCourses: 0
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.json(educators);

  } catch (error) {
    console.error("Error fetching educators:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "Student" });
    const totalEducators = await User.countDocuments({ role: "Educator" });
    const totalCourses = await Course.countDocuments();

    const revenueData = await Course.aggregate([
      {
        $project: {
          studentCount: { $size: { $ifNull: ["$enrolledStudents", []] } },
          price: { $ifNull: ["$Price", 0] }
        }
      },
      {
        $project: {
          revenue: { $multiply: ["$studentCount", "$price"] },
          studentCount: 1
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$revenue" },
          totalEnrollments: { $sum: "$studentCount" }
        }
      }
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalEducators,
      totalCourses,
      totalRevenue: revenueData[0]?.totalRevenue || 0,
      totalEnrollments: revenueData[0]?.totalEnrollments || 0,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


export const updateUserAccess = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};