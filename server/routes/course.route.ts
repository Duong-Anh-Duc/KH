// backend/routes/course.route.ts
import express from "express";
import multer from "multer";
import {
  addAnwser,
  addLessonToCourse,
  addQuestion,
  addReplyToReview,
  addReview,
  createCourse,
  deleteCourse,
  editCourse,
  filterCourses,
  generateVideoUrl,
  getAdminAllCourses,
  getAllCourses,
  getCategories,
  getCourseByUser,
  getSingleCourse,
} from "../controllers/course.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
const courseRouter = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

courseRouter.post("/create-course",isAutheticated,authorizeRoles("admin"),upload.fields([
    { name: "thumbnail", maxCount: 1 }, 
    { name: "demoVideo", maxCount: 1 }, 
    { name: "courseVideos", maxCount: 10 }, ]),
  createCourse
);

courseRouter.post(
  "/add-lesson",
  isAutheticated,
  authorizeRoles("admin"),
  upload.fields([
    { name: "videoFile", maxCount: 1 }, 
    { name: "thumbnailFile", maxCount: 1 },
  ]),
  addLessonToCourse
);

courseRouter.put("/edit-course/:id", isAutheticated, authorizeRoles("admin"),editCourse);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", getAllCourses);

courseRouter.get("/get-admin-courses",isAutheticated,authorizeRoles("admin"),getAdminAllCourses);

courseRouter.get("/get-course-content/:id", isAutheticated, getCourseByUser);

courseRouter.put("/add-question", isAutheticated, addQuestion);

courseRouter.put("/add-answer", isAutheticated, addAnwser);

courseRouter.put("/add-review/:id", isAutheticated, addReview);

courseRouter.put("/add-reply",isAutheticated,authorizeRoles("admin"),addReplyToReview);

courseRouter.post("/getVdoCipherOTP", generateVideoUrl);

courseRouter.delete("/delete-course/:id",isAutheticated,authorizeRoles("admin"),deleteCourse);

courseRouter.get("/get-categories", getCategories);

courseRouter.get("/filter-courses", filterCourses);

export default courseRouter;