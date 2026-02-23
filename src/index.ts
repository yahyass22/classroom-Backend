import express from "express";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Welcome to the Classroom API!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
