import User from "../models/userModel.js";
import Course from "../models/courseModel.js"


export const getusers = async (req, res) => {
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


export const getAdminCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("creator", "name")
      .sort({ createdAt: -1 })
    
    res.status(200).json(courses);

  } catch (error) {
    console.error("Error fetching admin courses:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAdminAnalytics = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "Student" });
    const totalEducators = await User.countDocuments({ role: "Educator" });
    const totalCourses = await Course.countDocuments();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const signupStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const chartData = signupStats.map(stat => ({
      name: new Date(stat._id).toLocaleDateString('en-US', { weekday: 'short' }),
      signups: stat.count
    }));

    const revenueData = await Course.aggregate([
      {
        $project: {
          enrollments: {
            $size: { $ifNull: ["$enrolledStudents", []] }
          },
          revenue: {
            $cond: [
              "$isPaid",
              {
                $multiply: [
                  { $size: { $ifNull: ["$enrolledStudents", []] } },
                  { $toDouble: "$Price" }
                ]
              },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$revenue" },
          totalEnrollments: { $sum: "$enrollments" }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalEnrollments = revenueData[0]?.totalEnrollments || 0;

    res.status(200).json({
      totalUsers,
      totalStudents,
      totalEducators,
      totalCourses,
      totalRevenue,
      totalEnrollments,
      chartData
    });

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export const updateUserAccess = async (req, res) => {
  try {

    if (req.user?.role !== "Admin") {
  return res.status(403).json({ message: "Unauthorized" });
}
if (typeof req.body.isActive !== "boolean") {
  return res.status(400).json({ message: "Invalid value" });
}
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