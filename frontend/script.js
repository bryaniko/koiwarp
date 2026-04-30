import { normalizeTask, sortTasks } from "./taskUtils.js";

const taskForm = document.querySelector("#taskForm");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const searchInput = document.querySelector("#search");
const filterStatus = document.querySelector("#filterStatus");
const refreshBtn = document.querySelector("#refreshBtn");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const template = document.querySelector("#taskItemTemplate");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed.");
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function taskItem(task) {
  const node = template.content.firstElementChild.cloneNode(true);
  const title = node.querySelector(".task-title");
  const description = node.querySelector(".task-description");
  const toggle = node.querySelector(".toggle-complete");
  const editBtn = node.querySelector(".edit-btn");
  const deleteBtn = node.querySelector(".delete-btn");

  title.textContent = task.title;
  description.textContent = task.description || "No description";
  toggle.checked = task.completed;

  if (task.completed) {
    node.classList.add("done");
  }

  toggle.addEventListener("change", async () => {
    await api(`/api/tasks/${task.id}`, {
      method: "PUT",
      body: JSON.stringify({ completed: toggle.checked })
    });
    await loadTasks();
  });

  editBtn.addEventListener("click", async () => {
    const nextTitle = prompt("Edit title", task.title);
    if (!nextTitle) {
      return;
    }
    const nextDesc = prompt("Edit description", task.description || "");
    await api(`/api/tasks/${task.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: nextTitle.trim(),
        description: (nextDesc || "").trim()
      })
    });
    await loadTasks();
  });

  deleteBtn.addEventListener("click", async () => {
    const confirmed = confirm("Delete this task?");
    if (!confirmed) {
      return;
    }
    await api(`/api/tasks/${task.id}`, { method: "DELETE" });
    await loadTasks();
  });

  return node;
}

async function loadTasks() {
  const query = new URLSearchParams();
  if (searchInput.value.trim()) {
    query.set("q", searchInput.value.trim());
  }
  if (filterStatus.value) {
    query.set("completed", filterStatus.value);
  }
  const qs = query.toString();
  const data = await api(`/api/tasks${qs ? `?${qs}` : ""}`);
  const tasks = sortTasks(data.tasks.map(normalizeTask));

  taskList.replaceChildren(...tasks.map(taskItem));
  emptyState.style.display = tasks.length === 0 ? "block" : "none";
}

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim()
    })
  });
  taskForm.reset();
  await loadTasks();
});

searchInput.addEventListener("input", () => {
  loadTasks().catch((error) => alert(error.message));
});

filterStatus.addEventListener("change", () => {
  loadTasks().catch((error) => alert(error.message));
});

refreshBtn.addEventListener("click", () => {
  loadTasks().catch((error) => alert(error.message));
});

loadTasks().catch((error) => {
  alert(`Could not load tasks: ${error.message}`);
});
