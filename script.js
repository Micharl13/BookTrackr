// --- Config ---
const BOOKS_PER_BATCH = 10;

// --- Global Variables ---
let bookData = JSON.parse(localStorage.getItem("books")) || [];
let editingIndex = -1;
let statsChart = null;
let deleteTargetIndex = -1;
let filteredBooks = [];
let renderIndex = 0;
let observer;

// --- DOM Elements ---
const form = document.getElementById("book-form");
const list = document.getElementById("book-list");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const statusFilter = document.getElementById("filter-status");
const coverPreview = document.getElementById("cover-preview");
const shelfToggle = document.getElementById("toggle-view");
const themeToggle = document.getElementById("toggle-theme");
const autocompleteBox = document.getElementById("autocomplete-suggestions");
const scrollTrigger = document.getElementById("infinite-scroll-trigger");

// --- Utility Functions ---
function saveBooks() {
  localStorage.setItem("books", JSON.stringify(bookData));
}

function clearForm() {
  form.reset();
  editingIndex = -1;
  coverPreview.classList.add("hidden");
}

function validateForm() {
  const rating = parseInt(form.rating.value);
  const pagesRead = parseInt(form["pages-read"].value);
  const totalPages = parseInt(form["pages-total"].value);
  if (rating && (rating < 1 || rating > 5)) {
    alert("Rating must be between 1 and 5");
    return false;
  }
  if (pagesRead < 0 || pagesRead > totalPages) {
    alert("Pages read must be between 0 and total pages");
    return false;
  }
  return true;
}

function updateProgressBar(book) {
  const progress = book.pagesTotal > 0 ? (book.pagesRead / book.pagesTotal) * 100 : 0;
  return `<div class="progress-bar"><div class="progress" style="width: ${progress}%"></div></div>`;
}

function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const filterStatus = statusFilter.value;
  filteredBooks = bookData
    .filter(book => {
      const matchesSearch =
        book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query);
      const matchesStatus = filterStatus === "All" || book.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

  // Optional: sort here if needed
  renderIndex = 0;
  list.innerHTML = "";
  renderNextBatch();
  updateDashboardStats();
}

