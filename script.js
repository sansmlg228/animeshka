// ============================================================
//  КОНСТАНТЫ
// ============================================================
const JIKAN_BASE     = 'https://api.jikan.moe/v4';
const SHIKIMORI_BASE = 'https://shikimori.one/api';
const STORAGE_KEY    = 'animeLibraryV2';

const genreColors = {
    'Action':'#FF4500','Adventure':'#FF8C00','Comedy':'#FFD700','Drama':'#8A2BE2',
    'Fantasy':'#32CD32','Horror':'#8B0000','Mystery':'#4B0082','Romance':'#FF69B4',
    'Sci-Fi':'#00CED1','Slice of Life':'#20B2AA','Sports':'#1E90FF','Supernatural':'#9370DB',
    'Thriller':'#DC143C','Mecha':'#708090','Isekai':'#00FA9A','Magic':'#DA70D6',
    'School':'#FFA07A','Music':'#FF1493','Psychological':'#483D8B','Military':'#556B2F',
    'Historical':'#8B4513','Ecchi':'#FF6347','Harem':'#FFB6C1','Shounen':'#FF7F50',
    'Seinen':'#696969','Shoujo':'#FFC0CB','Josei':'#DDA0DD','Kids':'#87CEEB',
    'Space':'#191970','Vampire':'#800000','Demons':'#2F4F4F','Game':'#3CB371',
    'Martial Arts':'#B22222','Parody':'#F0E68C','Samurai':'#A0522D','Super Power':'#4169E1',
    'Survival':'#A52A2A','Time Travel':'#00BFFF','Gore':'#6B0000','Reincarnation':'#00FA9A',
    'Video Game':'#3CB371','Adult Cast':'#808080','Childcare':'#FFB6C1','Detective':'#4B0082',
    'High Stakes Game':'#8B0000','Organized Crime':'#2F4F4F','Otaku Culture':'#FF69B4',
    'Performing Arts':'#DA70D6','Pets':'#FFA07A','Reverse Harem':'#FFB6C1',
    'Strategy Game':'#3CB371','Team Sports':'#1E90FF','Visual Arts':'#9370DB','Workplace':'#556B2F'
};

const genreTranslations = {
    'Action':'Экшен','Adventure':'Приключения','Comedy':'Комедия','Drama':'Драма',
    'Fantasy':'Фэнтези','Horror':'Ужасы','Mystery':'Мистика','Romance':'Романтика',
    'Sci-Fi':'Фантастика','Slice of Life':'Повседневность','Sports':'Спорт',
    'Supernatural':'Сверхъестественное','Thriller':'Триллер','Mecha':'Меха',
    'Isekai':'Исекай','Magic':'Магия','School':'Школа','Music':'Музыка',
    'Psychological':'Психологическое','Military':'Военное','Historical':'Историческое',
    'Ecchi':'Этти','Harem':'Гарем','Shounen':'Сёнэн','Seinen':'Сэйнэн',
    'Shoujo':'Сёдзё','Josei':'Дзёсэй','Kids':'Детское','Space':'Космос',
    'Vampire':'Вампиры','Demons':'Демоны','Game':'Игры','Martial Arts':'Боевые искусства',
    'Parody':'Пародия','Samurai':'Самураи','Super Power':'Суперсилы','Survival':'Выживание',
    'Time Travel':'Путешествия во времени','Gore':'Кровь','Reincarnation':'Реинкарнация',
    'Video Game':'Видеоигры','Adult Cast':'Взрослые персонажи','Childcare':'Дети',
    'Detective':'Детектив','High Stakes Game':'Игры с высокими ставками',
    'Organized Crime':'Организованная преступность','Otaku Culture':'Культура отаку',
    'Performing Arts':'Сценическое искусство','Pets':'Питомцы','Reverse Harem':'Обратный гарем',
    'Strategy Game':'Стратегии','Team Sports':'Командный спорт',
    'Visual Arts':'Изобразительное искусство','Workplace':'Работа'
};

