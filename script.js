let books = [];
let editingIndex = null;
let currentPage = 1;
const perPage = 6;

// Get DOM elements
const bookForm = document.getElementById("book-form");
const showFormBtn = document.getElementById("show-form");
const bookList = document.getElementById("book-list");
const coverURL = document.getElementById("cover-url");
const coverPreview = document.getElementById("cover-preview");
const cancelEditBtn = document.getElementById("cancel-edit");
const sortSelect = document.getElementById("sort");
const filterSelect = document.getElementById("filter-status");
const searchInput = document.getElementById("search");
const themeToggle = document.getElementById("toggle-theme");
const chipBar = document.getElementById("active-filters");
const pagination = document.getElementById("pagination-controls");
const exportBtn = document.getElementById("export-json");
const importInput = document.getElementById("import-json");

// Load books from localStorage on page load
function loadBooks() {
  const saved = localStorage.getItem("books");
  if (saved) {
    try {
      books = JSON.parse(saved);
      console.log("Books loaded from localStorage:", books);
    } catch (error) {
      console.error("Error loading books from localStorage:", error);
      books = [];
    }
  }
}

function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
  console.log("Books saved to localStorage:", books);
}

// Load theme from localStorage
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
}

function renderChips() {
  chipBar.innerHTML = "";
  const chips = [];

  if (searchInput.value) {
    chips.push({ label: `Search: "${searchInput.value}"`, id: "search" });
  }

  if (filterSelect.value !== "All") {
    chips.push({ label: `Status: ${filterSelect.value}`, id: "status" });
  }

  if (sortSelect.value !== "default") {
    chips.push({ label: `Sort: ${sortSelect.options[sortSelect.selectedIndex].text}`, id: "sort" });
  }

  chips.forEach(chip => {
    const div = document.createElement("div");
    div.className = "chip";
    div.innerHTML = `${chip.label} <button onclick="clearChip('${chip.id}')">×</button>`;
    chipBar.appendChild(div);
  });
}

function clearChip(type) {
  if (type === "search") searchInput.value = "";
  if (type === "status") filterSelect.value = "All";
  if (type === "sort") sortSelect.value = "default";
  currentPage = 1;
  renderBooks();
}

function renderPagination(total) {
  pagination.innerHTML = "";
  const pages = Math.ceil(total / perPage);
  
  if (pages <= 1) return;
  
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      renderBooks();
    };
    pagination.appendChild(btn);
  }
}

function parsePages(pages) {
  if (!pages) return 0;
  const match = pages.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return 0;
  const read = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);
  return total > 0 ? Math.min((read / total) * 100, 100) : 0;
}

