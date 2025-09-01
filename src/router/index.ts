import { Router } from "express";
import { TestControllerClass } from "../controllers/test-controller";
import { pool } from "../config/db";
const router = Router();

router.get("/test", TestControllerClass.testMethod);

router.get("/users", async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ error });
  }
});

export { router };
