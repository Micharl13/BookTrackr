let books = JSON.parse(localStorage.getItem("books")) || [];
let editingIndex = null;

const bookForm = document.getElementById("book-form");
const bookList = document.getElementById("book-list");
const coverURL = document.getElementById("cover-url");
const coverPreview = document.getElementById("cover-preview");
const cancelEditBtn = document.getElementById("cancel-edit");
const sortSelect = document.getElementById("sort");
const filterSelect = document.getElementById("filter-status");
const searchInput = document.getElementById("search");

function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

function renderBooks() {
  let filteredBooks = [...books];

  // Filter
  const status = filterSelect.value;
  if (status !== "All") {
    filteredBooks = filteredBooks.filter(b => b.status === status);
  }

  // Search
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filteredBooks = filteredBooks.filter(b =>
      b.title.toLowerCase().includes(searchTerm) ||
      b.author.toLowerCase().includes(searchTerm) ||
      b.series?.toLowerCase().includes(searchTerm) ||
      b.genre?.toLowerCase().includes(searchTerm)
    );
  }

  // Sort
  const sortValue = sortSelect.value;
  if (sortValue !== "default") {
    filteredBooks.sort((a, b) => {
      if (sortValue === "rating" || sortValue === "bookNumber") {
        return (b[sortValue] || 0) - (a[sortValue] || 0);
      } else if (sortValue === "date") {
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      } else {
        return (a[sortValue] || "").localeCompare(b[sortValue] || "");
      }
    });
  }

  // Render
  bookList.innerHTML = "";
  filteredBooks.forEach((book, index) => {
    const div = document.createElement("div");
    div.className = "book";

    const progress = parsePages(book.pages);
    const stars = "★".repeat(book.rating || 0) + "☆".repeat(5 - (book.rating || 0));
    const badgeClass = book.status ? `status-${book.status.replace(" ", "\\ ")}` : "";

    div.innerHTML = `
      <img src="${book.cover || ''}" alt="${book.title}" />
      <h3>${book.title}</h3>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Series:</strong> ${book.series || "—"} #${book.bookNumber || "—"}</p>
      <p><strong>Genre:</strong> ${book.genre || "—"}</p>
      <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
      <div class="stars">${stars}</div>
      <span class="status-badge ${badgeClass}">${book.status}</span>
      <div class="book-actions">
        <button onclick="editBook(${index})">✏️ Edit</button>
        <button onclick="deleteBook(${index})">🗑️ Delete</button>
      </div>
    `;
    bookList.appendChild(div);
  });
}

function parsePages(pages) {
  const match = pages?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return 0;
  const read = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);
  return total > 0 ? Math.min((read / total) * 100, 100) : 0;
}

bookForm.addEventListener("submit", e => {
  e.preventDefault();
  const book = {
    title: bookForm.title.value,
    author: bookForm.author.value,
    series: bookForm.series.value,
    bookNumber: bookForm.bookNumber.value,
    genre: bookForm.genre.value,
    pages: bookForm.pages.value,
    status: bookForm.status.value,
    rating: parseInt(bookForm.rating.value),
    notes: bookForm.notes.value,
    cover: bookForm.coverURL.value,
    dateAdded: new Date().toISOString()
  };
  if (editingIndex !== null) {
    books[editingIndex] = book;
    editingIndex = null;
  } else {
    books.push(book);
  }
  bookForm.reset();
  coverPreview.classList.add("hidden");
  saveBooks();
  renderBooks();
});

function editBook(index) {
  const book = books[index];
  bookForm.title.value = book.title;
  bookForm.author.value = book.author;
  bookForm.series.value = book.series;
  bookForm.bookNumber.value = book.bookNumber;
  bookForm.genre.value = book.genre;
  bookForm.pages.value = book.pages;
  bookForm.status.value = book.status;
  bookForm.rating.value = book.rating;
  bookForm.notes.value = book.notes;
  bookForm.coverURL.value = book.cover;
  coverPreview.src = book.cover;
  coverPreview.classList.remove("hidden");
  editingIndex = index;
}

cancelEditBtn.addEventListener("click", () => {
  bookForm.reset();
  editingIndex = null;
  coverPreview.classList.add("hidden");
});

function deleteBook(index) {
  if (confirm("Sure you want to delete this book?")) {
    books.splice(index, 1);
    saveBooks();
    renderBooks();
  }
}

coverURL.addEventListener("input", () => {
  if (coverURL.value.trim()) {
    coverPreview.src = coverURL.value;
    coverPreview.classList.remove("hidden");
  } else {
    coverPreview.classList.add("hidden");
  }
});

sortSelect.addEventListener("change", renderBooks);
filterSelect.addEventListener("change", renderBooks);
searchInput.addEventListener("input", renderBooks);

renderBooks();
