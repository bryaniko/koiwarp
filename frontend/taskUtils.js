export function normalizeTask(task) {
  return {
    id: String(task.id),
    title: String(task.title || "").trim(),
    description: String(task.description || "").trim(),
    completed: Boolean(task.completed)
  };
}

export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => a.completed - b.completed || a.title.localeCompare(b.title));
}
