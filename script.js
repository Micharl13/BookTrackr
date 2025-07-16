const form = document.getElementById('book-form');
const bookList = document.getElementById('book-list');
const filterStatus = document.getElementById('filter-status');
const cancelEditBtn = document.getElementById('cancel-edit');
const undoMessage = document.getElementById('undo-message');
const undoBtn = document.getElementById('undo-btn');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

let books = JSON.parse(localStorage.getItem('books')) || [];
let editingIndex = null;
let lastDeletedBook = null;
let lastDeletedIndex = null;
let undoTimeout = null;

function renderBooks(filter = 'All') {
  bookList.innerHTML = '';
  const filtered = filter === 'All' ? books : books.filter(book => book.status === filter);

  filtered.forEach((book, index) => {
    const bookEl = document.createElement('div');
    bookEl.className = 'book';
    bookEl.innerHTML = `
      <h3>${book.title}</h3>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Status:</strong> ${book.status}</p>
      ${book.rating ? `<p><strong>Rating:</strong> ${book.rating} ⭐️</p>` : ''}
      ${book.notes ? `<p><strong>Notes:</strong> ${book.notes}</p>` : ''}
      <div class="actions">
        <button class="edit-btn" onclick="editBook(${index})">Edit</button>
        <button class="delete-btn" onclick="deleteBook(${index})">Delete</button>
      </div>
    `;
    bookList.appendChild(bookEl);
  });
}

function addOrUpdateBook(e) {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const status = document.getElementById('status').value;
  const rating = document.getElementById('rating').value;
  const notes = document.getElementById('notes').value.trim();

  const newBook = { title, author, status, rating, notes };

  if (editingIndex === null) {
    books.push(newBook);
  } else {
    books[editingIndex] = newBook;
    editingIndex = null;
    form.querySelector('button[type="submit"]').textContent = 'Add Book';
    cancelEditBtn.classList.add('hidden');
  }

  localStorage.setItem('books', JSON.stringify(books));
  renderBooks(filterStatus.value);
  form.reset();
}

function deleteBook(index) {
  const confirmDelete = confirm('Are you sure you want to delete this book?');
  if (!confirmDelete) return;

  lastDeletedBook = books[index];
  lastDeletedIndex = index;
  books.splice(index, 1);
  localStorage.setItem('books', JSON.stringify(books));
  renderBooks(filterStatus.value);

  undoMessage.classList.remove('hidden');
  clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => {
    lastDeletedBook = null;
    lastDeletedIndex = null;
    undoMessage.classList.add('hidden');
  }, 5000);
}

function undoDelete() {
  if (lastDeletedBook !== null && lastDeletedIndex !== null) {
    books.splice(lastDeletedIndex, 0, lastDeletedBook);
    localStorage.setItem('books', JSON.stringify(books));
    renderBooks(filterStatus.value);
    lastDeletedBook = null;
    lastDeletedIndex = null;
    undoMessage.classList.add('hidden');
    clearTimeout(undoTimeout);
  }
}

function editBook(index) {
  const book = books[index];
  document.getElementById('title').value = book.title;
  document.getElementById('author').value = book.author;
  document.getElementById('status').value = book.status;
  document.getElementById('rating').value = book.rating;
  document.getElementById('notes').value = book.notes;

  editingIndex = index;
  form.querySelector('button[type="submit"]').textContent = 'Update Book';
  cancelEditBtn.classList.remove('hidden');
}

function cancelEditing() {
  editingIndex = null;
  form.reset();
  form.querySelector('button[type="submit"]').textContent = 'Add Book';
  cancelEditBtn.classList.add('hidden');
}

function exportBooks() {
  const dataStr = JSON.stringify(books, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'booktrackr_export.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function importBooks(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedBooks = JSON.parse(e.target.result);
      if (Array.isArray(importedBooks)) {
        books = importedBooks;
        localStorage.setItem('books', JSON.stringify(books));
        renderBooks(filterStatus.value);
      } else {
        alert('Invalid file format.');
      }
    } catch (err) {
      alert('Error reading file.');
    }
  };
  reader.readAsText(file);
}

form.addEventListener('submit', addOrUpdateBook);
cancelEditBtn.addEventListener('click', cancelEditing);
filterStatus.addEventListener('change', () => renderBooks(filterStatus.value));
undoBtn.addEventListener('click', undoDelete);
exportBtn.addEventListener('click', exportBooks);
importFile.addEventListener('change', importBooks);

// Initial render
renderBooks();