const statusTranslations = {
    'Finished Airing':  'Завершено',
    'Currently Airing': 'Выходит',
    'Not yet aired':    'Ещё не вышло'
};

const relationTranslations = {
    'Sequel': 'Продолжение',
    'Prequel': 'Приквел',
    'Side story': 'Побочная история',
    'Alternative setting': 'Альтернативная история',
    'Alternative version': 'Альтернативная версия',
    'Spin-off': 'Спин-офф',
    'Adaptation': 'Адаптация',
    'Summary': 'Краткое содержание',
    'Full story': 'Полная история',
    'Parent story': 'Основная история'
};

// ============================================================
//  СОСТОЯНИЕ
// ============================================================
let library       = [];
let activeGenre   = 'all';
let activeSort    = 'title-asc';
let librarySearch = '';
let isSearching   = false;
let pendingVersionResolve = null;

// ============================================================
//  DOM
// ============================================================
const searchInput        = document.getElementById('search-input');
const searchBtn          = document.getElementById('search-btn');
const librarySearchInput = document.getElementById('library-search');
const genreFilter        = document.getElementById('genre-filter');
const sortSelect         = document.getElementById('sort-select');
const animeGrid          = document.getElementById('anime-grid');
const statusMessage      = document.getElementById('status-message');
const statsEl            = document.getElementById('stats');
const exportBtn          = document.getElementById('export-btn');
const importInput        = document.getElementById('import-input');
const versionModal       = document.getElementById('version-modal');
const versionOptions     = document.getElementById('version-options');
const versionCancel      = document.getElementById('version-cancel');

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ
// ============================================================
const translateGenre  = n => genreTranslations[n] || n;
const translateStatus = s => statusTranslations[s] || s || 'Неизвестно';
const colorFor        = n => genreColors[n] || '#6C5CE7';
const translateRelation = r => relationTranslations[r] || r;

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

// ============================================================
//  ХРАНИЛИЩЕ
// ============================================================
function loadLibrary() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        library = raw ? JSON.parse(raw) : [];
        // Миграция со старой версии
        library.forEach(a => {
            if (!a.watched)      a.watched = [];
            if (a.personalScore === undefined) a.personalScore = null;
        });
    } catch (e) {
        console.warn('Не удалось загрузить библиотеку:', e);
        library = [];
    }
}

function saveLibrary() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch (e) {
        statusMessage.textContent = '⚠️ Не удалось сохранить: ' + e.message;
    }
}

// ============================================================
//  JIKAN API (через CORS-прокси)
// ============================================================
async function jikanFetch(path, retries = 3, delay = 1000) {
    // Используем публичный прокси, чтобы обойти блокировку и CORS
    const proxy = 'https://corsproxy.io/?';
    const targetUrl = `https://api.jikan.moe/v4${path}`;
    const url = proxy + encodeURIComponent(targetUrl);

    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                // Если ошибка сервера (5xx) или прокси (429), пробуем еще раз
                if (res.status >= 500 || res.status === 429) {
                    throw new Error(`Прокси вернул ошибку: ${res.status}`);
                }
                // Если ошибка клиента (4xx), повторять нет смысла
                if (res.status >= 400 && res.status < 500) {
                    throw new Error(`Ошибка запроса: ${res.status}`);
                }
            }
            return res.json();
        } catch (e) {
            console.warn(`Попытка ${i + 1} из ${retries} не удалась:`, e.message);
            if (i < retries - 1) {
                // Ждем перед следующей попыткой (экспоненциальная задержка)
                await new Promise(r => setTimeout(r, delay * (i + 1)));
            } else {
                // Если все попытки исчерпаны, выбрасываем ошибку
                throw e;
            }
        }
    }
}

