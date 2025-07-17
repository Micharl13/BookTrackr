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

function clearChip(type) {
  if (type === "search") searchInput.value = "";
  if (type === "status") filterSelect.value = "All";
  if (type === "sort") sortSelect.value = "default";
  renderBooks();
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
    div.innerHTML = `
      ${chip.label}
      <button onclick="clearChip('${chip.id}')">×</button>
    `;
    chipBar.appendChild(div);
  });
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
  let filteredBooks = [...books];

  const status = filterSelect.value;
  if (status !== "All") {
    filteredBooks = filteredBooks.filter(b => b.status === status);
  }

  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filteredBooks = filteredBooks.filter(b =>
      b.title.toLowerCase().includes(searchTerm) ||
      b.author.toLowerCase().includes(searchTerm) ||
      b.series?.toLowerCase().includes(searchTerm) ||
      b.genre?.toLowerCase().includes(searchTerm)
    );
  }

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

  renderPagination(filteredBooks.length);
  const start = (currentPage - 1) * perPage;
  const pageBooks = filteredBooks.slice(start, start + perPage);

  bookList.innerHTML = "";

  const groups = { "To Read": [], "Reading": [], "Finished": [] };

  pageBooks.forEach((book, index) => {
    groups[book.status].push({ book, index });
  });

  Object.keys(groups).forEach(status => {
    if (groups[status].length > 0) {
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = status;
      bookList.appendChild(title);

      groups[status].forEach(({ book, index }) => {
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
  });

  renderChips();
  renderStatsDashboard();
  enableDragDrop();
}

function renderStatsDashboard() {
  const ctx = document.getElementById("statsChart").getContext("2d");
  const statusCounts = { "To Read": 0, "Reading": 0, "Finished": 0 };

  books.forEach(book => {
    if (statusCounts[book.status] !== undefined) {
      statusCounts[book.status]++;
    }
  });

  if (window.bookChart) {
    window.bookChart.destroy();
  }

  window.bookChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["To Read", "Reading", "Finished"],
      datasets: [{
        label: "Books by Status",
        data: [
          statusCounts["To Read"],
          statusCounts["Reading"],
          statusCounts["Finished"]
        ],
        backgroundColor: ["#ffcccc", "#fff3cd", "#d4edda"],
        borderColor: "#333",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function enableDragDrop() {
  const container = document.getElementById("book-list");
  Sortable.create(container, {
    animation: 150,
    handle: ".book",
    draggable: ".book",
    onEnd: evt => {
      const reordered = Array.from(container.querySelectorAll(".book h3"))
        .map(h3 => {
          const title = h3.textContent;
          return books.find(b => b.title === title);
        });

      books = reordered;
      saveBooks();
      renderBooks();
    }
  });
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
  bookForm.classList.add("hidden"); // Hide form after submit
  saveBooks();
  renderBooks();
});

showFormBtn.addEventListener("click", () => {
  bookForm.classList.toggle("hidden");
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
