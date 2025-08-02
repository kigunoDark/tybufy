const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

router.post("/", authenticateToken, createProject);
router.get("/", authenticateToken, getProjects);
router.put("/:id", authenticateToken, updateProject);
router.delete("/:id", authenticateToken, deleteProject);

module.exports = router;
