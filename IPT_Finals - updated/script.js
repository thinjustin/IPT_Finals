let currentIndex = 0;
let booksData = [];

function handleCredentialResponse(response) {
    const data = parseJwt(response.credential);

    // Save login info
    localStorage.setItem('access_token', response.credential);
    localStorage.setItem('username', data.name);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userPicture', data.picture);

    // Update UI
    document.getElementById('welcomeMessage').textContent = `Welcome, ${data.name}!`;
    document.getElementById('userEmail').textContent = data.email;
    document.getElementById('userPicture').src = data.picture;
    document.getElementById('userSection').style.display = 'block';

    document.querySelector('.g_id_signin').style.display = 'none';
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
}

function logout() {
    localStorage.clear();
    location.reload();
}

async function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();
    const year = document.getElementById('yearInput').value.trim();
    const limit = document.getElementById('limitSelect').value;

    if (!query) {
        alert('Please enter a book title.');
        return;
    }

    // Show progress bar
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'block';

    let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        booksData = data.docs || [];

        if (year !== '') {
            booksData = booksData.filter(book => {
                return book.first_publish_year && book.first_publish_year >= parseInt(year);
            });
        }

        displayBooks(booksData.slice(0, limit));
    } catch (error) {
        console.error('Error fetching books:', error);
        alert('Failed to fetch books. Please try again.');
    } finally {
        // Hide progress bar when done (whether success or error)
        progressBar.style.display = 'none';
    }
}

function displayBooks(books) {
    const container = document.getElementById('booksContainer');
    container.innerHTML = '';

    if (books.length === 0) {
        container.innerHTML = '<p>No books found.</p>';
        return;
    }

    // Create carousel elements
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-btn prev';
    prevBtn.innerHTML = '&lt;';
    prevBtn.onclick = () => moveCarousel(-1);
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-btn next';
    nextBtn.innerHTML = '&gt;';
    nextBtn.onclick = () => moveCarousel(1);

    // Create book cards
    books.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-card';

        const title = book.title || 'No Title';
        const author = (book.author_name && book.author_name.slice(0, 2).join(', ')) || 'Unknown Author';
        const imgSrc = book.cover_i ? 
            `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` :
            'https://via.placeholder.com/150x200?text=No+Cover';

        div.innerHTML = `
            <img src="${imgSrc}" alt="Book Cover">
            <h3>${title}</h3>
            <p>${author}</p>
            <button class="bookmark-btn" onclick='bookmarkBook(${JSON.stringify(book)})'>Bookmark</button>
        `;

        carouselContainer.appendChild(div);
    });

    carousel.appendChild(prevBtn);
    carousel.appendChild(carouselContainer);
    carousel.appendChild(nextBtn);
    container.appendChild(carousel);
    
    // Reset index
    currentIndex = 0;
    updateCarouselPosition();
}

function moveCarousel(direction) {
    const container = document.querySelector('.carousel-container');
    const bookCards = document.querySelectorAll('.book-card');
    if (bookCards.length === 0) return;
    
    const card = bookCards[0];
    const cardStyle = window.getComputedStyle(card);
    const cardWidth = card.offsetWidth + 
                     parseInt(cardStyle.marginLeft) + 
                     parseInt(cardStyle.marginRight);
    
    const carousel = document.querySelector('.carousel');
    const visibleCards = Math.floor(carousel.offsetWidth / cardWidth);
    
    currentIndex += direction * visibleCards;
    
    // Boundary checks
    if (currentIndex < 0) currentIndex = 0;
    const maxIndex = Math.max(0, bookCards.length - visibleCards);
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    
    updateCarouselPosition();
}

function updateCarouselPosition() {
    const container = document.querySelector('.carousel-container');
    const bookCards = document.querySelectorAll('.book-card');
    if (!bookCards.length) return;
    
    const cardWidth = bookCards[0].offsetWidth + 20; // width + gap
    container.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
}

function bookmarkBook(book) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('You must be logged in to bookmark a book.');
        return;
    }

    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    bookmarks.push(book);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    alert('Book bookmarked successfully!');
}

function viewBookmarks() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    booksData = bookmarks;
    displayBooks(bookmarks);
}

document.addEventListener('DOMContentLoaded', () => {
    loadDefaultBooks();
});

function loadDefaultBooks() {
    const defaultQuery = "bestsellers";
    const limit = 10;

    // Show progress bar
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'block';

    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(defaultQuery)}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            booksData = data.docs || [];
            displayBooks(booksData.slice(0, limit));
        })
        .catch(error => {
            console.error('Error loading default books:', error);
        })
        .finally(() => {
            // Hide progress bar when done
            progressBar.style.display = 'none';
        });
}

$(".chosen-select").chosen({
    no_results_text: "Oops, nothing found!"
  })