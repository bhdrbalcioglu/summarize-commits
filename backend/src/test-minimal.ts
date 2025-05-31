// Minimal test server to isolate the path-to-regexp issue
import express from "express";

const app = express();
const port = 3001;

app.get("/test", (req, res) => {
  res.json({ message: "Minimal server works!" });
});

app.listen(port, () => {
  console.log(`🧪 [TEST] Minimal server running on http://localhost:${port}`);
}); 