async function fetchAnime(query) {
    const url = `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=8&sfw`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jikan API: ${res.status}`);
    const json = await res.json();

    return (json.data || []).map(item => ({
        id:       item.mal_id,
        title:    item.title,
        titles:   item.titles || [],
        image:    item.images?.jpg?.image_url || item.images?.webp?.image_url || '',
        genres:   item.genres || [],
        themes:   item.themes || [],
        status:   item.status || '',
        episodes: item.episodes || null,
        year:     item.year || null,
        season:   item.season || null,
        score:    item.score || null,
        type:     item.type || null,
        addedAt:  Date.now()
    }));
}

async function fetchRelations(animeId) {
    try {
        const json = await jikanFetch(`/anime/${animeId}/relations`);
        return (json.data || []).flatMap(rel =>
            (rel.entry || []).map(entry => ({
                id:       entry.mal_id,
                title:    entry.name,
                relation: rel.relation || 'Related'
            }))
        );
    } catch (e) {
        console.warn('Не удалось загрузить связи:', e);
        return [];
    }
}

async function fetchFullDetails(animeId) {
    try {
        const json = await jikanFetch(`/anime/${animeId}/full`);
        return json.data || null;
    } catch (e) {
        console.warn('Не удалось загрузить детали:', e);
        return null;
    }
}

// ============================================================
//  SHIKIMORI (с CORS-прокси)
// ============================================================
async function fetchShikimoriScore(title) {
    try {
        // Shikimori требует User-Agent, который браузер не даёт установить.
        // Используем публичный CORS-прокси.
        const searchUrl = `https://corsproxy.io/?${encodeURIComponent(
            `${SHIKIMORI_BASE}/animes?search=${encodeURIComponent(title)}&limit=1`
        )}`;
        const res = await fetch(searchUrl);
        if (!res.ok) return null;
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) return null;

        const score = list[0].score;
        return score ? parseFloat(score) : null;
    } catch (e) {
        console.warn('Shikimori недоступен:', e);
        return null;
    }
}

// ============================================================
//  ПОИСК
// ============================================================
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) { statusMessage.textContent = 'Введите название аниме.'; return; }
    if (isSearching) return;

    isSearching = true;
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span class="spinner"></span>Поиск...';
    statusMessage.textContent = '';

    try {
        const results = await fetchAnime(query);
        if (results.length === 0) {
            statusMessage.textContent = 'Ничего не найдено. Попробуйте другое название.';
            return;
        }

        // Показываем пользователю список найденных вариантов, чтобы он выбрал нужный
        const chosen = await showVersionPicker(results, 'Найдено несколько вариантов. Выберите нужный:');
        if (!chosen) return;

        // Проверяем, есть ли у выбранного аниме связанные версии
        const relations = await fetchRelations(chosen.id);
        let finalAnime = chosen;

        if (relations.length > 0) {
            // Спрашиваем, какую версию пользователь смотрел
            const selectedRelation = await showVersionPicker(
                relations,
                'У этого аниме есть связанные версии. Какую вы смотрели?'
            );
            if (selectedRelation) {
                // Подгружаем полные данные выбранной версии
                const fullDetails = await fetchFullDetails(selectedRelation.id);
                if (fullDetails) {
                    finalAnime = mapFullToAnime(fullDetails);
                } else {
                    finalAnime = {
                        ...chosen,
                        id: selectedRelation.id,
                        title: selectedRelation.title
                    };
                }
            }
        }

        // Проверяем дубликат
        if (library.some(a => a.id === finalAnime.id)) {
            statusMessage.textContent = 'Это аниме уже есть в библиотеке.';
            return;
        }

        // Подтягиваем рейтинг Shikimori
        statusMessage.textContent = 'Загружаем рейтинг Shikimori...';
        const shikiScore = await fetchShikimoriScore(finalAnime.title);
        finalAnime.shikimoriScore = shikiScore;

        library.push(finalAnime);
        saveLibrary();
        searchInput.value = '';
        statusMessage.textContent = `Добавлено: «${finalAnime.title}». Всего: ${library.length}.`;

        rebuildFilterOptions();
        render();
    } catch (e) {
        statusMessage.textContent = 'Ошибка: ' + e.message;
    } finally {
        isSearching = false;
        searchBtn.disabled = false;
        searchBtn.textContent = 'Найти';
    }
}

function mapFullToAnime(item) {
    return {
        id:       item.mal_id,
        title:    item.title,
        titles:   item.titles || [],
        image:    item.images?.jpg?.image_url || item.images?.webp?.image_url || '',
        genres:   item.genres || [],
        themes:   item.themes || [],
        status:   item.status || '',
        episodes: item.episodes || null,
        year:     item.year || null,
        season:   item.season || null,
        score:    item.score || null,
        type:     item.type || null,
        addedAt:  Date.now()
    };
}

// ============================================================
//  МОДАЛЬНОЕ ОКНО ВЫБОРА ВЕРСИИ
// ============================================================
function showVersionPicker(items, prompt) {
    return new Promise(resolve => {
        pendingVersionResolve = resolve;
        versionOptions.innerHTML = '';
        versionModal.querySelector('.modal-subtitle').textContent = prompt;

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'version-option';
            btn.innerHTML = `
                <span class="vo-title">${escapeHtml(item.title)}</span>
                <span class="vo-meta">
                    ${item.year ? item.year + ' · ' : ''}
                    ${item.type || ''}
                    ${item.relation ? ' · ' + escapeHtml(translateRelation(item.relation)) : ''}
                </span>
            `;
            btn.addEventListener('click', () => closeVersionPicker(item));
            versionOptions.appendChild(btn);
        });

        versionModal.classList.remove('hidden');
    });
}

function closeVersionPicker(result) {
    versionModal.classList.add('hidden');
    if (pendingVersionResolve) {
        pendingVersionResolve(result);
        pendingVersionResolve = null;
    }
}

versionCancel.addEventListener('click', () => closeVersionPicker(null));

// ============================================================
//  УДАЛЕНИЕ
// ============================================================
function removeAnime(id) {
    library = library.filter(a => a.id !== id);
    saveLibrary();
    rebuildFilterOptions();
    render();
}

// ============================================================
//  ОТМЕТКИ ПРОСМОТРЕННОГО
// ============================================================
function toggleWatched(animeId, relationId) {
    const anime = library.find(a => a.id === animeId);
    if (!anime) return;

    if (!anime.watched) anime.watched = [];

    const index = anime.watched.indexOf(relationId);
    if (index === -1) anime.watched.push(relationId);
    else anime.watched.splice(index, 1);

    saveLibrary();
}

// ============================================================
//  ЛИЧНАЯ ОЦЕНКА
// ============================================================
function setPersonalScore(animeId, value) {
    const anime = library.find(a => a.id === animeId);
    if (!anime) return;
    anime.personalScore = value ? parseInt(value, 10) : null;
    saveLibrary();
}

// ============================================================
//  ЭКСПОРТ / ИМПОРТ
// ============================================================
function exportLibrary() {
    if (library.length === 0) {
        statusMessage.textContent = 'Библиотека пуста — нечего экспортировать.';
        return;
    }
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `anime-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    statusMessage.textContent = `Экспортировано ${library.length} записей.`;
}

