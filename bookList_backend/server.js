require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
const options = {
  origin: "*"
};
app.use(cors(options));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Connection Error:", err));

// Book Schema
const BookSchema = new mongoose.Schema({
  ISBN: String,
  Title: String,
  Author: String,
  Genre: String,
  Publisher: String,
  PublicationYear: String,
  Language: String,
  Format: String,
  Edition: String,
  Price: Number,
});

const Book = mongoose.model("Book", BookSchema);

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", UserSchema);

// **📌 GET ALL BOOKS (Public API)**
app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// **📌 GET BOOKS BY AUTHOR**
app.get("/api/books/author/:author", async (req, res) => {
  try {
    const books = await Book.find({ Author: req.params.author });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// **📌 GET BOOKS BY TITLE**
app.get("/api/books/title/:title", async (req, res) => {
  try {
    const books = await Book.find({ Title: req.params.title });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// **📌 GET BOOKS BY ISBN**
app.get("/api/books/isbn/:isbn", async (req, res) => {
  try {
    const books = await Book.find({ ISBN: req.params.isbn });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// **📌 USER REGISTRATION**
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// **📌 USER LOGIN**
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// **📌 LOGOUT (No server action needed, just client-side)**
app.post("/api/logout", (req, res) => {
  // Just inform the client that they can remove the token
  res.json({ message: "Logged out successfully" });
});

// **📌 PROTECTED ROUTE (Only for Logged-in Users)**
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
      const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
      req.user = decoded;
      next();
  } catch (err) {
      res.status(401).json({ error: "Invalid token" });
  }
};


// **📌 EDIT BOOK DETAILS (Only for Logged-in Users)**
// Edit Book details (Only for logged-in users)
app.put("/api/books/:isbn", authMiddleware, async (req, res) => {
  try {
      const updatedBook = await Book.findOneAndUpdate(
          { ISBN: req.params.isbn }, // Match the book using ISBN
          req.body,                   // Update the book with the request body data
          { new: true }               // Return the updated document
      );

      if (!updatedBook) {
          return res.status(404).json({ error: "Book not found" });
      }

      res.json(updatedBook);  // Send the updated book details
  } catch (err) {
      console.error("Error during book update:", err); // Add more logging here
      res.status(500).json({ error: "Failed to update book" });
  }
})
// **📌 RUN SERVER**
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
