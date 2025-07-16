let books = JSON.parse(localStorage.getItem("books") || "[]");
let editingIndex = null;

const form = document.getElementById("book-form");
const cancelEditBtn = document.getElementById("cancel-edit");
const bookList = document.getElementById("book-list");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const filterSelect = document.getElementById("filter-status");
const themeBtn = document.getElementById("toggle-theme");

function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

function renderBooks() {
  let filtered = books.filter(book =>
    book.title.toLowerCase().includes(searchInput.value.toLowerCase()) ||
    book.author.toLowerCase().includes(searchInput.value.toLowerCase()) ||
    (book.notes || "").toLowerCase().includes(searchInput.value.toLowerCase())
  );

  if (filterSelect.value !== "All") {
    filtered = filtered.filter(book => book.status === filterSelect.value);
  }

  if (sortSelect.value !== "default") {
    filtered.sort((a, b) => {
      if (sortSelect.value === "rating" || sortSelect.value === "date") {
        return b[sortSelect.value] - a[sortSelect.value];
      }
      return a[sortSelect.value].localeCompare(b[sortSelect.value]);
    });
  }

  bookList.innerHTML = "";
  filtered.forEach((book, index) => {
    const div = document.createElement("div");
    div.className = "book";
    div.innerHTML = `
      ${book.cover ? `<img src="${book.cover}" alt="Cover" />` : ""}
      <h3>${book.title}</h3>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Status:</strong> ${book.status}</p>
      <p><strong>Rating:</strong> ${book.rating || "N/A"}</p>
      <p><strong>Genre:</strong> ${book.genre || "N/A"}</p>
      <p><strong>Pages:</strong> ${book.pages || "N/A"}</p>
      <p><strong>Notes:</strong> ${book.notes || ""}</p>
      <div class="book-actions">
        <button onclick="editBook(${index})">✏️</button>
        <button onclick="deleteBook(${index})">🗑️</button>
      </div>
    `;
    bookList.appendChild(div);
  });
}

form.onsubmit = e => {
  e.preventDefault();
  const newBook = {
    title: form.title.value,
    author: form.author.value,
    genre: form.genre.value,
    pages: form.pages.value,
    status: form.status.value,
    rating: form.rating.value,
    notes: form.notes.value,
    cover: form["cover-url"].value,
    date: Date.now()
  };

  if (editingIndex !== null) {
    books[editingIndex] = newBook;
    editingIndex = null;
  } else {
    books.push(newBook);
  }

  form.reset();
  saveBooks();
  renderBooks();
};

cancelEditBtn.onclick = () => {
  editingIndex = null;
  form.reset();
};

function editBook(index) {
  const book = books[index];
  form.title.value = book.title;
  form.author.value = book.author;
  form.genre.value = book.genre;
  form.pages.value = book.pages;
  form.status.value = book.status;
  form.rating.value = book.rating;
  form.notes.value = book.notes;
  form["cover-url"].value = book.cover;
  editingIndex = index;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteBook(index) {
  if (confirm("Are you sure you want to delete this book?")) {
    books.splice(index, 1);
    saveBooks();
    renderBooks();
  }
}

document.getElementById("export-json").onclick = () => {
  const blob = new Blob([JSON.stringify(books, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "books.json";
  a.click();
};

document.getElementById("import-json").onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    try {
      books = JSON.parse(reader.result);
      saveBooks();
      renderBooks();
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
};

themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
};

searchInput.oninput = renderBooks;
sortSelect.onchange = renderBooks;
filterSelect.onchange = renderBooks;

renderBooks();
