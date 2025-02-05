const API_URL = "http://localhost:5000/api"; // Update with your backend URL
let token = localStorage.getItem("token");

const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const bookSection = document.getElementById("bookSection");
const logoutBtn = document.getElementById("logoutBtn");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

const bookList = document.getElementById("bookList");
const editBookForm = document.getElementById("editBookForm");

const editISBN = document.getElementById("editISBN");
const editTitle = document.getElementById("editTitle");
const editAuthor = document.getElementById("editAuthor");
const editGenre = document.getElementById("editGenre");
const editPrice = document.getElementById("editPrice");

// Switch to Register Section
showRegister.addEventListener("click", () => {
    loginSection.style.display = "none";
    registerSection.style.display = "block";
});

// Switch to Login Section
showLogin.addEventListener("click", () => {
    registerSection.style.display = "none";
    loginSection.style.display = "block";
});

// Register new user
document.getElementById("registerBtn").addEventListener("click", async () => {
    const name = registerName.value;
    const email = registerEmail.value;
    const password = registerPassword.value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();
        alert(data.message);
        registerSection.style.display = "none";
        loginSection.style.display = "block";
    } catch (err) {
        console.log("Error:", err);
    }
});

// Login user
// Login function (ensure you're setting the token)
document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        
        if (response.status === 403 || data.message === "Access Denied") {
            alert("Access Denied. Please check your credentials.");
            return;
        }
        
        token = data.token;
        localStorage.setItem("token", token);  // Store the token in localStorage
        loginSection.style.display = "none";
        showBookSection();
    } catch (err) {
        console.log("Error:", err);
    }
});

// Logout user
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    token = null;
    loginSection.style.display = "block";
    logoutBtn.style.display = "none";
});

// Fetch and display books
const fetchBooks = async () => {
    try {
        const response = await fetch(`${API_URL}/books`, {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
        if (response.status === 403) {
            alert("Access Denied. Please log in.");
            loginSection.style.display = "block";
            bookSection.style.display = "none";
            return;
        }
        
        const books = await response.json();
        console.log(books)
        bookList.innerHTML = books.map((book) => `
            <li>
                <h3>${book.Title}</h3>
                <p>Author: ${book.Author}</p>
                <p>Genre: ${book.Genre}</p>
                <p>Price: $${book.Price}</p>
                <button onclick="editBook('${book.ISBN}')">Edit</button>
            </li>
        `).join('');
    } catch (err) {
        console.log("Error fetching books:", err);
    }
};

// Show Book Section
const showBookSection = () => {
    bookSection.style.display = "block";
    logoutBtn.style.display = "inline-block";
    loginSection.style.display = "none"
    fetchBooks();
};

// Edit Book function
const editBook = (isbn) => {
    fetch(`${API_URL}/books/${isbn}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    })
    .then(res => {
        if (res.status === 401) {
            alert("Access Denied. You don't have permission to edit this book.");
            return;
        }
        return res.json();
    })
    .then((book) => {
        console.log(book)
        if (book) {
            editISBN.value = book.ISBN;
            editTitle.value = book.Title;
            editAuthor.value = book.Author;
            editGenre.value = book.Genre;
            editPrice.value = book.Price;
        }
    })
    .catch(err => console.log("Error fetching book details:", err));
};

// Submit Edited Book
// Submit Edited Book
editBookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updatedBook = {
        ISBN: editISBN.value,
        Title: editTitle.value,
        Author: editAuthor.value,
        Genre: editGenre.value,
        Price: editPrice.value,
    };

    try {
        const response = await fetch(`${API_URL}/books/${editISBN.value}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // Pass the token here
            },
            body: JSON.stringify(updatedBook),
        });

        if (response.status === 401) {
            alert("Access Denied. You don't have permission to update this book.");
            return;
        }

        const data = await response.json();
        if (response.status === 200) {
            alert("Book updated successfully");
            editISBN.value = "";
            editTitle.value = "";
            editAuthor.value = "";
            editGenre.value = "";
            editPrice.value = "";
            fetchBooks(); // Refresh the list of books
        } else {
            alert("Failed to update book: " + data.error); // Display the error message from backend
        }
    } catch (err) {
        console.log("Error updating book:", err);
        alert("An error occurred while updating the book.");
    }
});


// If logged in, show the books

window.onload = showBookSection;
