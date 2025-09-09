import { Router } from "express";
import { pool } from "../config/db";
const router = Router();

router.get("/users", async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ error });
  }
});

export { router };
