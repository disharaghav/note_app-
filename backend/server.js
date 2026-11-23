const express = require("express");
const path = require("path");

const { connectToDatabase } = require("./db");
const { userRouter } = require("./routes/user.route");
const { auth } = require("./middlewere/auth.middlewere");

const app = express();
app.use(express.json());
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
