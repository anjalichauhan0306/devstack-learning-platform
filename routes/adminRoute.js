import express from "express";
import {  getAdminAnalytics, getEducators, updateUserAccess } from "../controller/adminController.js";
import isAdmin  from "../middleware/authRole.js";
import isAuth from "../middleware/isAuth.js";
const router = express.Router();

router.get(
  "/users",
  isAuth,         
  isAdmin,
  getEducators
);

router.get(
  "/analytics",
  isAuth,         
  isAdmin,
  getAdminAnalytics
);

router.patch("/user/:id",isAuth ,isAdmin , updateUserAccess);

export default router;