function renderNextBatch() {
  const batch = filteredBooks.slice(renderIndex, renderIndex + BOOKS_PER_BATCH);
  batch.forEach((book, i) => {
    const globalIndex = bookData.indexOf(book);
    const bookEl = document.createElement("div");
    bookEl.className = "book";

    const cover = book.cover || "https://via.placeholder.com/150x200?text=No+Cover";
    bookEl.innerHTML = `
      <img src="${cover}" alt="${book.title}" />
      <h3>${book.title}</h3>
      <p><strong>${book.author}</strong></p>
      ${book.series ? `<p>📖 ${book.series} #${book.bookNumber || ""}</p>` : ""}
      <p>⭐ ${book.rating || "N/A"}</p>
      <p>Status: <span class="status-badge status-${book.status.replace(" ", "-").toLowerCase()}">${book.status}</span></p>
      <p>${book.pagesRead}/${book.pagesTotal} pages</p>
      ${updateProgressBar(book)}
      <div class="tags">${(book.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="book-actions">
        <button onclick="editBook(${globalIndex})">✏️</button>
        <button onclick="confirmDelete(${globalIndex})">🗑️</button>
        <button onclick="viewNotes(${globalIndex})">📝</button>
      </div>
    `;
    list.appendChild(bookEl);
  });

  renderIndex += BOOKS_PER_BATCH;

  if (renderIndex >= filteredBooks.length && observer) {
    observer.disconnect();
  }
}

// --- Infinite Scroll Setup ---
observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    renderNextBatch();
  }
}, {
  root: null,
  rootMargin: "0px",
  threshold: 1.0
});

// --- Core Actions ---
function editBook(i) {
  const book = bookData[i];
  editingIndex = i;
  form.title.value = book.title;
  form.author.value = book.author;
  form.series.value = book.series || "";
  form.bookNumber.value = book.bookNumber || "";
  form.genre.value = book.genre || "";
  form.tags.value = (book.tags || []).join(", ");
  form["pages-read"].value = book.pagesRead;
  form["pages-total"].value = book.pagesTotal;
  form["progress-slider"].value = Math.round((book.pagesRead / book.pagesTotal) * 100);
  form.status.value = book.status;
  form.rating.value = book.rating || "";
  form.notes.value = book.notes || "";
  form["start-date"].value = book.startDate || "";
  form["finish-date"].value = book.finishDate || "";
  form["cover-url"].value = book.cover || "";
  if (book.cover) {
    coverPreview.src = book.cover;
    coverPreview.classList.remove("hidden");
  }
  form.classList.remove("hidden");
}

function confirmDelete(index) {
  deleteTargetIndex = index;
  document.getElementById("delete-confirm-modal").classList.remove("hidden");
}

function deleteBook() {
  if (deleteTargetIndex > -1) {
    bookData.splice(deleteTargetIndex, 1);
    saveBooks();
    applyFilters();
    deleteTargetIndex = -1;
  }
  document.getElementById("delete-confirm-modal").classList.add("hidden");
}

function cancelDelete() {
  deleteTargetIndex = -1;
  document.getElementById("delete-confirm-modal").classList.add("hidden");
}

function viewNotes(i) {
  const book = bookData[i];
  document.getElementById("modal-book-title").textContent = book.title;
  document.getElementById("modal-notes-content").textContent = book.notes || "No notes yet.";
  document.getElementById("notes-modal").classList.remove("hidden");
}

function updateDashboardStats() {
  const genres = {};
  const ratings = [0, 0, 0, 0, 0];

  bookData.forEach(b => {
    if (b.genre) genres[b.genre] = (genres[b.genre] || 0) + 1;
    if (b.rating >= 1 && b.rating <= 5) ratings[b.rating - 1]++;
  });

  if (statsChart) statsChart.destroy();

  statsChart = new Chart(document.getElementById("statsChart"), {
    type: "bar",
    data: {
      labels: ["1★", "2★", "3★", "4★", "5★"],
      datasets: [{
        label: "Ratings",
        data: ratings,
        backgroundColor: "#4caf50"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// --- Form Handling ---
form.addEventListener("submit", e => {
  e.preventDefault();
  if (!validateForm()) return;

  const book = {
    title: form.title.value.trim(),
    author: form.author.value.trim(),
    series: form.series.value.trim(),
    bookNumber: form.bookNumber.value.trim(),
    genre: form.genre.value.trim(),
    tags: form.tags.value.split(",").map(t => t.trim()).filter(Boolean),
    pagesRead: +form["pages-read"].value,
    pagesTotal: +form["pages-total"].value,
    status: form.status.value,
    rating: +form.rating.value || null,
    notes: form.notes.value.trim(),
    startDate: form["start-date"].value,
    finishDate: form["finish-date"].value,
    cover: form["cover-url"].value.trim()
  };

  if (editingIndex > -1) {
    bookData[editingIndex] = book;
  } else {
    bookData.push(book);
  }

  saveBooks();
  applyFilters();
  clearForm();
  form.classList.add("hidden");
});

document.getElementById("show-form").addEventListener("click", () => {
  clearForm();
  form.classList.toggle("hidden");
});

document.getElementById("cancel-edit").addEventListener("click", () => {
  clearForm();
  form.classList.add("hidden");
});

document.getElementById("cover-url").addEventListener("input", e => {
  const url = e.target.value.trim();
  if (url) {
    coverPreview.src = url;
    coverPreview.classList.remove("hidden");
  } else {
    coverPreview.classList.add("hidden");
  }
});

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);
shelfToggle.addEventListener("click", () => {
  list.classList.toggle("shelf-view");
});

document.getElementById("close-notes-modal").addEventListener("click", () => {
  document.getElementById("notes-modal").classList.add("hidden");
});

document.getElementById("confirm-delete").addEventListener("click", deleteBook);
document.getElementById("cancel-delete").addEventListener("click", cancelDelete);

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

document.getElementById("toggle-fields").addEventListener("click", () => {
  document.querySelectorAll(".optional-field").forEach(el => el.classList.toggle("hidden"));
});

document.getElementById("export-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(bookData)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "books.json";
  a.click();
});

document.getElementById("import-json").addEventListener("change", e => {
  const reader = new FileReader();
  reader.onload = () => {
    bookData = JSON.parse(reader.result);
    saveBooks();
    applyFilters();
  };
  reader.readAsText(e.target.files[0]);
});

// --- Autocomplete ---
["title", "author"].forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    const matches = [...new Set(bookData.map(b => b[id]).filter(a => a.toLowerCase().startsWith(val)))].slice(0, 5);
    if (matches.length > 0 && val) {
      autocompleteBox.innerHTML = matches.map(m => `<div>${m}</div>`).join("");
      const rect = input.getBoundingClientRect();
      autocompleteBox.style.top = `${rect.bottom + window.scrollY}px`;
      autocompleteBox.style.left = `${rect.left + window.scrollX}px`;
      autocompleteBox.classList.remove("hidden");
      autocompleteBox.querySelectorAll("div").forEach(el => {
        el.addEventListener("click", () => {
          input.value = el.textContent;
          autocompleteBox.classList.add("hidden");
        });
      });
    } else {
      autocompleteBox.classList.add("hidden");
    }
  });
});

document.addEventListener("click", e => {
  if (!autocompleteBox.contains(e.target)) {
    autocompleteBox.classList.add("hidden");
  }
});

document.getElementById("progress-slider").addEventListener("input", e => {
  const total = +form["pages-total"].value || 1;
  const percent = +e.target.value;
  form["pages-read"].value = Math.round((percent / 100) * total);
});

document.getElementById("pages-total").addEventListener("input", () => {
  const total = +form["pages-total"].value || 1;
  const read = +form["pages-read"].value || 0;
  form["progress-slider"].value = Math.min(100, Math.round((read / total) * 100));
});

document.getElementById("pages-read").addEventListener("input", () => {
  const total = +form["pages-total"].value || 1;
  const read = +form["pages-read"].value || 0;
  form["progress-slider"].value = Math.min(100, Math.round((read / total) * 100));
});

list.addEventListener("click", e => {
  if (e.target.classList.contains("tag")) {
    const tag = e.target.textContent;
    searchInput.value = tag;
    applyFilters();
  }
});

// --- Initialize ---
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

applyFilters();
observer.observe(scrollTrigger);
