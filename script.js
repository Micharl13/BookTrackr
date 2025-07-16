const form = document.getElementById('book-form');
const bookList = document.getElementById('book-list');
const filterStatus = document.getElementById('filter-status');

let books = JSON.parse(localStorage.getItem('books')) || [];

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
        <button class="delete-btn" onclick="deleteBook(${index})">Delete</button>
      </div>
    `;
    bookList.appendChild(bookEl);
  });
}

function addBook(e) {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const status = document.getElementById('status').value;
  const rating = document.getElementById('rating').value;
  const notes = document.getElementById('notes').value.trim();

  const newBook = { title, author, status, rating, notes };
  books.push(newBook);
  localStorage.setItem('books', JSON.stringify(books));
  renderBooks(filterStatus.value);
  form.reset();
}

function deleteBook(index) {
  books.splice(index, 1);
  localStorage.setItem('books', JSON.stringify(books));
  renderBooks(filterStatus.value);
}

form.addEventListener('submit', addBook);
filterStatus.addEventListener('change', () => renderBooks(filterStatus.value));

// Initial render
renderBooks();
