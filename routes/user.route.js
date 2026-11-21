const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { memoryUsers, dbReady } = require("../db");
const { userModel } = require("../model/user.model");
const { noteModel } = require("../model/note.model");
const { auth } = require("../middlewere/auth.middlewere");

const userRouter = express.Router();

const findStoredUser = async (email) => {
  const inMemoryUser = memoryUsers.find((user) => user.email === email);
  if (inMemoryUser) return inMemoryUser;

  if (!dbReady) return null;

  return await userModel.findOne({ email });
};

const getUserNotesStore = () => {
  if (!global.notesStore) {
    global.notesStore = [];
  }

  return global.notesStore;
};

userRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await findStoredUser(email);
    if (existing) {
      return res.send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 5);
    const newUser = { _id: Date.now().toString(), name, email, password: hashedPassword };
    memoryUsers.push(newUser);

    if (dbReady) {
      try {
        await new userModel({ name, email, password: hashedPassword }).save();
      } catch (dbError) {
        console.log("DB save skipped in fallback mode");
      }
    }

    return res.send("User Registered successfully");
  } catch (error) {
    return res.status(400).send("Can't Registered successfully");
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findStoredUser(email);
    if (!user) {
      return res.send("User is not Registered");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send("Wrong Password");
    }

    const token = jwt.sign({ userId: user._id, name: user.name, email: user.email }, "coding");
    return res.send({ msg: "Login Successfully", token });
  } catch (error) {
    return res.send("User is not Registered");
  }
});

userRouter.get("/notes", auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { filter = "inbox" } = req.query;

    if (!userId) {
      return res.status(401).send({ msg: "Login First" });
    }

    const validFilters = ["inbox", "favorites", "private", "archive", "trash"];
    const selectedFilter = validFilters.includes(filter) ? filter : "inbox";

    if (dbReady) {
      const conditions = { userId };
      if (selectedFilter === "favorites") {
        conditions.isFavorite = true;
        conditions.isPrivate = false;
      }
      if (selectedFilter === "private") {
        conditions.isPrivate = true;
      }
      if (selectedFilter === "archive") {
        conditions.status = "archive";
        conditions.isPrivate = false;
      }
      if (selectedFilter === "trash") {
        conditions.status = "trash";
        conditions.isPrivate = false;
      }
      if (selectedFilter === "inbox") {
        conditions.status = { $ne: "trash" };
        conditions.isPrivate = false;
      }

      const notes = await noteModel.find(conditions).sort({ isPinned: -1, isFavorite: -1, updatedAt: -1 });
      return res.send(notes);
    }

    const notes = getUserNotesStore()
      .filter((note) => note.userId === userId)
      .filter((note) => {
        if (selectedFilter === "favorites") return note.isFavorite && !note.isPrivate;
        if (selectedFilter === "private") return note.isPrivate;
        if (selectedFilter === "archive") return note.status === "archive" && !note.isPrivate;
        if (selectedFilter === "trash") return note.status === "trash" && !note.isPrivate;
        return note.status !== "trash" && !note.isPrivate;
      })
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || Number(b.isFavorite) - Number(a.isFavorite) || new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.send(notes);
  } catch (error) {
    return res.status(500).send({ msg: "Unable to load notes" });
  }
});

userRouter.post("/notes", auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { title, content, color, category, isPinned, isFavorite, isPrivate, privatePassword, status } = req.body;

    if (!userId) {
      return res.status(401).send({ msg: "Login First" });
    }

    const payload = {
      userId,
      title: title?.trim() || "Untitled note",
      content: content || "",
      color: color || "#f3f0ff",
      category: category?.trim() || "General",
      isPinned: Boolean(isPinned),
      isFavorite: Boolean(isFavorite),
      isPrivate: Boolean(isPrivate),
      privatePassword: isPrivate ? (privatePassword || "") : "",
      status: ["inbox", "archive", "trash"].includes(status) ? status : "inbox",
      updatedAt: new Date().toISOString(),
    };

    if (dbReady) {
      const note = await noteModel.create(payload);
      return res.status(201).send(note);
    }

    const newNote = { _id: Date.now().toString(), ...payload };
    getUserNotesStore().push(newNote);
    return res.status(201).send(newNote);
  } catch (error) {
    return res.status(500).send({ msg: "Unable to save note" });
  }
});

