import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";

export function createTaskStore(filePath) {
  async function ensureFile() {
    const folder = dirname(filePath);
    await mkdir(folder, { recursive: true });
    try {
      await readFile(filePath, "utf8");
    } catch {
      await writeFile(filePath, "[]", "utf8");
    }
  }

  async function readTasks() {
    await ensureFile();
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Stored task data is invalid.");
    }
    return parsed;
  }

  async function writeTasks(tasks) {
    await writeFile(filePath, JSON.stringify(tasks, null, 2), "utf8");
  }

  return {
    async getAll(filters = {}) {
      const tasks = await readTasks();
      const query = (filters.q || "").toLowerCase();
      const completedFilter = filters.completed;

      return tasks.filter((task) => {
        const matchesQuery =
          query.length === 0 ||
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query);
        const matchesCompleted =
          completedFilter === undefined || task.completed === completedFilter;
        return matchesQuery && matchesCompleted;
      });
    },

    async create({ title, description = "" }) {
      const tasks = await readTasks();
      const now = new Date().toISOString();
      const task = {
        id: crypto.randomUUID(),
        title,
        description,
        completed: false,
        createdAt: now,
        updatedAt: now
      };
      tasks.push(task);
      await writeTasks(tasks);
      return task;
    },

    async update(id, patch) {
      const tasks = await readTasks();
      const index = tasks.findIndex((task) => task.id === id);
      if (index === -1) {
        return null;
      }
      const updated = {
        ...tasks[index],
        ...patch,
        updatedAt: new Date().toISOString()
      };
      tasks[index] = updated;
      await writeTasks(tasks);
      return updated;
    },

    async remove(id) {
      const tasks = await readTasks();
      const remaining = tasks.filter((task) => task.id !== id);
      if (remaining.length === tasks.length) {
        return false;
      }
      await writeTasks(remaining);
      return true;
    }
  };
}
