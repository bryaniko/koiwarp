import express from "express";
import cors from "cors";
import { createTaskStore } from "./taskStore.js";
import { fileURLToPath } from "node:url";

function parseCompleted(raw) {
  if (raw === undefined) {
    return undefined;
  }
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  return null;
}

function validateCreatePayload(body) {
  if (!body || typeof body.title !== "string") {
    return "Field 'title' is required.";
  }
  const title = body.title.trim();
  if (title.length < 2 || title.length > 120) {
    return "Field 'title' must be between 2 and 120 characters.";
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    return "Field 'description' must be a string.";
  }
  return null;
}

function validateUpdatePayload(body) {
  if (!body || typeof body !== "object") {
    return "Request body is required.";
  }
  const allowed = ["title", "description", "completed"];
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return "At least one updatable field is required.";
  }
  if (!keys.every((k) => allowed.includes(k))) {
    return "Only 'title', 'description', and 'completed' can be updated.";
  }
  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return "Field 'title' must be a string.";
    }
    const title = body.title.trim();
    if (title.length < 2 || title.length > 120) {
      return "Field 'title' must be between 2 and 120 characters.";
    }
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    return "Field 'description' must be a string.";
  }
  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    return "Field 'completed' must be a boolean.";
  }
  return null;
}

export function createApp({ taskStore, staticDir } = {}) {
  const app = express();
  const defaultDataPath = fileURLToPath(new URL("../data/tasks.json", import.meta.url));
  const store = taskStore || createTaskStore(defaultDataPath);

  app.use(cors());
  app.use(express.json());

  if (staticDir) {
    app.use(express.static(staticDir));
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/tasks", async (req, res, next) => {
    try {
      const completed = parseCompleted(req.query.completed);
      if (completed === null) {
        return res.status(400).json({ error: "Query 'completed' must be 'true' or 'false'." });
      }
      const tasks = await store.getAll({ q: req.query.q || "", completed });
      res.json({ tasks });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks", async (req, res, next) => {
    try {
      const validationError = validateCreatePayload(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
      const task = await store.create({
        title: req.body.title.trim(),
        description: typeof req.body.description === "string" ? req.body.description.trim() : ""
      });
      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/tasks/:id", async (req, res, next) => {
    try {
      const validationError = validateUpdatePayload(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
      const patch = {};
      if (req.body.title !== undefined) {
        patch.title = req.body.title.trim();
      }
      if (req.body.description !== undefined) {
        patch.description = req.body.description.trim();
      }
      if (req.body.completed !== undefined) {
        patch.completed = req.body.completed;
      }
      const updated = await store.update(req.params.id, patch);
      if (!updated) {
        return res.status(404).json({ error: "Task not found." });
      }
      res.json({ task: updated });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/tasks/:id", async (req, res, next) => {
    try {
      const removed = await store.remove(req.params.id);
      if (!removed) {
        return res.status(404).json({ error: "Task not found." });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    res.status(500).json({
      error: "Internal server error.",
      details: error instanceof Error ? error.message : "Unknown error."
    });
  });

  return app;
}
