const books = JSON.parse(localStorage.getItem("books") || "[]");
let filteredBooks = [...books];
let visibleCount = 0;
const batchSize = 20;

const bookTableBody = document.getElementById("bookTableBody");
const bookGrid = document.getElementById("bookGrid");
const searchBar = document.getElementById("searchBar");
const toggleViewBtn = document.getElementById("toggleViewBtn");
const infiniteScrollTrigger = document.getElementById("infiniteScrollTrigger");

let isGridView = false;
let deleteIndex = null;

function renderBook(book, index) {
  const tags = book.tags ? book.tags.split(",").map(t => t.trim()) : [];
  const cover = book.coverUrl || "https://via.placeholder.com/100x150?text=No+Cover";
  const progress = book.progress && book.pages
    ? Math.min(100, Math.round((+book.progress / +book.pages) * 100))
    : 0;

  const tagHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join(" ");

  if (!isGridView) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="${cover}" alt="Cover"></td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.series || ""} ${book.bookNumber || ""}</td>
      <td class="status-${book.status.replace(" ", "-")}">${book.status}</td>
      <td>${book.rating || ""}</td>
      <td>${book.pages || ""}</td>
      <td>
        ${book.progress || 0}
        <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
      </td>
      <td>${tagHtml}</td>
      <td>${book.dateAdded || ""}</td>
      <td>
        <button onclick="deleteBook(${index})">🗑️</button>
      </td>
    `;
    bookTableBody.appendChild(row);
  } else {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <img src="${cover}" alt="Cover">
      <h3>${book.title}</h3>
      <p><strong>${book.author}</strong></p>
      <p>${book.series || ""} ${book.bookNumber || ""}</p>
      <p>Status: ${book.status}</p>
      <p>Rating: ${book.rating || ""}</p>
      <p>${book.progress || 0}/${book.pages || 0}</p>
      <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
      <div>${tagHtml}</div>
    `;
    bookGrid.appendChild(card);
  }
}

function renderNextBatch() {
  const nextBooks = filteredBooks.slice(visibleCount, visibleCount + batchSize);
  nextBooks.forEach((book, index) => {
    renderBook(book, visibleCount + index);
  });
  visibleCount += batchSize;
}

function clearBooks() {
  bookTableBody.innerHTML = "";
  bookGrid.innerHTML = "";
  visibleCount = 0;
}

function refreshView() {
  clearBooks();
  renderNextBatch();
}

function filterBooks(query) {
  filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(query) ||
    book.author.toLowerCase().includes(query) ||
    (book.tags && book.tags.toLowerCase().includes(query))
  );
  refreshView();
}

function deleteBook(index) {
  deleteIndex = index;
  document.getElementById("confirmModal").classList.remove("hidden");
}

document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (deleteIndex !== null) {
    books.splice(deleteIndex, 1);
    localStorage.setItem("books", JSON.stringify(books));
    filteredBooks = [...books];
    refreshView();
    deleteIndex = null;
  }
  document.getElementById("confirmModal").classList.add("hidden");
});

document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  deleteIndex = null;
  document.getElementById("confirmModal").classList.add("hidden");
});

searchBar.addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();
  filterBooks(query);
});

toggleViewBtn.addEventListener("click", () => {
  isGridView = !isGridView;
  bookGrid.classList.toggle("hidden", !isGridView);
  bookTableBody.parentElement.classList.toggle("hidden", isGridView);
  refreshView();
});

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    renderNextBatch();
  }
}, {
  root: null,
  rootMargin: "0px",
  threshold: 1.0
});

observer.observe(infiniteScrollTrigger);

refreshView();