async function importLibrary(file) {
    try {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data)) throw new Error('Ожидается массив');

        let added = 0, skipped = 0;
        for (const item of data) {
            if (!item || !item.id || !item.title) continue;
            if (library.some(a => a.id === item.id)) { skipped++; continue; }
            library.push({
                id:            item.id,
                title:         item.title,
                titles:        item.titles || [],
                image:         item.image || '',
                genres:        item.genres || [],
                themes:        item.themes || [],
                status:        item.status || '',
                episodes:      item.episodes || null,
                year:          item.year || null,
                season:        item.season || null,
                score:         item.score || null,
                type:          item.type || null,
                shikimoriScore:item.shikimoriScore || null,
                personalScore: item.personalScore ?? null,
                watched:       item.watched || [],
                addedAt:       item.addedAt || Date.now()
            });
            added++;
        }

        saveLibrary();
        rebuildFilterOptions();
        render();
        statusMessage.textContent = `Импорт: добавлено ${added}, пропущено ${skipped}.`;
    } catch (e) {
        statusMessage.textContent = 'Ошибка импорта: ' + e.message;
    }
}

// ============================================================
//  ФИЛЬТР
// ============================================================
function rebuildFilterOptions() {
    const current = genreFilter.value;
    const set = new Set();
    library.forEach(a => {
        a.genres.forEach(g => set.add(g.name));
        a.themes.forEach(t => set.add(t.name));
    });

    const sorted = [...set].sort((a, b) =>
        translateGenre(a).localeCompare(translateGenre(b), 'ru')
    );

    genreFilter.innerHTML = '<option value="all">Все жанры</option>' +
        sorted.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(translateGenre(g))}</option>`).join('');

    if ([...genreFilter.options].some(o => o.value === current)) {
        genreFilter.value = current;
    } else {
        genreFilter.value = 'all';
        activeGenre = 'all';
    }
}

// ============================================================
//  ФИЛЬТРАЦИЯ + СОРТИРОВКА
// ============================================================
function getVisibleItems() {
    let items = library.slice();

    if (activeGenre !== 'all') {
        items = items.filter(a =>
            a.genres.some(g => g.name === activeGenre) ||
            a.themes.some(t => t.name === activeGenre)
        );
    }

    if (librarySearch.trim()) {
        const q = librarySearch.trim().toLowerCase();
        items = items.filter(a =>
            a.title.toLowerCase().includes(q) ||
            (a.titles || []).some(t => t.title.toLowerCase().includes(q))
        );
    }

    switch (activeSort) {
        case 'title-asc':
            items.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
            break;
        case 'title-desc':
            items.sort((a, b) => b.title.localeCompare(a.title, 'ru'));
            break;
        case 'status':
            items.sort((a, b) =>
                translateStatus(a.status).localeCompare(translateStatus(b.status), 'ru') ||
                a.title.localeCompare(b.title, 'ru')
            );
            break;
        case 'added-desc':
            items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
            break;
        case 'added-asc':
            items.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
            break;
    }

    return items;
}

// ============================================================
//  РЕНДЕР
// ============================================================
function renderStats() {
    const total = library.length;
    const finished = library.filter(a => a.status === 'Finished Airing').length;
    const airing   = library.filter(a => a.status === 'Currently Airing').length;
    const upcoming = library.filter(a => a.status === 'Not yet aired').length;

    statsEl.innerHTML = total === 0
        ? ''
        : `Всего: <strong>${total}</strong> · Завершено: <strong>${finished}</strong> · Выходит: <strong>${airing}</strong> · Скоро: <strong>${upcoming}</strong>`;
}

function render() {
    animeGrid.innerHTML = '';
    renderStats();

    const items = getVisibleItems();

    if (items.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty';
        p.textContent = library.length === 0
            ? 'Библиотека пуста. Найдите аниме через поиск.'
            : 'Ничего не найдено по текущим фильтрам.';
        animeGrid.appendChild(p);
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach(a => fragment.appendChild(createCard(a)));
    animeGrid.appendChild(fragment);
}

function createCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';

    const primary = anime.genres[0] || anime.themes[0];
    card.style.setProperty('--accent', primary ? colorFor(primary.name) : '#6C5CE7');

    const allTags = [...anime.genres, ...anime.themes];
    const tagsHtml = allTags.length
        ? allTags.map(g =>
            `<span class="tag" style="background:${colorFor(g.name)}">${escapeHtml(translateGenre(g.name))}</span>`
          ).join('')
        : '<span class="tag" style="background:#555">Без жанра</span>';

    const yearLabel = anime.year
        ? `${anime.year}${anime.season ? ' · ' + anime.season : ''}`
        : '';
    const episodesLabel = anime.episodes ? `${anime.episodes} эп.` : '';

    const malScore = anime.score ? `★ ${anime.score}` : '';
    const shikiScore = anime.shikimoriScore ? `Shikimori: ${anime.shikimoriScore}` : '';

    const personalOptions = Array.from({ length: 10 }, (_, i) => {
        const v = i + 1;
        const sel = anime.personalScore === v ? 'selected' : '';
        return `<option value="${v}" ${sel}>${v}</option>`;
    }).join('');

    card.innerHTML = `
        <div class="poster-wrap">
            <img src="${escapeHtml(anime.image)}" alt="${escapeHtml(anime.title)}" loading="lazy"
                 onerror="this.style.opacity='0';this.parentElement.style.background='#333'">
        </div>
        <div class="card-body">
            <h3 class="anime-title">${escapeHtml(anime.title)}</h3>
        </div>
        <div class="details">
            <p class="status">${yearLabel ? yearLabel + ' · ' : ''}${episodesLabel}</p>
            <p class="status">Статус: <strong>${escapeHtml(translateStatus(anime.status))}</strong></p>

            <div class="scores-row">
                ${malScore ? `<span>MAL: <strong>${malScore}</strong></span>` : ''}
                ${shikiScore ? `<span>${shikiScore}</span>` : ''}
            </div>

            <div class="personal-score-wrap">
                <span>Моя оценка:</span>
                <select class="personal-score" data-anime-id="${anime.id}">
                    <option value="">—</option>
                    ${personalOptions}
                </select>
            </div>

            <div class="tags">${tagsHtml}</div>

            <div class="relations-block" data-anime-id="${anime.id}">
                <p>Сезоны и фильмы:</p>
                <div class="relations-list">Загрузка...</div>
            </div>
        </div>
        <button class="remove-btn" title="Удалить">✕</button>
    `;

    // Удаление
    card.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Удалить «${anime.title}» из библиотеки?`)) removeAnime(anime.id);
    });

    // Личная оценка
    card.querySelector('.personal-score').addEventListener('change', (e) => {
        setPersonalScore(anime.id, e.target.value);
    });

    // Ленивая загрузка связей при первом наведении
    const relationsBlock = card.querySelector('.relations-block');
    let relationsLoaded = false;

    card.addEventListener('mouseenter', async () => {
        if (relationsLoaded) return;
        relationsLoaded = true;
        await loadRelationsIntoCard(anime, relationsBlock);
    }, { once: false });

    return card;
}

