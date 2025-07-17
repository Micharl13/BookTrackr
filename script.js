document.addEventListener("DOMContentLoaded", () => {
  const bookForm = document.getElementById("book-form");
  const showFormBtn = document.getElementById("show-form");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const bookList = document.getElementById("book-list");
  const sortSelect = document.getElementById("sort");
  const filterStatus = document.getElementById("filter-status");
  const searchInput = document.getElementById("search");
  const coverUrlInput = document.getElementById("cover-url");
  const coverPreview = document.getElementById("cover-preview");
  const toggleThemeBtn = document.getElementById("toggle-theme");
  const exportBtn = document.getElementById("export-json");
  const importInput = document.getElementById("import-json");
  const notesModal = document.getElementById("notes-modal");
  const closeNotesModal = document.getElementById("close-notes-modal");
  const modalBookTitle = document.getElementById("modal-book-title");
  const modalNotesContent = document.getElementById("modal-notes-content");
  const pagination = document.getElementById("pagination-controls");

  let books = JSON.parse(localStorage.getItem("books") || "[]");
  let editIndex = null;
  let currentPage = 1;
  const itemsPerPage = 6;

  function saveBooks() {
    localStorage.setItem("books", JSON.stringify(books));
  }

  function renderBooks() {
    const sortBy = sortSelect.value;
    const status = filterStatus.value;
    const search = searchInput.value.toLowerCase();

    let filtered = books.filter(book => {
      const matchesStatus = status === "All" || book.status === status;
      const matchesSearch =
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search) ||
        book.genre?.toLowerCase().includes(search) ||
        book.tags?.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
        case "author":
        case "series":
        case "genre":
          return (a[sortBy] || "").localeCompare(b[sortBy] || "");
        case "tags":
          return (a.tags?.split(",")[0] || "").localeCompare(b.tags?.split(",")[0] || "");
        case "bookNumber":
        case "rating":
          return Number(a[sortBy] || 0) - Number(b[sortBy] || 0);
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "date":
          return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
        default:
          return 0;
      }
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filtered.slice(start, end);

    bookList.innerHTML = "";
    if (pageItems.length === 0) {
      bookList.innerHTML = `<p class="no-books">No books to show.</p>`;
    } else {
      pageItems.forEach((book, index) => {
        const div = document.createElement("div");
        div.className = "book";
        div.innerHTML = `
          <img src="${book.coverUrl || ''}" alt="Cover" onerror="this.style.display='none'">
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>Genre:</strong> ${book.genre || ''}</p>
          <p><strong>Tags:</strong> ${book.tags || ''}</p>
          <p><strong>Status:</strong> ${book.status}</p>
          <div class="book-actions">
            <button onclick="editBook(${books.indexOf(book)})">✏️</button>
            <button onclick="deleteBook(${books.indexOf(book)})">🗑️</button>
            <button onclick="showNotes(${books.indexOf(book)})">📝</button>
          </div>
        `;
        bookList.appendChild(div);
      });
    }

    pagination.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentPage = i;
        renderBooks();
      });
      pagination.appendChild(btn);
    }

    renderChart();
  }

  function renderChart() {
    const ctx = document.getElementById("statsChart").getContext("2d");
    const counts = {
      "To Read": 0,
      Reading: 0,
      Finished: 0
    };
    books.forEach(b => counts[b.status]++);
    if (window.statsChart) window.statsChart.destroy();
    window.statsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(counts),
        datasets: [{
          label: "# of Books",
          data: Object.values(counts),
          backgroundColor: ["#ffcccc", "#fff3cd", "#d4edda"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  function editBook(index) {
    const book = books[index];
    editIndex = index;
    Object.entries(book).forEach(([key, val]) => {
      const field = document.getElementById(key);
      if (field) field.value = val;
    });
    coverPreview.src = book.coverUrl;
    coverPreview.classList.remove("hidden");
    bookForm.classList.remove("hidden");
  }

  function deleteBook(index) {
    if (confirm("Delete this book?")) {
      books.splice(index, 1);
      saveBooks();
      renderBooks();
    }
  }

  function showNotes(index) {
    const book = books[index];
    modalBookTitle.textContent = `Notes – ${book.title}`;
    modalNotesContent.textContent = book.notes || "No notes.";
    notesModal.classList.remove("hidden");
  }

  bookForm.addEventListener("submit", e => {
    e.preventDefault();
    const newBook = {
      title: title.value,
      author: author.value,
      series: series.value,
      bookNumber: bookNumber.value,
      genre: genre.value,
      tags: tags.value,
      pages: pages.value,
      status: status.value,
      rating: rating.value,
      notes: notes.value,
      coverUrl: coverUrl.value,
      dateAdded: editIndex !== null ? books[editIndex].dateAdded : new Date().toISOString()
    };

    if (editIndex !== null) {
      books[editIndex] = newBook;
      editIndex = null;
    } else {
      books.push(newBook);
    }

    saveBooks();
    bookForm.reset();
    coverPreview.classList.add("hidden");
    bookForm.classList.add("hidden");
    renderBooks();
  });

  cancelEditBtn.addEventListener("click", () => {
    editIndex = null;
  });

  closeNotesModal.addEventListener("click", () => {
    notesModal.classList.add("hidden");
  });

  toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "books.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        books = JSON.parse(reader.result);
        saveBooks();
        renderBooks();
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderBooks();
  });

  renderBooks();
});
