// BookTrackr Application
class BookTrackr {
  constructor() {
    this.books = this.loadBooks();
    this.filteredBooks = [...this.books];
    this.visibleCount = 0;
    this.batchSize = 20;
    this.isGridView = false;
    this.deleteIndex = null;
    this.sortField = null;
    this.sortDirection = 'asc';
    
    this.initializeElements();
    this.bindEvents();
    this.render();
  }

  // Initialize DOM elements
  initializeElements() {
    this.elements = {
      bookTableBody: document.getElementById("bookTableBody"),
      bookGrid: document.getElementById("bookGrid"),
      bookTable: document.getElementById("bookTable"),
      searchBar: document.getElementById("searchBar"),
      toggleViewBtn: document.getElementById("toggleViewBtn"),
      toggleFormBtn: document.getElementById("toggleFormBtn"),
      bookForm: document.getElementById("bookForm"),
      bookFormSection: document.getElementById("bookFormSection"),
      infiniteScrollTrigger: document.getElementById("infiniteScrollTrigger"),
      confirmModal: document.getElementById("confirmModal"),
      confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
      cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
      emptyState: document.getElementById("emptyState"),
      toast: document.getElementById("toast"),
      
      // Stats elements
      totalBooks: document.getElementById("totalBooks"),
      readBooks: document.getElementById("readBooks"),
      currentlyReading: document.getElementById("currentlyReading"),
      totalPages: document.getElementById("totalPages")
    };
  }

  // Bind event listeners
  bindEvents() {
    // Form submission
    this.elements.bookForm.addEventListener("submit", (e) => this.handleFormSubmit(e));
    
    // Search functionality
    this.elements.searchBar.addEventListener("input", (e) => this.handleSearch(e));
    
    // View toggle
    this.elements.toggleViewBtn.addEventListener("click", () => this.toggleView());
    
    // Form toggle
    if (this.elements.toggleFormBtn) {
      this.elements.toggleFormBtn.addEventListener("click", () => this.toggleForm());
    }
    
    // Modal events
    this.elements.confirmDeleteBtn.addEventListener("click", () => this.confirmDelete());
    this.elements.cancelDeleteBtn.addEventListener("click", () => this.cancelDelete());
    
    // Click outside modal to close
    this.elements.confirmModal.addEventListener("click", (e) => {
      if (e.target === this.elements.confirmModal || e.target.classList.contains('modal-overlay')) {
        this.cancelDelete();
      }
    });
    
    // Table sorting
    this.elements.bookTable.addEventListener("click", (e) => this.handleTableSort(e));
    
    // Infinite scroll
    this.setupInfiniteScroll();
    
    // Form field validations
    this.setupFormValidation();
  }

  // Load books from localStorage
  loadBooks() {
    try {
      const stored = localStorage.getItem("books");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading books:", error);
      this.showToast("Error loading saved books", "error");
      return [];
    }
  }

  // Save books to localStorage
  saveBooks() {
    try {
      localStorage.setItem("books", JSON.stringify(this.books));
    } catch (error) {
      console.error("Error saving books:", error);
      this.showToast("Error saving books", "error");
    }
  }

  // Handle form submission
  handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(this.elements.bookForm);
    const book = {
      title: formData.get("title")?.trim() || "",
      author: formData.get("author")?.trim() || "",
      series: formData.get("series")?.trim() || "",
      bookNumber: formData.get("bookNumber") || "",
      genre: formData.get("genre")?.trim() || "",
      tags: formData.get("tags")?.trim() || "",
      pages: parseInt(formData.get("pages")) || 0,
      progress: parseInt(formData.get("progress")) || 0,
      startDate: formData.get("startDate") || "",
      finishDate: formData.get("finishDate") || "",
      status: formData.get("status") || "To Read",
      rating: formData.get("rating") || "",
      notes: formData.get("notes")?.trim() || "",
      coverUrl: formData.get("coverUrl")?.trim() || "",
      dateAdded: new Date().toLocaleDateString()
    };

    // Validation
    if (!book.title || !book.author) {
      this.showToast("Title and Author are required", "error");
      return;
    }

    // Ensure progress doesn't exceed pages
    if (book.pages && book.progress > book.pages) {
      book.progress = book.pages;
    }

    // Auto-update status based on progress
    if (book.pages && book.progress === book.pages && book.progress > 0) {
      book.status = "Finished";
    } else if (book.progress > 0) {
      book.status = "Reading";
    }

