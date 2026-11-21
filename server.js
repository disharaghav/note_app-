const express = require("express");

const { connectToDatabase } = require("./db");
const { userRouter } = require("./routes/user.route");
const { auth } = require("./middlewere/auth.middlewere");

const app = express();
app.use(express.json());

app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("HOME Page");
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

app.listen(8080, async () => {
  await connectToDatabase();
  console.log("Server started");
});
