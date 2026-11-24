const express = require("express");
const path = require("path");

const { connectToDatabase } = require("./db");
const { userRouter } = require("./routes/user.route");
const { auth } = require("./middlewere/auth.middlewere");

const app = express();
app.use(express.json());

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");
const allowedOrigins = new Set([
  "https://dex-lime-eight.vercel.app",
  "http://localhost:5173",
  ...(process.env.FRONTEND_ORIGIN || "").split(",").map(normalizeOrigin).filter(Boolean),
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const frontendBuildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendBuildPath));

app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"), (error) => {
    if (error) res.send("HOME Page");
  });
});

app.get("/dashboard", auth, (req, res) => {
  res.send({
    msg: `Private Route: Welcome ${req.user?.name || "User"}`,
    user: {
      id: req.user?.userId,
      name: req.user?.name,
      email: req.user?.email,
    },
  });
});

const port = process.env.PORT || 8080;

app.listen(port, async () => {
  await connectToDatabase();
  console.log("Server started");
});