    this.addBook(book);
    this.elements.bookForm.reset();
    this.showToast(`"${book.title}" added successfully!`, "success");
  }

  // Add book to collection
  addBook(book) {
    this.books.unshift(book); // Add to beginning for newest first
    this.saveBooks();
    this.filteredBooks = [...this.books];
    this.render();
  }

  // Handle search
  handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
      this.filteredBooks = [...this.books];
    } else {
      this.filteredBooks = this.books.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.tags && book.tags.toLowerCase().includes(query)) ||
        (book.genre && book.genre.toLowerCase().includes(query)) ||
        (book.series && book.series.toLowerCase().includes(query))
      );
    }
    
    this.render();
  }

  // Toggle between table and grid view
  toggleView() {
    this.isGridView = !this.isGridView;
    
    if (this.isGridView) {
      this.elements.bookTable.classList.add("hidden");
      this.elements.bookGrid.classList.remove("hidden");
      this.elements.toggleViewBtn.innerHTML = '<i class="fas fa-table"></i><span>Table View</span>';
    } else {
      this.elements.bookTable.classList.remove("hidden");
      this.elements.bookGrid.classList.add("hidden");
      this.elements.toggleViewBtn.innerHTML = '<i class="fas fa-th-large"></i><span>Grid View</span>';
    }
    
    this.render();
  }

  // Toggle form visibility
  toggleForm() {
    const form = this.elements.bookForm;
    const icon = this.elements.toggleFormBtn.querySelector('i');
    
    if (form.style.display === 'none') {
      form.style.display = 'block';
      icon.className = 'fas fa-chevron-up';
    } else {
      form.style.display = 'none';
      icon.className = 'fas fa-chevron-down';
    }
  }

  // Handle table sorting
  handleTableSort(e) {
    const th = e.target.closest('th[data-sort]');
    if (!th || !th.classList.contains('sortable')) return;
    
    const field = th.dataset.sort;
    
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.sortBooks();
    this.render();
    this.updateSortIcons();
  }

  // Sort books
  sortBooks() {
    this.filteredBooks.sort((a, b) => {
      let aVal = a[this.sortField] || '';
      let bVal = b[this.sortField] || '';
      
      // Handle different data types
      if (this.sortField === 'rating' || this.sortField === 'pages') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else if (this.sortField === 'dateAdded') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }
      
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Update sort icons
  updateSortIcons() {
    const headers = this.elements.bookTable.querySelectorAll('th.sortable i');
    headers.forEach(icon => {
      icon.className = 'fas fa-sort';
    });
    
    if (this.sortField) {
      const activeHeader = this.elements.bookTable.querySelector(`th[data-sort="${this.sortField}"] i`);
      if (activeHeader) {
        activeHeader.className = this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
      }
    }
  }

  // Setup infinite scroll
  setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.visibleCount < this.filteredBooks.length) {
        this.renderNextBatch();
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    observer.observe(this.elements.infiniteScrollTrigger);
  }

  // Setup form validation
  setupFormValidation() {
    const progressInput = document.getElementById('progress');
    const pagesInput = document.getElementById('pages');
    
    progressInput?.addEventListener('input', () => {
      const pages = parseInt(pagesInput.value) || 0;
      const progress = parseInt(progressInput.value) || 0;
      
      if (pages && progress > pages) {
        progressInput.value = pages;
      }
    });
  }

  // Render book
  renderBook(book, index) {
    const tags = book.tags ? book.tags.split(",").map(t => t.trim()).filter(t => t) : [];
    const cover = book.coverUrl || "https://via.placeholder.com/100x150/e2e8f0/64748b?text=No+Cover";
    const progress = book.progress && book.pages
      ? Math.min(100, Math.round((+book.progress / +book.pages) * 100))
      : 0;

    const tagHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join(" ");
    const statusClass = book.status.replace(/\s+/g, '-');
    const ratingStars = book.rating ? '⭐'.repeat(parseInt(book.rating)) : '';

    if (!this.isGridView) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><img src="${cover}" alt="${book.title} cover" onerror="this.src='https://via.placeholder.com/100x150/e2e8f0/64748b?text=No+Cover'"></td>
        <td><strong>${book.title}</strong></td>
        <td>${book.author}</td>
        <td>${book.series ? `${book.series} ${book.bookNumber ? `#${book.bookNumber}` : ''}` : ''}</td>
        <td><span class="status-badge status-${statusClass}">${book.status}</span></td>
        <td>${ratingStars}</td>
        <td>${book.pages || '-'}</td>
        <td>
          ${book.progress || 0}${book.pages ? `/${book.pages}` : ''}
          <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
        </td>
        <td>${tagHtml}</td>
        <td>${book.dateAdded || ''}</td>
        <td>
          <button class="delete-btn" onclick="bookTrackr.deleteBook(${this.books.indexOf(book)})" title="Delete book">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      this.elements.bookTableBody.appendChild(row);
    } else {
      const card = document.createElement("div");
      card.className = "book-card";
      card.innerHTML = `
        <div class="book-actions">
          <button class="delete-btn" onclick="bookTrackr.deleteBook(${this.books.indexOf(book)})" title="Delete book">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <img src="${cover}" alt="${book.title} cover" onerror="this.src='https://via.placeholder.com/120x160/e2e8f0/64748b?text=No+Cover'">
        <h3>${book.title}</h3>
        <p><strong>${book.author}</strong></p>
        ${book.series ? `<p>${book.series} ${book.bookNumber ? `#${book.bookNumber}` : ''}</p>` : ''}
        <p><span class="status-badge status-${statusClass}">${book.status}</span></p>
        ${book.rating ? `<p>${ratingStars}</p>` : ''}
        <p>${book.progress || 0}${book.pages ? `/${book.pages} pages` : ''}</p>
        <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
        <div style="margin-top: 0.5rem;">${tagHtml}</div>
      `;
      this.elements.bookGrid.appendChild(card);
    }
  }

  // Render next batch
  renderNextBatch() {
    const nextBooks = this.filteredBooks.slice(this.visibleCount, this.visibleCount + this.batchSize);
    nextBooks.forEach((book) => {
      this.renderBook(book);
    });
    this.visibleCount += nextBooks.length;
  }

  // Clear displayed books
  clearBooks() {
    this.elements.bookTableBody.innerHTML = "";
    this.elements.bookGrid.innerHTML = "";
    this.visibleCount = 0;
  }

  // Main render function
  render() {
    this.clearBooks();
    this.updateStats();
    
    if (this.filteredBooks.length === 0) {
      this.elements.emptyState.classList.remove("hidden");
      this.elements.infiniteScrollTrigger.style.display = "none";
    } else {
      this.elements.emptyState.classList.add("hidden");
      this.elements.infiniteScrollTrigger.style.display = "flex";
      this.renderNextBatch();
    }
  }

  // Update statistics
  updateStats() {
    const totalBooks = this.books.length;
    const readBooks = this.books.filter(book => book.status === 'Finished').length;
    const currentlyReading = this.books.filter(book => book.status === 'Reading').length;
    const totalPages = this.books.reduce((sum, book) => {
      const pages = book.status === 'Finished' ? (book.pages || 0) : (book.progress || 0);
      return sum + pages;
    }, 0);

    if (this.elements.totalBooks) this.elements.totalBooks.textContent = totalBooks;
    if (this.elements.readBooks) this.elements.readBooks.textContent = readBooks;
    if (this.elements.currentlyReading) this.elements.currentlyReading.textContent = currentlyReading;
    if (this.elements.totalPages) this.elements.totalPages.textContent = totalPages.toLocaleString();
  }

  // Delete book
  deleteBook(index) {
    const bookIndex = this.books.findIndex((_, i) => i === index);
    if (bookIndex === -1) return;
    
    this.deleteIndex = bookIndex;
    this.elements.confirmModal.classList.remove("hidden");
  }

  // Confirm delete
  confirmDelete() {
    if (this.deleteIndex !== null && this.deleteIndex < this.books.length) {
      const deletedBook = this.books[this.deleteIndex];
      this.books.splice(this.deleteIndex, 1);
      this.saveBooks();
      this.filteredBooks = [...this.books];
      this.render();
      this.showToast(`"${deletedBook.title}" deleted successfully`, "success");
    }
    this.cancelDelete();
  }

  // Cancel delete
  cancelDelete() {
    this.deleteIndex = null;
    this.elements.confirmModal.classList.add("hidden");
  }

  // Show toast notification
  showToast(message, type = "success") {
    const toast = this.elements.toast;
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    // Set content
    messageEl.textContent = message;
    
    // Set type and icon
    toast.className = `toast ${type}`;
    if (type === "success") {
      icon.className = "toast-icon fas fa-check-circle";
    } else if (type === "error") {
      icon.className = "toast-icon fas fa-exclamation-circle";
    }
    
    // Show toast
    toast.classList.remove("hidden");
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.bookTrackr = new BookTrackr();
});

// Global functions for onclick handlers
function deleteBook(index) {
  window.bookTrackr.deleteBook(index);
}
