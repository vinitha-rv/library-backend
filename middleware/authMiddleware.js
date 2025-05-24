

import Book from "../models/Book.js";


export const getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};


export const addBook = async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.json({ message: "Book added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding book" });
  }
};


export const deleteBook = async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting book" });
  }
};

export const updateBook = async (req, res) => {
  try {
    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating book" });
  }
};
