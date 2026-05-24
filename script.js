const apiKey = 'ab8794e7c81c4bd1bf8bb17efc947901';
const pageSize = 5;
let currentQuery = '';
let currentLanguage = 'en';

const languageLabels = {
    en: 'English',
    hi: 'Hindi',
    te: 'Telugu',
};

const uiStrings = {
    en: {
        searchPlaceholder: 'Search news...',
        searchButton: 'Search',
        refreshButton: 'Refresh',
        trendingLabel: 'Trending now:',
        latestHeading: 'Latest headlines',
        infoText: 'Use the search box to filter stories, or refresh to reload the latest news.',
    },
    hi: {
        searchPlaceholder: 'समाचार खोजें...',
        searchButton: 'खोजें',
        refreshButton: 'ताज़ा करें',
        trendingLabel: 'रुझान:',
        latestHeading: 'ताज़ा शीर्षक',
        infoText: 'कहानियों को फ़िल्टर करने के लिए खोज बॉक्स का उपयोग करें, या नवीनतम समाचार फिर से लोड करने के लिए रिफ्रेश करें।',
    },
    te: {
        searchPlaceholder: 'వార్తలను శోధించండి...',
        searchButton: 'శోధించు',
        refreshButton: 'రిద్దు',
        trendingLabel: 'ప్రవృత్తిలో:',
        latestHeading: 'తాజా శీర్షికలు',
        infoText: 'కథలను ఫిల్టర్ చేయడానికి సెర్చ్ బాక్స్ ఉపయోగించండి లేదా తాజా వార్తలను తిరిగి లోడ్ చేయడానికి రిఫ్రెష్ చేయండి.',
    },
};

const categoryDefinitions = {
    education: { query: 'education' },
    cricket: { query: 'cricket' },
    technology: { query: 'technology' },
    politics: { query: 'politics' },
    movies: { query: 'movies' },
    accidents: { query: 'accident OR crash OR emergency' },
    business: { query: 'business OR economy OR markets' },
    health: { query: 'health OR wellness OR medical' },
};

function buildEndpoint(query, language) {
    const baseQuery = query.trim() || 'latest';
    const encodedQuery = encodeURIComponent(baseQuery);
    const apiLanguage = language === 'te' ? 'en' : language;

    return `https://newsapi.org/v2/everything?q=${encodedQuery}&language=${apiLanguage}&pageSize=${pageSize}&apiKey=${apiKey}`;
}

function buildCategoryEndpoint(category, language) {
    const definition = categoryDefinitions[category] || categoryDefinitions.education;
    const encodedQuery = encodeURIComponent(definition.query);
    const apiLanguage = language === 'te' ? 'en' : language;
    return `https://newsapi.org/v2/everything?q=${encodedQuery}&language=${apiLanguage}&pageSize=${pageSize}&apiKey=${apiKey}`;
}

async function fetchNews(query = '') {
    currentQuery = query.trim();
    const endpoint = buildEndpoint(currentQuery, currentLanguage);

    const container = document.getElementById('news-container');
    container.innerHTML = '<p class="loading-message">Loading latest headlines...</p>';

    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok || data.status === 'error') {
            const message = data.message || 'Unable to load news.';
            console.error('NewsAPI error:', message);
            container.innerHTML = `
                <p class="loading-message">Could not load news: <strong>${message}</strong></p>
                <p class="loading-message">If you are opening this page from a file URL, run it from localhost instead using Live Server or <code>python -m http.server</code>.</p>
            `;
            return;
        }

        if (!data.articles || data.articles.length === 0) {
            container.innerHTML = `<p class="loading-message">No stories found for <strong>${currentQuery || 'latest news'}</strong> in <strong>${languageLabels[currentLanguage]}</strong>.</p>`;
            updateTrending([]);
            return;
        }

        updateTrending(data.articles);
        displayNews(data.articles.slice(0, pageSize));
    } catch (error) {
        console.error('Error fetching news:', error);
        container.innerHTML = '<p class="loading-message">Failed to load news. Please try again later.</p>';
    }
}

