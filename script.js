let books = JSON.parse(localStorage.getItem("books")) || [];
let editingIndex = null;
let currentPage = 1;
const perPage = 6;

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

function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
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
  renderBooks();
}

function renderPagination(total) {
  pagination.innerHTML = "";
  const pages = Math.ceil(total / perPage);
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
  const match = pages?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return 0;
  const read = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);
  return total > 0 ? Math.min((read / total) * 100, 100) : 0;
}

function renderBooks() {
  let filtered = [...books];

  const status = filterSelect.value;
  if (status !== "All") filtered = filtered.filter(b => b.status === status);

  const term = searchInput.value.toLowerCase();
  if (term) {
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(term) ||
      b.author.toLowerCase().includes(term) ||
      b.series?.toLowerCase().includes(term) ||
      b.genre?.toLowerCase().includes(term)
    );
  }

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

  renderPagination(filtered.length);
  const start = (currentPage - 1) * perPage;
  const visibleBooks = filtered.slice(start, start + perPage);

  bookList.innerHTML = "";
  const groups = { "To Read": [], "Reading": [], "Finished": [] };
  visibleBooks.forEach((b, i) => groups[b.status]?.push({ book: b, index: i }));

  for (const status of ["To Read", "Reading", "Finished"]) {
    if (groups[status].length) {
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = status;
      bookList.appendChild(title);

      groups[status].forEach(({ book, index }) => {
        const div = document.createElement("div");
        div.className = "book";

        const progress = parsePages(book.pages);
        const stars = "★".repeat(book.rating || 0) + "☆".repeat(5 - (book.rating || 0));
        const badgeClass = `status-${book.status.replace(" ", "\\ ")}`;

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
            <button onclick="editBook(${books.indexOf(book)})">✏️ Edit</button>
            <button onclick="deleteBook(${books.indexOf(book)})">🗑️ Delete</button>
          </div>`;
        bookList.appendChild(div);
      });
    }
  }

  renderChips();
  renderStatsDashboard();
  enableDragDrop();
}

function renderStatsDashboard() {
  const ctx = document.getElementById("statsChart").getContext("2d");
  const counts = { "To Read": 0, "Reading": 0, "Finished": 0 };
  books.forEach(b => counts[b.status]++);
  if (window.bookChart) window.bookChart.destroy();
  window.bookChart = new Chart(ctx, {
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
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function enableDragDrop() {
  Sortable.create(bookList, {
    animation: 150,
    handle: ".book",
    draggable: ".book",
    onEnd: () => {
      const newOrder = Array.from(bookList.querySelectorAll(".book h3")).map(h =>
        books.find(b => b.title === h.textContent)
      );
      books = newOrder;
      saveBooks();
      renderBooks();
    }
  });
}

bookForm.addEventListener("submit", e => {
  e.preventDefault();
  const book = {
    title: bookForm.title.value.trim(),
    author: bookForm.author.value.trim(),
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

  if (!book.title || !book.author) {
    alert("Title and Author are required.");
    return;
  }

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
});

showFormBtn.addEventListener("click", () => {
  bookForm.classList.toggle("hidden");
});

cancelEditBtn.addEventListener("click", () => {
  bookForm.reset();
  editingIndex = null;
  bookForm.classList.add("hidden");
  coverPreview.classList.add("hidden");
});

coverURL.addEventListener("input", () => {
  if (coverURL.value.trim()) {
    coverPreview.src = coverURL.value;
    coverPreview.classList.remove("hidden");
  } else {
    coverPreview.classList.add("hidden");
  }
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
  bookForm.classList.remove("hidden");
}

[sortSelect, filterSelect].forEach(el => el.addEventListener("change", () => {
  currentPage = 1;
  renderBooks();
}));

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderBooks();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

renderBooks();
