let books = [];
let games = [];
let editingBookIndex = null;
let editingGameIndex = null;

document.addEventListener('DOMContentLoaded', () => {
  try {
      books = JSON.parse(localStorage.getItem('books')) || [];
  } catch (error) {
      console.error('Error parsing books from localStorage:', error);
  }
  
  try {
      games = JSON.parse(localStorage.getItem('games')) || [];
  } catch (error) {
      console.error('Error parsing games from localStorage:', error);
  }
  
  books = books.map((book) => {
      if (!book.id) {
          return { ...book, id: generateUniqueId() };
      }
      return book;
  });
  
  games = games.map((game) => {
      if (!game.id) {
          return { ...game, id: generateUniqueId() };
      }
      return game;
  });
  
  const themeToggle = document.querySelector('.theme-toggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});
    
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  
  populateGenreFilters();
  renderBooks();
  renderGames();
});

    function showSpinner() {
        console.log('Showing spinner');
        document.getElementById('loading-spinner').style.display = 'block';
    }
  
    function hideSpinner() {
        console.log('Hiding spinner');
        document.getElementById('loading-spinner').style.display = 'none';
    }
  
    function saveData() {
        showSpinner();
        try {
            localStorage.setItem('books', JSON.stringify(books));
            localStorage.setItem('games', JSON.stringify(games));
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            showNotification('Failed to save data. Please try again.');
        }
        hideSpinner(); 
    }
    
    function showNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => notification.classList.add('show'), 10);
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  
    window.editBook = function(index) {
      const book = books[index];
      document.getElementById('book-form-title').textContent = 'Edit Book';
      document.getElementById('book-title').value = book.title;
      document.getElementById('book-author').value = book.author;
      document.getElementById('book-genre').value = book.genre;
      document.getElementById('book-progress').value = book.progress;
      document.getElementById('progress-value').textContent = `${book.progress}%`;
      document.getElementById('book-image').value = book.imageUrl || '';
      
      editingBookIndex = index;
      showBookForm();
    };
  
    window.editGame = function(index) {
      editingGameIndex = index;
      const game = games[index];
      document.getElementById('game-form-title').textContent = 'Edit Game';
      document.getElementById('game-title').value = game.title;
      document.getElementById('game-genre').value = game.genre;
      document.getElementById('game-platform').value = game.platform;
      document.getElementById('game-progress').value = game.progress;
      document.getElementById('game-progress-value').textContent = `${game.progress}%`;
      document.getElementById('game-image').value = game.imageUrl || '';
      
      showGameForm();
    };
  
    window.finishBook = function(index) {
      books[index].status = 'finished';
      books[index].progress = 100;
      saveData();
      renderBooks();
      showNotification('Book marked as finished!');
    };
    
    window.completeGame = function(index) {
      games[index].status = 'completed';
      games[index].progress = 100;
      saveData();
      renderGames();
      showNotification('Game marked as completed!');
    };
  
    document.querySelectorAll('.filter-option').forEach(option => {
      option.addEventListener('click', () => {
        document.getElementById('genre-select').value = option.value;
        renderGames();
      });
    });
    
    function populateGenreFilters() {
      const genres = new Set();
      games.forEach(game => genres.add(game.genre));
      
      const filterContainer = document.getElementById('genre-filters');
      filterContainer.innerHTML = '';
      
      const allButton = document.createElement('button');
      allButton.className = 'filter-option active-filter';
      allButton.value = 'all';
      allButton.textContent = 'All Genres';
      allButton.addEventListener('click', handleFilterClick);
      filterContainer.appendChild(allButton);
      
      genres.forEach(genre => {
        if (genre) {
          const button = document.createElement('button');
          button.className = 'filter-option';
          button.value = genre;
          button.textContent = genre;
          button.addEventListener('click', handleFilterClick);
          filterContainer.appendChild(button);
        }
      });
    }
    
    function handleFilterClick(e) {
      document.querySelectorAll('.filter-option').forEach(btn => {
        btn.classList.remove('active-filter');
      });
      e.target.classList.add('active-filter');
      document.getElementById('genre-select').value = e.target.value;
      renderGames();
    }
  
    document.getElementById('search-input').addEventListener('input', debounce(function() {
      const searchTerm = this.value.toLowerCase();
      
      if (document.querySelector('.tab.active').getAttribute('data-tab') === 'books-content') {
        const filteredBooks = searchTerm ? 
          books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm) ||
            book.genre.toLowerCase().includes(searchTerm)
          ) : books;
        
        const readingBooks = filteredBooks.filter(book => book.status === 'reading');
        const finishedBooks = filteredBooks.filter(book => book.status === 'finished');
        
        document.getElementById('currently-reading').innerHTML = '<h2>Currently Reading</h2>';
        document.getElementById('finished-books').innerHTML = '<h2>Finished</h2>';
        
        if (readingBooks.length || finishedBooks.length) {
          const readingGrid = document.createElement('div');
          readingGrid.className = 'book-grid';
          
          readingBooks.forEach(book => {
            const bookIndex = books.indexOf(book);
            readingGrid.appendChild(createBookCard(book, bookIndex, true));
          });
          
          document.getElementById('currently-reading').appendChild(readingGrid);
          
          const finishedGrid = document.createElement('div');
          finishedGrid.className = 'book-grid';
          
          finishedBooks.forEach(book => {
            const bookIndex = books.indexOf(book);
            finishedGrid.appendChild(createBookCard(book, bookIndex, false));
          });
          
          document.getElementById('finished-books').appendChild(finishedGrid);
        } else if (searchTerm) {
          const noResults = document.createElement('div');
          noResults.className = 'empty-state';
          noResults.innerHTML = `
            <div class="empty-icon">🔍</div>
            <p>No books match your search for "${searchTerm}"</p>
          `;
          document.getElementById('currently-reading').appendChild(noResults);
        } else {
          renderBooks();
        }
      } else {
        const filteredGames = searchTerm ? 
          games.filter(game => 
            game.title.toLowerCase().includes(searchTerm) || 
            game.genre.toLowerCase().includes(searchTerm) ||
            game.platform.toLowerCase().includes(searchTerm)
          ) : games;
        
        const playingGames = filteredGames.filter(game => game.status === 'playing');
        const completedGames = filteredGames.filter(game => game.status === 'completed');
        
        document.getElementById('currently-playing').innerHTML = '<h2>Currently Playing</h2>';
        document.getElementById('completed-games').innerHTML = '<h2>Completed</h2>';
        
        if (playingGames.length || completedGames.length) {
          const playingGrid = document.createElement('div');
          playingGrid.className = 'game-grid';
          
          playingGames.forEach(game => {
            const gameIndex = games.indexOf(game);
            playingGrid.appendChild(createGameCard(game, gameIndex, true));
          });
          
          document.getElementById('currently-playing').appendChild(playingGrid);
          
          const completedGrid = document.createElement('div');
          completedGrid.className = 'game-grid';
          
          completedGames.forEach(game => {
            const gameIndex = games.indexOf(game);
            completedGrid.appendChild(createGameCard(game, gameIndex, false));
          });
          
          document.getElementById('completed-games').appendChild(completedGrid);
        } else if (searchTerm) {
          const noResults = document.createElement('div');
          noResults.className = 'empty-state';
          noResults.innerHTML = `
            <div class="empty-icon">🔍</div>
            <p>No games match your search for "${searchTerm}"</p>
          `;
          document.getElementById('currently-playing').appendChild(noResults);
        } else {
          renderGames();
        }
      }
    }, 300));
  
    function debounce(func, wait = 200) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    }
  
    document.getElementById('modal-overlay').addEventListener('click', function(e) {
      if (e.target === this) {
        closeBookForm();
        closeGameForm();
      }
    });
  
    populateGenreFilters();
    renderBooks();
    renderGames();
  
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        contents.forEach(content => {
          if (content.id === tab.getAttribute('data-tab')) {
            content.classList.remove('hidden');
            setTimeout(() => content.classList.add('fade-in'), 50);
          } else {
            content.classList.remove('fade-in');
            content.classList.add('hidden');
          }
        });
      });
    });
  
    function renderBooks() {
        showSpinner(); 
        try {
      const visibleItems = calculateVisibleItems();
      const currentlyReading = books.filter(book => book.status === 'reading');
      const finishedBooks = books.filter(book => book.status === 'finished');
      
      const readingContainer = document.getElementById('currently-reading');
      readingContainer.innerHTML = '<h2>Currently Reading</h2>';
      
      const readingGrid = document.createElement('div');
      readingGrid.className = 'book-grid';
      
      if (currentlyReading.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
          <div class="empty-icon">📚</div>
          <p>You're not reading any books yet. Click "Add Book" to get started!</p>
        `;
        readingContainer.appendChild(emptyState);
      } else {
        currentlyReading.forEach((book, index) => {
          const bookIndex = books.indexOf(book);
          const bookCard = createBookCard(book, bookIndex, true);
          readingGrid.appendChild(bookCard);
        });
        readingContainer.appendChild(readingGrid);
      }
      
      const finishedContainer = document.getElementById('finished-books');
      finishedContainer.innerHTML = '<h2>Finished</h2>';
      
      const finishedGrid = document.createElement('div');
      finishedGrid.className = 'book-grid';
      
      if (finishedBooks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
          <div class="empty-icon">🏁</div>
          <p>You haven't finished any books yet. Keep reading!</p>
        `;
        finishedContainer.appendChild(emptyState);
      } else {
        finishedBooks.forEach((book, index) => {
          const bookIndex = books.indexOf(book);
          const bookCard = createBookCard(book, bookIndex, false);
          finishedGrid.appendChild(bookCard);
        });
        finishedContainer.appendChild(finishedGrid);
      } 
      document.getElementById('total-books').textContent = books.length;
      document.getElementById('reading-books').textContent = currentlyReading.length;
      document.getElementById('finished-books-count').textContent = finishedBooks.length;
    } catch (error) {
      console.error('Error rendering books:', error);
      showNotification('Failed to display books. Please try refreshing.');
    } finally {
        hideSpinner(); 
    }
  }
  
    function createBookCard(book, index, isReading) {
      const colorHue = getHueFromString(book.title);
      const card = document.createElement('div');
      card.className = 'book-card';
      
      let cardHTML = `
          <div class="book-cover" style="${book.imageUrl ? `background-image: url('${book.imageUrl}')` : `background-color: hsl(${colorHue}, 70%, 60%)`}">
              ${!book.imageUrl ? `<span class="book-initials">${getInitials(book.title)}</span>` : ''}
          </div>
          <h3>${escapeHTML(book.title)}</h3>
          <p>${escapeHTML(book.author)}</p>
          <p>${escapeHTML(book.genre)}</p>
          <div class="progress-bar">
              <div class="progress-fill" style="width: ${book.progress}%"></div>
          </div>
          <p>${book.progress}%</p>
      `;
      
      if (isReading) {
          cardHTML += `
              <button onclick="editBook(${index})"><i class="fas fa-edit"></i></button>
              <button onclick="finishBook(${index})"><i class="fas fa-check"></i></button>
              <button class="btn-delete" onclick="deleteBook('${book.id}')"><i class="fas fa-trash"></i></button>
          `;
      } else {
          cardHTML += `
              <div class="completed-badge"><span>✓ Completed</span></div>
              <button class="btn-delete" onclick="deleteBook('${book.id}')"><i class="fas fa-trash"></i></button>
          `;
      }
      
      card.innerHTML = cardHTML;
      return card;
  }
  
    function renderGames() {
        showSpinner();
      const genreFilter = document.getElementById('genre-select').value;
      let filteredGames = genreFilter === 'all' ? games : games.filter(game => game.genre === genreFilter);
      const currentlyPlaying = filteredGames.filter(game => game.status === 'playing');
      const completedGames = filteredGames.filter(game => game.status === 'completed');
      
      document.getElementById('total-games').textContent = games.length;
      document.getElementById('playing-games').textContent = currentlyPlaying.length;
      document.getElementById('completed-games-count').textContent = completedGames.length;
      
      const filterOptions = document.querySelectorAll('.filter-option');
      filterOptions.forEach(option => {
        option.value === genreFilter ? 
          option.classList.add('active-filter') : 
          option.classList.remove('active-filter');
      });
      
      const playingContainer = document.getElementById('currently-playing');
      playingContainer.innerHTML = '<h2>Currently Playing</h2>';
      
      const playingGrid = document.createElement('div');
      playingGrid.className = 'game-grid';
      
      if (currentlyPlaying.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
          <div class="empty-icon">🎮</div>
          <p>You're not playing any games yet. Click "Add Game" to get started!</p>
        `;
        playingContainer.appendChild(emptyState);
      } else {
        currentlyPlaying.forEach((game, index) => {
          const gameIndex = games.indexOf(game);
          const gameCard = createGameCard(game, gameIndex, true);
          playingGrid.appendChild(gameCard);
        });
        playingContainer.appendChild(playingGrid);
      }
      
      const completedContainer = document.getElementById('completed-games');
      completedContainer.innerHTML = '<h2>Completed</h2>';
      
      const completedGrid = document.createElement('div');
      completedGrid.className = 'game-grid';
      
      if (completedGames.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
          <div class="empty-icon">🏆</div>
          <p>You haven't completed any games yet. Keep playing!</p>
        `;
        completedContainer.appendChild(emptyState);
      } else {
        completedGames.forEach((game, index) => {
          const gameIndex = games.indexOf(game);
          const gameCard = createGameCard(game, gameIndex, false);
          completedGrid.appendChild(gameCard);
        });
        completedContainer.appendChild(completedGrid);
      }
        hideSpinner(); 
    }
  
    function createGameCard(game, index, isPlaying) {
      const colorHue = Math.abs(hashCode(game.title) % 360);
      const card = document.createElement('div');
      card.className = 'game-card';
  
      const imageStyle = game.imageUrl ? 
          `background-image: url('${escapeHTML(game.imageUrl)}')` : 
          `background-color: hsl(${colorHue}, 70%, 60%)`;
  
      let cardContent = `
          <div class="game-cover" style="${imageStyle}">
              ${!game.imageUrl ? `<span class="game-initials">${getInitials(game.title)}</span>` : ''}
          </div>
          <div class="game-details">
              <h3 class="game-title" title="${escapeHTML(game.title)}">${escapeHTML(game.title)}</h3>
              <p class="game-platform">${escapeHTML(game.platform)}</p>
              <p class="game-genre"><span class="genre-tag">${escapeHTML(game.genre)}</span></p>
      `;
  
      
      if (isPlaying) {
        cardContent += `
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${game.progress}%"></div>
            </div>
            <span class="progress-text">${game.progress}% Complete</span>
          </div>
          <div class="card-actions">
            <button class="btn-edit" onclick="editGame(${index})">Edit</button>
            <button class="btn-complete" onclick="completeGame(${index})">Mark Complete</button>
          </div>
          <button class="btn-delete" onclick="deleteGame('${game.id}')"><i class="fas fa-trash"></i></button>
        `;
      } else {
        cardContent += `
      <div class="completed-badge"><span>✓ Completed</span></div>
        <button class="btn-delete" onclick="deleteGame('${game.id}')"><i class="fas fa-trash"></i></button>
        `;
      }
      
      cardContent += `</div>`;
      card.innerHTML = cardContent;
      return card;
    }
  
    function getInitials(title) {
      return title
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
  
    function hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    }

    function getHueFromString(str) {
      return Math.abs(hashCode(str) % 360);
    }

    function handleScroll() {
      const scrollPosition = window.scrollY;
    }
  
    const bookForm = document.getElementById('book-form');
    
    function showBookForm() {
      document.getElementById('book-form').classList.add('show');
      document.getElementById('modal-overlay').classList.add('show');
      document.body.style.overflow = 'hidden'; 
    }
    
    function closeBookForm() {
      document.getElementById('book-form').classList.remove('show');
      document.getElementById('modal-overlay').classList.remove('show');
      document.body.style.overflow = ''; 
    }

    document.getElementById('add-book').addEventListener('click', showBookForm);
    
    const bookProgressSlider = document.getElementById('book-progress');
    const bookProgressValue = document.getElementById('progress-value');
    
    bookProgressSlider.addEventListener('input', () => {
      bookProgressValue.textContent = `${bookProgressSlider.value}%`;
    });
  
    function saveBook() {
      if (!validateForm('book-form')) {
        showNotification('Please fill in all required fields.');
        return;
      }
      
      const book = {
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        genre: document.getElementById('book-genre').value,
        progress: parseInt(document.getElementById('book-progress').value),
        status: 'reading',
        imageUrl: document.getElementById('book-image').value
      };
      
      try {
        if (editingBookIndex !== null) {
          book.id = books[editingBookIndex].id;
          books[editingBookIndex] = book;
          editingBookIndex = null;
        } else {
          book.id = generateUniqueId();
          books.push(book);
        }
        
        saveData();
        renderBooks();
        closeBookForm();
        showNotification('Book saved successfully!');
      } catch (error) {
        console.error('Error saving book:', error);
        showNotification('Failed to save book. Please try again.');
      }
    }

    function updateBookStatistics() {
      const totalBooks = books.length;
      const readingBooks = books.filter(book => book.status === 'reading').length;
      const finishedBooks = books.filter(book => book.status === 'finished').length;
      
      document.getElementById('total-books').textContent = totalBooks;
      document.getElementById('reading-books').textContent = readingBooks;
      document.getElementById('finished-books-count').textContent = finishedBooks;
  }
  
    document.getElementById('cancel-book').addEventListener('click', closeBookForm);
    
    document.getElementById('book-title').addEventListener('input', (e) => {
      const group = e.target.closest('.form-group');
      group.classList.toggle('error', !e.target.value);
      if (e.target.value) {
        showSuccessMessage(group);
      }
    });
  
    function showSuccessMessage(element) {
      element.classList.add('success');
      setTimeout(() => element.classList.remove('success'), 2000);
    }
  
    const gameForm = document.getElementById('game-form');
    
    function showGameForm() {
      document.getElementById('game-form').classList.add('show');
      document.getElementById('modal-overlay').classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    
    function closeGameForm() {
      document.getElementById('game-form').classList.remove('show');
      document.getElementById('modal-overlay').classList.remove('show');
      document.body.style.overflow = '';
    }

    document.getElementById('add-game').addEventListener('click', showGameForm);
    
    const gameProgressSlider = document.getElementById('game-progress');
    const gameProgressValue = document.getElementById('game-progress-value');
    
    gameProgressSlider.addEventListener('input', () => {
      gameProgressValue.textContent = `${gameProgressSlider.value}%`;
    });
  
    function saveGame() {
        const gameTitle = document.getElementById('game-title').value;
        const gameGenre = document.getElementById('game-genre').value;
        const gamePlatform = document.getElementById('game-platform').value;
        
        if (!gameTitle || !gameGenre || !gamePlatform) {
            validateForm('game-form');
            showNotification('Please fill in all required fields.');
            return;
        }
        
        const game = {
            title: gameTitle,
            genre: gameGenre,
            platform: gamePlatform,
            progress: parseInt(document.getElementById('game-progress').value),
            status: 'playing',
            imageUrl: document.getElementById('game-image').value
        };
        
        if (editingGameIndex !== null) {
            game.id = games[editingGameIndex].id;
            games[editingGameIndex] = game;
            editingGameIndex = null;
        } else {
            game.id = generateUniqueId();
            games.push(game);
        }
        
        saveData();
        renderGames();
        closeGameForm();
        showNotification('Game saved successfully!');
    }
  
    document.getElementById('cancel-game').addEventListener('click', closeGameForm);
    
    document.getElementById('save-game').addEventListener('click', saveGame);
  
    function moveItemToSection(itemElement, newSection) {
      itemElement.style.opacity = '0';
      itemElement.style.transform = 'translateY(20px)';
      setTimeout(() => {
        newSection.appendChild(itemElement);
        itemElement.style.opacity = '1';
        itemElement.style.transform = 'translateY(0)';
      }, 300);
    }

    window.addEventListener('scroll', throttle(handleScroll, 100));

    function calculateVisibleItems() {
      return books; 
    }

    function throttle(func, limit) {
      let lastFunc;
      let lastRan;
      return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
          func.apply(context, args);
          lastRan = Date.now();
        } else {
          clearTimeout(lastFunc);
          lastFunc = setTimeout(function() {
            if ((Date.now() - lastRan) >= limit) {
              func.apply(context, args);
              lastRan = Date.now();
            }
          }, limit - (Date.now() - lastRan));
        }
      };
    }

    function updateGenreFilters() {
      if (window.innerWidth < 768) {
        document.getElementById('genre-select').classList.remove('hidden');
        document.getElementById('genre-filters').classList.add('hidden');
      } else {
        document.getElementById('genre-select').classList.add('hidden');
        document.getElementById('genre-filters').classList.remove('hidden');
      }
    }

    window.addEventListener('resize', debounce(updateGenreFilters, 100));

    function createWindow() {
      if (window.require && typeof window.require === 'function') {
          try {
              const { BrowserWindow } = window.require('electron');
              const savedState = localStorage.getItem('window-state');
              const { width, height } = savedState ? JSON.parse(savedState) : { width: 800, height: 600 };
              const win = new BrowserWindow({ width, height });
              
              win.on('resize', debounce(() => {
                  localStorage.setItem('window-state', JSON.stringify(win.getBounds()));
              }, 500));
          } catch (e) {
              console.error('Not running in Electron environment:', e);
          }
      }
  }

  window.deleteBook = function(id) {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
          books.splice(index, 1);
          saveData();
          renderBooks();
          showNotification('Book deleted successfully!');
        } else {
          console.error('Book not found with ID:', id);
          showNotification('Error: Book not found');
        }
      } catch (error) {
        console.error('Error deleting book:', error);
        showNotification('Failed to delete book. Please try again.');
      }
    }
  };
    
  window.deleteGame = function(id) {
    if (confirm('Are you sure you want to delete this game?')) {
        try {
            const index = games.findIndex(g => g.id === id);
            if (index !== -1) {
                games.splice(index, 1);
                saveData();
                renderGames();
                showNotification('Game deleted successfully!');
            } else {
                console.error('Game not found with ID:', id);
                showNotification('Error: Game not found');
            }
        } catch (error) {
            console.error('Error deleting game:', error);
            showNotification('Failed to delete game. Please try again.');
        }
    }
};

    window.searchTitle = function(inputId, baseUrl) {
      const input = document.getElementById(inputId);
      if (input) {
        const title = input.value.trim();
        if (title) {
          window.open(`${baseUrl}${encodeURIComponent(title)}`, '_blank');
        }
      }
    };
    
    // Usage
    window.searchBookTitle = () => window.searchTitle('book-title', 'https://www.goodreads.com/search?q=');
    window.searchGameTitle = () => window.searchTitle('game-title', 'https://store.steampowered.com/search/?term=');


    function validateForm(formId) {
      const form = document.getElementById(formId);
      const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="file"]), select');
      let isValid = true;
  
      inputs.forEach(input => {
          const group = input.closest('.form-group');
          if (input.hasAttribute('required') && !input.value) {
              isValid = false;
              if (group) group.classList.add('error');
          } else {
              if (group) group.classList.remove('error');
          }
      });
      return isValid;
  }

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;');
    }

    document.getElementById('save-book').addEventListener('click', saveBook);

    document.getElementById('search-book-btn').addEventListener('click', function() {
      window.searchBookTitle();
    });

    document.getElementById('search-game-btn').addEventListener('click', function() {
      window.searchGameTitle();
    });

    function generateUniqueId() {
        return 'id-' + Math.random().toString(36).substr(2, 16);
    }
    ;