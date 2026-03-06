import express from "express";
import {
	createUser,
	loginUser,
	verifyUser,
	requestPasswordReset,
	resetPassword,
	logoutUser,
	deleteUser,
	logUserActivity,
	getUserActivities,
} from "../controllers/Users/index.js";

const router = express.Router();

router.post("/users", createUser);
router.post("/users/login", loginUser);
router.post("/users/verify", verifyUser);
router.post("/users/request-password-reset", requestPasswordReset);
router.post("/users/reset-password", resetPassword);
router.delete("/users/logout/:id", logoutUser);
router.delete("/users/:id", deleteUser);
router.post("/users/activity", logUserActivity);
router.get("/users/activity/:userId", getUserActivities);

export default router;
