import Courses from "../model/courseModel.js";
import uploadOnCloudinary from "../config/cloudnary.js";
import Lecture from "../model/lectureModel.js";
import User from "../model/userModel.js";

export const createCourse = async (req, res) => {
  try {
    const { title, category, description, subTitle, level } = req.body;

    if (!req.body) {
      return res.status(400).json({ message: "Request body missing" });
    }

    if (!title || !category || !description || !subTitle || !level) {
      return res.status(400).json({ message: "All Fields are required" });
    }

    let thumbnailUrl = "";

    if (req.file) {
      thumbnailUrl = await uploadOnCloudinary(req.file.path);
    }

    const course = await Courses.create({
      title,
      category,
      description,
      subTitle,
      level,
      thumbnail: thumbnailUrl,
      creator: req.userId,
    });

    return res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPublished = async (req, res) => {
  try {
    const courses = await Courses.find({ isPublished: true }).populate(
      "lectures reviews quizzes creator",
    );

    if (!courses) {
      return res.status(404).json({ message: "Courses Not Found" });
    }
    return res.status(200).json(courses);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Failed To find isPublished Courses : ${error}` });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.userId;
    const courses = await Courses.find({ creator: userId })
      .populate("lectures reviews quizzes")
      .populate({
        path: "enrolledStudents",
        select: "name email",
      });

    if (!courses) {
      return res.status(400).json({ message: "Courses Not Found" });
    }
    return res.status(201).json(courses);
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Failed To Get  creator Courses : ${error}` });
  }
};

export const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      subTitle,
      description,
      category,
      level,
      isPublished,
      isPaid,
      quizzes,
      certificate,
      Price,
    } = req.body;

    let thumbnail;

    if (req.file) {
      thumbnail = await uploadOnCloudinary(req.file.path);
    }

    let course = await Courses.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Courses is Not Found" });
    }

    const updateData = {
      title,
      subTitle,
      description,
      isPaid,
      category,
      level,
      isPublished,
      Price,
    };

    if (thumbnail) {
      updateData.thumbnail = thumbnail;
    }

    course = await Courses.findByIdAndUpdate(courseId, updateData, {
      new: true,
    });

    return res.status(201).json(course);
  } catch (error) {
    if (!Courses) {
      return res.status(500).json(error.message);
    }
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    let course = await Courses.findById(courseId).populate(
      "lectures reviews quizzes",
    );

    if (!course) {
      return res.status(400).json({ message: "Courses is Not Found" });
    }
    return res.status(200).json(course);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to Get Course by Id ${error.message}` });
  }
};

export const removeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    let course = await Courses.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Courses is Not Found" });
    }

    course = await Courses.findByIdAndDelete(courseId);
    return res.status(200).json({ message: "Course Deleted Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to Delete Course : ${error.message}` });
  }
};

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        message: "Lecture Title and Course ID are required",
      });
    }

    const course = await Courses.findById(courseId);
    const lecture = await Lecture.create({ lectureTitle });

    if (!course) {
      return res.status(404).json({ message: "Course Not Found" });
    }

    if (course) {
      course.lectures.push(lecture._id);
    }

    await course.populate("lectures");
    await course.save();

    const updatedCourse = await Courses.findById(courseId).populate("lectures");

    return res.status(201).json({
      lecture,
      course: updatedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Failed to create lecture: ${error.message}`,
    });
  }
};

export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Courses.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Course Id Not Found !" });
    }

    await course.populate("lectures");
    await course.save();
    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({
      message: `failed to get Course lecture By ID: ${error.message}`,
    });
  }
};

export const editLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { isPreviewFree, lectureTitle, description } = req.body;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(400).json({ message: "Lecture Not Found !" });
    }

    let videoUrl;
    if (req.file) {
      videoUrl = await uploadOnCloudinary(req.file.path);
      lecture.videoUrl = videoUrl;
    }
    if (lectureTitle) {
      lecture.lectureTitle = lectureTitle;
    }

    if (description) {
      lecture.description = description;
    }

    lecture.isPreviewFree = isPreviewFree;
    await lecture.save();

    return res.status(200).json(lecture);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to Edit Course lecture : ${error.message}` });
  }
};

export const removeLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res.status(400).json({ message: "Lecture Not Found !" });
    }

    await Courses.updateOne(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } },
    );
    return res.status(200).json({
      message: "Lecture Removed!",
    });
  } catch (error) {
    return res.status(400).json({ message: `try again ${error} !` });
  }
};

export const getCreatorById = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(400).json({ message: "User Not Found !" });
    }

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Failed to get Creator ${error}` });
  }
};

export const getAllEnrolledStudents = async (req, res) => {
  try {
    const educatorId = req.userId;

    const courses = await Courses.find({ creator: educatorId }).populate({
      path: "enrolledStudents",
      select: "name email photoUrl lastLogin createdAt",
    });

    const studentMap = new Map();

    for (const course of courses) {
      const price = Number(course.Price) || 0;
      
      for (const student of course.enrolledStudents) {
        const id = student._id.toString();

        if (!studentMap.has(id)) {
          studentMap.set(id, {
            user: {
              _id: student._id,
              name: student.name,
              email: student.email,
              photo: student.photoUrl,
            },
            totalSpend: price, // first course price
            courseCount: 1,
            enrolledCourses: [course.title],
            enrolledAt: student.createdAt,
            lastLogin: student.lastLogin || null,
            progress: 0, 
            rating: 0,
          });
        } else {
          const existing = studentMap.get(id);

          existing.courseCount += 1;
          existing.enrolledCourses.push(course.title);

          if (course.isPaid) {
            existing.totalSpend += price;
          }
        }
      }
    }

    res.status(200).json(Array.from(studentMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