async function fetchCategoryNews(category) {
    const container = document.getElementById(`category-${category}`);
    if (!container) return;
    container.innerHTML = '<p class="loading-message">Loading headlines...</p>';

    try {
        const response = await fetch(buildCategoryEndpoint(category, currentLanguage));
        const data = await response.json();

        if (!response.ok || data.status === 'error' || !data.articles) {
            const message = (data && data.message) || `Unable to load ${category} news.`;
            console.error('Category API error:', message);
            container.innerHTML = `<p class="loading-message">Could not load ${category} headlines: <strong>${message}</strong></p>`;
            return;
        }

        if (data.articles.length === 0) {
            container.innerHTML = `<p class="loading-message">No ${category} headlines available in <strong>${languageLabels[currentLanguage]}</strong>.</p>`;
            return;
        }

        displayCategoryNews(category, data.articles.slice(0, pageSize));
    } catch (error) {
        console.error(`Error fetching ${category} news:`, error);
        container.innerHTML = '<p class="loading-message">Failed to load headlines. Please try again later.</p>';
    }
}

function displayCategoryNews(category, articles) {
    const container = document.getElementById(`category-${category}`);
    if (!container) return;
    container.innerHTML = articles.map(article => `
        <article class="news-card category-card">
            <img src="${article.urlToImage || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&q=80'}" alt="${category} news image">
            <div>
                <h3>${article.title || 'Untitled story'}</h3>
                <p>${article.description || 'No description available.'}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">Read More</a>
            </div>
        </article>
    `).join('');
}

function getLanguageName(code) {
    return languageLabels[code] || code;
}

function applyUiLanguage(code) {
    const strings = uiStrings[code] || uiStrings.en;
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const refreshButton = document.getElementById('refresh-button');
    const trendingLabel = document.querySelector('.trending-label');
    const heading = document.querySelector('.news-info h2');
    const infoText = document.querySelector('.news-info p');

    if (searchInput) searchInput.placeholder = strings.searchPlaceholder;
    if (searchButton) searchButton.textContent = strings.searchButton;
    if (refreshButton) refreshButton.textContent = strings.refreshButton;
    if (trendingLabel) trendingLabel.textContent = strings.trendingLabel;
    if (heading) heading.textContent = strings.latestHeading;
    if (infoText) infoText.textContent = strings.infoText;
}

function updateTrending(articles) {
    const trendingText = document.getElementById('trending-text');
    if (!trendingText) return;

    const headlines = articles
        .filter(article => article.title)
        .slice(0, 4)
        .map(article => article.title.trim());

    trendingText.textContent = headlines.length
        ? headlines.join(' · ')
        : 'Trending headlines are not available right now.';
}

function displayNews(articles) {
    const container = document.getElementById('news-container');
    container.innerHTML = articles.map(article => `
        <article class="news-card">
            <img src="${article.urlToImage || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&q=80'}" alt="News image">
            <div>
                <h3>${article.title || 'Untitled story'}</h3>
                <p>${article.description || 'No description available.'}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">Read More</a>
            </div>
        </article>
    `).join('');
}

const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const refreshButton = document.getElementById('refresh-button');

if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        fetchNews(query);
    });

    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            const query = searchInput.value.trim();
            fetchNews(query);
        }
    });
}

const languageSelect = document.getElementById('language-select');
const categoryChips = document.querySelectorAll('.category-chip');
const categories = Object.keys(categoryDefinitions);

if (languageSelect) {
    languageSelect.addEventListener('change', () => {
        currentLanguage = languageSelect.value;
        applyUiLanguage(currentLanguage);
        fetchNews(currentQuery);
        loadCategoryNews();
    });
}

if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        fetchNews(currentQuery);
        loadCategoryNews();
    });
}

categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
        categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const section = document.getElementById(`category-${chip.dataset.category}`);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

function loadCategoryNews() {
    categories.forEach(category => fetchCategoryNews(category));
}

applyUiLanguage(currentLanguage);
fetchNews();
loadCategoryNews();