async function loadRelationsIntoCard(anime, block) {
    const list = block.querySelector('.relations-list');
    list.innerHTML = 'Загрузка...';

    const relations = await fetchRelations(anime.id);

    if (relations.length === 0) {
        list.innerHTML = '<span style="color:var(--muted);font-size:.8rem">Связанных тайтлов нет</span>';
        return;
    }

    list.innerHTML = '';
    relations.forEach(rel => {
        const checked = (anime.watched || []).includes(rel.id) ? 'checked' : '';
        const label = document.createElement('label');
        label.className = 'relation-item';
        label.innerHTML = `
            <input type="checkbox" ${checked} data-relation-id="${rel.id}">
            <span>${escapeHtml(rel.title)}</span>
            <span class="relation-type">${escapeHtml(translateRelation(rel.relation))}</span>
        `;
        label.querySelector('input').addEventListener('change', (e) => {
            toggleWatched(anime.id, parseInt(e.target.dataset.relationId, 10));
        });
        list.appendChild(label);
    });
}

// ============================================================
//  СОБЫТИЯ
// ============================================================
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

genreFilter.addEventListener('change', e => {
    activeGenre = e.target.value;
    render();
});

sortSelect.addEventListener('change', e => {
    activeSort = e.target.value;
    render();
});

let searchTimeout;
librarySearchInput.addEventListener('input', e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        librarySearch = e.target.value;
        render();
    }, 200);
});

exportBtn.addEventListener('click', exportLibrary);

importInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importLibrary(file);
    e.target.value = '';
});

// ============================================================
//  СТАРТ
// ============================================================
loadLibrary();
rebuildFilterOptions();
render();
