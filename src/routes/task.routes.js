// src/routes/task.routes.js
import {
  createTask,
  updateTask,
  getTasks,
  getUserTasks,
  deleteTask,
} from "../controllers/task.controller.js";

export default async function taskRoutes(app) {
  app.post("/tasks", createTask);
  app.put("/tasks/:id", updateTask);
  app.get("/tasks", getTasks);
  app.get("/tasks/user", getUserTasks);
  app.delete("/tasks/:id", deleteTask);
}
