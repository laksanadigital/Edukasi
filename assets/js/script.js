// --- THEME TOGGLE LOGIC DENGAN PERSISTENCE LOCALSTORAGE ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
const htmlElement = document.documentElement;

// Cek preferensi awal: LocalStorage > OS Preference
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
}

// Toggle dan Simpan Theme
themeToggleBtn.addEventListener('click', () => {
    htmlElement.classList.toggle('dark');
    const isDark = htmlElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Efek haptic ringan saat dipencet (jika didukung perangkat)
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
    }
});

// Inisialisasi tema saat load
initializeTheme();

// --- FILTERING & LOGIKA UI LAINNYA ---
let currentTab = 'semua';
let registryData = null;

// Fetch registry data once for global search
fetch('assets/js/materials_registry.json')
    .then(res => res.json())
    .then(data => {
        registryData = data;
        filterMateri(); // Re-filter once data is loaded
    })
    .catch(err => console.error('Error loading registry for search:', err));

// Auto Update Year
document.getElementById('year').textContent = new Date().getFullYear();

// Keyboard Shortcut untuk Pencarian Global
document.addEventListener('keydown', (e) => {
    // Hilangkan default behavior '/' jika sedang mengetik
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.key === '/') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        searchInput.focus();

        // Tambahkan efek glow sebentar saat shortcut dipencet tergantung tema
        const glowColor = htmlElement.classList.contains('dark') ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.2)';
        searchInput.style.boxShadow = `0 0 20px ${glowColor}`;
        setTimeout(() => { searchInput.style.boxShadow = ''; }, 300);
    }
});

// View Switching Logic (Consolidated)
function toggleMainView(view) {
    const profileSection = document.getElementById('profileSection');
    const mainSection = document.querySelector('main');
    const headerSection = document.querySelector('header');

    if (view === 'profile') {
        if (mainSection) mainSection.style.display = 'none';
        if (headerSection) headerSection.style.display = 'none';
        if (profileSection) profileSection.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        if (mainSection) mainSection.style.display = 'block';
        if (headerSection) headerSection.style.display = 'block';
        if (profileSection) profileSection.classList.add('hidden');
    }
}

// Interaksi Mobile Bottom Nav
document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', function (e) {
        // Ignore if it's the search button
        if (this.querySelector('.fa-search')) return;

        e.preventDefault();
        document.querySelectorAll('.mobile-nav-item').forEach(nav => nav.classList.remove('active', 'font-semibold'));
        this.classList.add('active');

        const span = this.querySelector('span');
        if (span) span.classList.add('font-semibold');

        const targetView = this.getAttribute('data-target');
        toggleMainView(targetView === 'profile' ? 'profile' : 'explore');

        // Haptic feedback
        if (window.navigator && window.navigator.vibrate) { window.navigator.vibrate(50); }
    });
});

// Desktop Profile Toggle
const profileToggleBtnDesk = document.getElementById('profileToggleBtnDesk');
if (profileToggleBtnDesk) {
    profileToggleBtnDesk.addEventListener('click', () => {
        const profileSection = document.getElementById('profileSection');
        const isHidden = profileSection.classList.contains('hidden');
        toggleMainView(isHidden ? 'profile' : 'explore');

        // Haptic feedback
        if (window.navigator && window.navigator.vibrate) { window.navigator.vibrate(50); }
    });
}

// Close Profile Button (Mobile specific)
const closeProfileBtn = document.getElementById('closeProfileBtn');
if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', () => {
        toggleMainView('explore');
        // Reset mobile nav active state
        document.querySelectorAll('.mobile-nav-item').forEach(nav => nav.classList.remove('active', 'font-semibold'));
        const exploreTab = document.querySelector('.mobile-nav-item[data-target="explore"]');
        if (exploreTab) {
            exploreTab.classList.add('active');
            exploreTab.querySelector('span').classList.add('font-semibold');
        }
    });
}

// Manajemen Tab UI Horizontal
function setTab(category) {
    currentTab = category;

    const btnContainer = document.getElementById('tabContainer');
    let targetBtn = null;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        const target = btn.getAttribute('data-tab');
        if (target === category) {
            btn.classList.add('tab-active');
            btn.classList.remove('tab-inactive');
            targetBtn = btn;
        } else {
            btn.classList.remove('tab-active');
            btn.classList.add('tab-inactive');
        }
    });

    // Scroll tab ke posisi tengah secara halus saat dipencet di HP
    if (window.innerWidth < 768 && targetBtn) {
        const scrollLeft = targetBtn.offsetLeft - (btnContainer.offsetWidth / 2) + (targetBtn.offsetWidth / 2);
        btnContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }

    filterMateri();
}

// Event Listener ke Search Input dengan Debounce
document.getElementById('searchInput').addEventListener('input', function (e) {
    clearTimeout(this.delay);
    this.delay = setTimeout(() => filterMateri(), 150);
});

// Logika Eksekusi dan Filtering Rendering DOM Multi Parameter
function filterMateri() {
    const searchKeyword = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.materi-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const cardTitleInfo = card.getAttribute('data-title').toLowerCase();

        // Extract folder name from href for global file search
        const href = card.getAttribute('href') || '';
        const folderMatch = href.match(/\.\/(.*?)\/index\.html/);
        const folderKey = folderMatch ? folderMatch[1] : null;

        let hasMatchingFile = false;
        if (registryData && folderKey && registryData[folderKey]) {
            const files = registryData[folderKey];
            hasMatchingFile = files.some(f => f.name.toLowerCase().includes(searchKeyword));
        }

        const matchTab = (currentTab === 'semua' || cardCategory === currentTab);
        const matchSearch = cardTitleInfo.includes(searchKeyword) || hasMatchingFile;

        if (matchTab && matchSearch) {
            card.style.display = 'block';
            card.style.animation = 'none';
            card.offsetHeight; // trigger reflow
            card.style.animation = null;
            card.classList.add('animate-fade-in-up');
            visibleCount++;
        } else {
            card.style.display = 'none';
            card.classList.remove('animate-fade-in-up');
        }
    });

    // State jika tidak ditemukan
    const noResultDiv = document.getElementById('noResult');
    if (visibleCount === 0) {
        noResultDiv.classList.remove('hidden');
        noResultDiv.classList.add('animate-fade-in-up');
    } else {
        noResultDiv.classList.add('hidden');
    }
}

// Initialize display pertama kali
filterMateri();

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.log('Service Worker registration failed', err));
    });
}
