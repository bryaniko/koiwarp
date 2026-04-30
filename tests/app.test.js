import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createTaskStore } from "../backend/src/taskStore.js";
import { createApp } from "../backend/src/app.js";

async function testApp() {
  const dir = await mkdtemp(join(tmpdir(), "task-app-"));
  const file = join(dir, "tasks.json");
  await writeFile(file, "[]", "utf8");
  const store = createTaskStore(file);
  return createApp({ taskStore: store });
}

test("health endpoint returns ok", async () => {
  const app = await testApp();
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});

test("create and list tasks", async () => {
  const app = await testApp();
  const created = await request(app).post("/api/tasks").send({ title: "Test task", description: "abc" });
  assert.equal(created.status, 201);
  assert.equal(created.body.task.title, "Test task");

  const listed = await request(app).get("/api/tasks");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.tasks.length, 1);
});

test("updates completion status", async () => {
  const app = await testApp();
  const created = await request(app).post("/api/tasks").send({ title: "Finish docs" });
  const id = created.body.task.id;

  const updated = await request(app).put(`/api/tasks/${id}`).send({ completed: true });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.task.completed, true);
});

test("deletes task", async () => {
  const app = await testApp();
  const created = await request(app).post("/api/tasks").send({ title: "Disposable task" });
  const id = created.body.task.id;

  const deleted = await request(app).delete(`/api/tasks/${id}`);
  assert.equal(deleted.status, 204);

  const listed = await request(app).get("/api/tasks");
  assert.equal(listed.body.tasks.length, 0);
});
