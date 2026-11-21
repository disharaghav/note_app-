const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, ref: "user" },
        title: { type: String, default: "Untitled note" },
        content: { type: String, default: "" },
        color: { type: String, default: "#f3f0ff" },
        category: { type: String, default: "General" },
        isPinned: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
        isPrivate: { type: Boolean, default: false },
        privatePassword: { type: String, default: "" },
        status: { type: String, default: "inbox" },
    },
    { timestamps: true }
);

const noteModel = mongoose.model("note", noteSchema);

module.exports = { noteModel };