function getStatusClass(status) {
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function parseTags(tagsString) {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

function renderTags(tags) {
  if (!tags || tags.length === 0) return '';
  
  const tagElements = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
  return `<div class="tags">${tagElements}</div>`;
}

function renderBooks() {
  let filtered = [...books];

  // Apply status filter
  const status = filterSelect.value;
  if (status !== "All") {
    filtered = filtered.filter(b => b.status === status);
  }

  // Apply search filter
  const term = searchInput.value.toLowerCase();
  if (term) {
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(term) ||
      b.author.toLowerCase().includes(term) ||
      (b.series && b.series.toLowerCase().includes(term)) ||
      (b.genre && b.genre.toLowerCase().includes(term)) ||
      (b.tags && b.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }

  // Apply sorting
  const sortBy = sortSelect.value;
  if (sortBy !== "default") {
    filtered.sort((a, b) => {
      if (sortBy === "rating" || sortBy === "bookNumber") {
        return (b[sortBy] || 0) - (a[sortBy] || 0);
      } else if (sortBy === "date") {
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      } else {
        return (a[sortBy] || "").localeCompare(b[sortBy] || "");
      }
    });
  }

  // Pagination
  renderPagination(filtered.length);
  const start = (currentPage - 1) * perPage;
  const visibleBooks = filtered.slice(start, start + perPage);

  // Clear book list
  bookList.innerHTML = "";

  if (visibleBooks.length === 0) {
    const noBooks = document.createElement("div");
    noBooks.className = "no-books";
    noBooks.textContent = filtered.length === 0 ? "No books found" : "No books on this page";
    bookList.appendChild(noBooks);
    renderChips();
    return;
  }

  // Group books by status
  const groups = { "To Read": [], "Reading": [], "Finished": [] };
  visibleBooks.forEach(book => {
    const originalIndex = books.findIndex(b => b === book);
    groups[book.status]?.push({ book, originalIndex });
  });

  // Render groups
  for (const status of ["To Read", "Reading", "Finished"]) {
    if (groups[status].length > 0) {
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = status;
      bookList.appendChild(title);

      groups[status].forEach(({ book, originalIndex }) => {
        const div = document.createElement("div");
        div.className = "book";

        const progress = parsePages(book.pages);
        const stars = "★".repeat(book.rating || 0) + "☆".repeat(5 - (book.rating || 0));
        const badgeClass = getStatusClass(book.status);
        const tagsHtml = renderTags(book.tags);

        div.innerHTML = `
          <img src="${book.cover || ''}" alt="${book.title}" onerror="this.style.display='none'" />
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>Series:</strong> ${book.series || "—"} #${book.bookNumber || "—"}</p>
          <p><strong>Genre:</strong> ${book.genre || "—"}</p>
          <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
          <div class="stars">${stars}</div>
          <span class="status-badge ${badgeClass}">${book.status}</span>
          ${tagsHtml}
          <div class="book-actions">
            <button onclick="editBook(${originalIndex})">✏️ Edit</button>
            <button onclick="deleteBook(${originalIndex})">🗑️ Delete</button>
          </div>`;
        bookList.appendChild(div);
      });
    }
  }

  renderChips();
  renderStatsDashboard();
}

function renderStatsDashboard() {
  const ctx = document.getElementById("statsChart");
  if (!ctx) return;
  
  const context = ctx.getContext("2d");
  const counts = { "To Read": 0, "Reading": 0, "Finished": 0 };
  books.forEach(b => counts[b.status]++);
  
  if (window.bookChart) {
    window.bookChart.destroy();
  }
  
  window.bookChart = new Chart(context, {
    type: "doughnut",
    data: {
      labels: ["To Read", "Reading", "Finished"],
      datasets: [{
        label: "Books by Status",
        data: [counts["To Read"], counts["Reading"], counts["Finished"]],
        backgroundColor: ["#ffcccc", "#fff3cd", "#d4edda"],
        borderColor: "#333",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { 
        legend: { position: "bottom" }
      }
    }
  });
}

function deleteBook(index) {
  if (confirm("Are you sure you want to delete this book?")) {
    books.splice(index, 1);
    saveBooks();
    renderBooks();
  }
}

// Form submission - Updated to handle tags
bookForm.addEventListener("submit", function(e) {
  e.preventDefault();
  
  // Get form elements
  const titleInput = document.getElementById("title");
  const authorInput = document.getElementById("author");
  const seriesInput = document.getElementById("series");
  const bookNumberInput = document.getElementById("bookNumber");
  const genreInput = document.getElementById("genre");
  const tagsInput = document.getElementById("tags");
  const pagesInput = document.getElementById("pages");
  const statusInput = document.getElementById("status");
  const ratingInput = document.getElementById("rating");
  const notesInput = document.getElementById("notes");
  const coverURLInput = document.getElementById("cover-url");
  
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  
  if (!title || !author) {
    alert("Title and Author are required.");
    bookForm.classList.add("error");
    setTimeout(() => bookForm.classList.remove("error"), 300);
    return;
  }

  const book = {
    title,
    author,
    series: seriesInput.value.trim(),
    bookNumber: bookNumberInput.value.trim(),
    genre: genreInput.value.trim(),
    tags: parseTags(tagsInput.value),
    pages: pagesInput.value.trim(),
    status: statusInput.value,
    rating: parseInt(ratingInput.value) || 0,
    notes: notesInput.value.trim(),
    cover: coverURLInput.value.trim(),
    dateAdded: editingIndex !== null ? books[editingIndex].dateAdded : new Date().toISOString()
  };

  if (editingIndex !== null) {
    books[editingIndex] = book;
    editingIndex = null;
  } else {
    books.push(book);
  }

  saveBooks();
  bookForm.reset();
  bookForm.classList.add("hidden");
  coverPreview.classList.add("hidden");
  renderBooks();
  
  // Show success message
  alert(editingIndex !== null ? "Book updated successfully!" : "Book added successfully!");
});

// Show form button
showFormBtn.addEventListener("click", () => {
  bookForm.classList.toggle("hidden");
  if (!bookForm.classList.contains("hidden")) {
    document.getElementById("title").focus();
  }
});

// Cancel edit button
cancelEditBtn.addEventListener("click", () => {
  bookForm.reset();
  editingIndex = null;
  bookForm.classList.add("hidden");
  coverPreview.classList.add("hidden");
});

// Cover URL preview
coverURL.addEventListener("input", () => {
  const url = coverURL.value.trim();
  if (url) {
    coverPreview.src = url;
    coverPreview.classList.remove("hidden");
  } else {
    coverPreview.classList.add("hidden");
  }
});

// Edit book function - Updated to handle tags
function editBook(index) {
  const book = books[index];
  document.getElementById("title").value = book.title;
  document.getElementById("author").value = book.author;
  document.getElementById("series").value = book.series || "";
  document.getElementById("bookNumber").value = book.bookNumber || "";
  document.getElementById("genre").value = book.genre || "";
  document.getElementById("tags").value = book.tags ? book.tags.join(', ') : "";
  document.getElementById("pages").value = book.pages || "";
  document.getElementById("status").value = book.status;
  document.getElementById("rating").value = book.rating || "";
  document.getElementById("notes").value = book.notes || "";
  document.getElementById("cover-url").value = book.cover || "";
  
  if (book.cover) {
    coverPreview.src = book.cover;
    coverPreview.classList.remove("hidden");
  }
  
  editingIndex = index;
  bookForm.classList.remove("hidden");
  document.getElementById("title").focus();
}

// Event listeners for filters and search
[sortSelect, filterSelect].forEach(el => {
  el.addEventListener("change", () => {
    currentPage = 1;
    renderBooks();
  });
});

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderBooks();
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Export functionality
exportBtn.addEventListener("click", () => {
  const dataStr = JSON.stringify(books, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "booktrackr-export.json";
  link.click();
  URL.revokeObjectURL(url);
});

// Import functionality
importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        books = imported;
        saveBooks();
        renderBooks();
        alert("Books imported successfully!");
      } else {
        alert("Invalid file format. Please select a valid JSON file.");
      }
    } catch (error) {
      alert("Error reading file. Please make sure it's a valid JSON file.");
    }
  };
  reader.readAsText(file);
});

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  loadBooks();
  renderBooks();
});
