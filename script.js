let books = JSON.parse(localStorage.getItem("books") || "[]");
let editingIndex = null;

const form = document.getElementById("book-form");
const cancelEditBtn = document.getElementById("cancel-edit");
const bookList = document.getElementById("book-list");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const filterSelect = document.getElementById("filter-status");
const themeBtn = document.getElementById("toggle-theme");
const preview = document.getElementById("cover-preview");

function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

function createProgressBar(pages) {
  if (!pages || !pages.includes("/")) return "";
  const [read, total] = pages.split("/").map(Number);
  if (isNaN(read) || isNaN(total) || total <= 0) return "";
  const percent = Math.min((read / total) * 100, 100);
  return `
    <div class="progress-bar">
      <div class="progress" style="width:${percent}%;"></div>
    </div>`;
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
        return (b[sortSelect.value] || 0) - (a[sortSelect.value] || 0);
      }
      return (a[sortSelect.value] || "").localeCompare(b[sortSelect.value] || "");
    });
  }

  bookList.innerHTML = "";
  filtered.forEach((book, index) => {
    const div = document.createElement("div");
    div.className = "book";
    div.innerHTML = `
      ${book.cover ? `<img src="${book.cover}" alt="Cover" onerror="this.style.display='none'" />` : ""}
      <h3>${book.title}</h3>
      <h2><strong>Author:</strong> ${book.author}</h2>
      <p>${book.series}</p>
      <p>${book.bookNumber}</p>
      <p><strong>Status:</strong> ${book.status}</p>
      <p><strong>Rating:</strong> ${book.rating || "N/A"}</p>
      <p><strong>Genre:</strong> ${book.genre || "N/A"}</p>
      <p><strong>Pages:</strong> ${book.pages || "N/A"}</p>
      <p><strong>Notes:</strong> ${book.notes || ""}</p>
      ${createProgressBar(book.pages)}
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
    title: form.title.value.trim(),
    author: form.author.value.trim(),
    series: form.series.value.trim(),
    bookNumber: form.bookNumber.value.trim(),
    genre: form.genre.value.trim(),
    pages: form.pages.value.trim(),
    status: form.status.value,
    rating: form.rating.value,
    notes: form.notes.value.trim(),
    cover: form["cover-url"].value.trim(),
    date: Date.now()
  };

  if (!newBook.title || !newBook.author) {
    form.classList.add("error");
    setTimeout(() => form.classList.remove("error"), 500);
    return;
  }

  if (editingIndex !== null) {
    books[editingIndex] = newBook;
    editingIndex = null;
  } else {
    books.push(newBook);
  }

  form.reset();
  preview.classList.add("hidden");
  saveBooks();
  renderBooks();
};

cancelEditBtn.onclick = () => {
  editingIndex = null;
  form.reset();
  preview.classList.add("hidden");
};

function editBook(index) {
  const book = books[index];
  form.title.value = book.title;
  form.author.value = book.author;
  form.series.value = book.series;
  form.bookNumber.value = book.bookNumber;
  form.genre.value = book.genre;
  form.pages.value = book.pages;
  form.status.value = book.status;
  form.rating.value = book.rating;
  form.notes.value = book.notes;
  form["cover-url"].value = book.cover;
  preview.src = book.cover;
  preview.classList.remove("hidden");
  editingIndex = index;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteBook(index) {
  if (confirm("Delete this book?")) {
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

form["cover-url"].addEventListener("input", () => {
  const url = form["cover-url"].value.trim();
  if (url) {
    preview.src = url;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }
});

searchInput.oninput = renderBooks;
sortSelect.onchange = renderBooks;
filterSelect.onchange = renderBooks;

renderBooks();