userRouter.put("/notes/:id", auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const incoming = req.body;

    if (!userId) {
      return res.status(401).send({ msg: "Login First" });
    }

    const existingNote = dbReady
      ? await noteModel.findOne({ _id: id, userId })
      : getUserNotesStore().find((note) => note._id.toString() === id && note.userId === userId);

    if (!existingNote) {
      return res.status(404).send({ msg: "Note not found" });
    }

    const updatedData = {
      ...existingNote.toObject ? existingNote.toObject() : existingNote,
      ...incoming,
      title: incoming.title !== undefined ? (incoming.title?.trim() || "Untitled note") : (existingNote.title || "Untitled note"),
      content: incoming.content !== undefined ? (incoming.content || "") : (existingNote.content || ""),
      color: incoming.color || existingNote.color || "#f3f0ff",
      category: incoming.category !== undefined ? (incoming.category?.trim() || "General") : (existingNote.category || "General"),
      isPinned: incoming.isPinned !== undefined ? Boolean(incoming.isPinned) : Boolean(existingNote.isPinned),
      isFavorite: incoming.isFavorite !== undefined ? Boolean(incoming.isFavorite) : Boolean(existingNote.isFavorite),
      isPrivate: incoming.isPrivate !== undefined ? Boolean(incoming.isPrivate) : Boolean(existingNote.isPrivate),
      privatePassword: incoming.isPrivate !== undefined
        ? (incoming.isPrivate ? (incoming.privatePassword || "") : "")
        : (existingNote.isPrivate ? (existingNote.privatePassword || "") : ""),
      status: ["inbox", "archive", "trash"].includes(incoming.status) ? incoming.status : (existingNote.status || "inbox"),
      updatedAt: new Date().toISOString(),
    };

    if (dbReady) {
      const note = await noteModel.findOneAndUpdate(
        { _id: id, userId },
        { $set: updatedData },
        { new: true }
      );

      if (!note) {
        return res.status(404).send({ msg: "Note not found" });
      }

      return res.send(note);
    }

    const notes = getUserNotesStore();
    const index = notes.findIndex((note) => note._id.toString() === id && note.userId === userId);

    if (index === -1) {
      return res.status(404).send({ msg: "Note not found" });
    }

    notes[index] = { ...notes[index], ...updatedData };
    return res.send(notes[index]);
  } catch (error) {
    return res.status(500).send({ msg: "Unable to update note" });
  }
});

userRouter.post("/notes/:id/open", auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).send({ msg: "Login First" });
    }

    const note = dbReady
      ? await noteModel.findOne({ _id: id, userId })
      : getUserNotesStore().find((item) => item._id.toString() === id && item.userId === userId);

    if (!note) {
      return res.status(404).send({ msg: "Note not found" });
    }

    if (note.isPrivate) {
      if (!note.privatePassword) {
        return res.status(403).send({ msg: "This private note is locked without a password" });
      }

      if (note.privatePassword !== password) {
        return res.status(403).send({ msg: "Wrong private note password" });
      }
    }

    return res.send({ ...note.toObject?.() || note, unlocked: true });
  } catch (error) {
    return res.status(500).send({ msg: "Unable to unlock note" });
  }
});

userRouter.delete("/notes/:id", auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).send({ msg: "Login First" });
    }

    if (dbReady) {
      const note = await noteModel.findOneAndDelete({ _id: id, userId });
      if (!note) {
        return res.status(404).send({ msg: "Note not found" });
      }
      return res.send({ msg: "Note deleted successfully" });
    }

    const notes = getUserNotesStore();
    const index = notes.findIndex((note) => note._id.toString() === id && note.userId === userId);

    if (index === -1) {
      return res.status(404).send({ msg: "Note not found" });
    }

    notes.splice(index, 1);
    return res.send({ msg: "Note deleted successfully" });
  } catch (error) {
    return res.status(500).send({ msg: "Unable to delete note" });
  }
});

module.exports = { userRouter };
