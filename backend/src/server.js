import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createTaskStore } from "./taskStore.js";
import { createApp } from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..", "..");
const staticDir = join(rootDir, "frontend");
const dataPath = join(__dirname, "..", "data", "tasks.json");
const store = createTaskStore(dataPath);
const app = createApp({ taskStore: store, staticDir });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
