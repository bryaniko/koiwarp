import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTask, sortTasks } from "../frontend/taskUtils.js";

test("normalizeTask sanitizes values", () => {
  const normalized = normalizeTask({
    id: 1,
    title: "  Task A ",
    description: 42,
    completed: 1
  });
  assert.deepEqual(normalized, {
    id: "1",
    title: "Task A",
    description: "42",
    completed: true
  });
});

test("sortTasks puts active tasks first", () => {
  const sorted = sortTasks([
    { id: "2", title: "Bravo", completed: true },
    { id: "1", title: "Alpha", completed: false },
    { id: "3", title: "Charlie", completed: false }
  ]);
  assert.deepEqual(
    sorted.map((task) => task.id),
    ["1", "3", "2"]
  );
});
