// Theme Logic
const htmlElement = document.documentElement;

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
}

function toggleTheme() {
    htmlElement.classList.toggle('dark');
    const isDark = htmlElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Haptic feedback if supported
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
    }
}

const deskBtn = document.getElementById('themeToggleBtnDesk');
const mobBtn = document.getElementById('themeToggleBtnMob');
if (deskBtn) deskBtn.addEventListener('click', toggleTheme);
if (mobBtn) mobBtn.addEventListener('click', toggleTheme);
initTheme();

// Fetch GitHub Files Logic
const GITHUB_REPO = 'laksanadigital/Edukasi';
const BRANCH = 'main';

// Extract folder name from URL path
const pathSegments = window.location.pathname.split('/').filter(p => p !== '');
let currentFolder = '';
if (pathSegments.length > 1) {
    if (pathSegments[pathSegments.length - 1].endsWith('.html')) {
        currentFolder = pathSegments[pathSegments.length - 2];
    } else {
        currentFolder = pathSegments[pathSegments.length - 1];
    }
} else {
    currentFolder = 'microsoft-office'; // default fallback for local dev root
}

function formatTitle(folder) {
    if (!folder) return "Materi Pembelajaran";
    return folder.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const displayTitle = formatTitle(currentFolder);
const titleDesktop = document.getElementById('folderNameDisplay');
const titleMobile = document.getElementById('mobileTitle');
const heroMobile = document.getElementById('mobileHeroTitle');

if (titleDesktop) titleDesktop.textContent = displayTitle;
if (titleMobile) titleMobile.textContent = displayTitle;
if (heroMobile) heroMobile.textContent = displayTitle;
document.title = displayTitle + " - Portal Edukasi";

function formatBytes(bytes, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(isoString) {
    if (!isoString) return new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function fetchFiles() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const fileGrid = document.getElementById('fileGrid');
    const fileCountMob = document.getElementById('fileCountMob');

    loadingState.classList.remove('hidden');
    loadingState.classList.add('flex');
    errorState.classList.add('hidden');
    errorState.classList.remove('flex');
    fileGrid.classList.add('hidden');
    fileGrid.innerHTML = '';

    try {
        const apiUrl = `../assets/js/materials_registry.json`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const registryData = await response.json();

        // Get files for the current folder
        const files = registryData[currentFolder] || [];


        if (files.length === 0) {
            loadingState.classList.add('hidden');
            loadingState.classList.remove('flex');
            errorState.classList.remove('hidden');
            errorState.classList.add('flex');
            document.getElementById('errorMsg').textContent = "Belum ada file materi PDF/Modul di folder ini.";
            if (fileCountMob) fileCountMob.textContent = "0 File";
            errorState.querySelector('i').className = "fa-regular fa-folder-open text-3xl";
            errorState.querySelector('div').className = "w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center text-3xl mb-5 shadow-inner";
            return;
        }

        if (fileCountMob) fileCountMob.textContent = `${files.length} File`;

        // Since contents API doesn't give file updated_at date for single queries easily, we'll mock it for UI aesthetics or use a generic "Hari ini".
        const genericDate = formatDate(new Date().toISOString());

        files.forEach(file => {
            // Main container (now a div instead of a full link card to allow multiple buttons inside)
            const card = document.createElement('div');
            card.className = "group block w-full outline-none focus:ring-2 focus:ring-brand-gold rounded-xl md:rounded-lg";

            // Generate icon based on extension
            let iconClass = "fa-file-lines text-blue-500";
            let bgColor = "bg-blue-500/10";
            if (file.name.endsWith('.pdf')) {
                iconClass = "fa-file-pdf text-red-500";
                bgColor = "bg-red-500/10";
            } else if (file.name.match(/\.(mp4|mkv)$/)) {
                iconClass = "fa-file-video text-purple-500";
                bgColor = "bg-purple-500/10";
            } else if (file.name.match(/\.(jpg|png|jpeg|webp)$/)) {
                iconClass = "fa-image text-emerald-500";
                bgColor = "bg-emerald-500/10";
            }

            const fileSize = formatBytes(file.size);
            const fileNameClean = file.name.replace(/\.[^/.]+$/, "");

            // For Github Pages static file host, path works for both view and download
            const viewUrl = "../" + file.path;
            const downloadUrl = `https://github.com/laksanadigital/Edukasi/blob/main/${file.path}`;

            card.innerHTML = `
                    <!-- Desktop View (List Row) -->
                    <a href="${downloadUrl}" download="${file.name}" class="hidden md:flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors w-full group">
                        <div class="flex items-center gap-4 w-[40%] min-w-0">
                            <i class="fa-solid ${iconClass} text-xl shrink-0 w-8 text-center text-opacity-80 group-hover:text-opacity-100 transition-opacity"></i>
                            <span class="font-medium text-sm text-slate-700 dark:text-slate-200 truncate pr-4" title="${file.name}">${file.name}</span>
                        </div>
                        <div class="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 w-[60%] justify-between">
                            <span class="truncate hidden lg:block flex-1" title="PT. Laksana Digital Industri">PT. Laksana Digital Industri</span>
                            <span class="w-28 shrink-0">${genericDate}</span>
                            <span class="w-20 shrink-0 text-right font-medium">${fileSize}</span>
                        </div>
                    </a>

                    <!-- Mobile View -->
                    <div class="md:hidden flex items-center p-4 bg-white dark:bg-slate-800 rounded-[1.25rem] border border-slate-100 dark:border-slate-700/50 shadow-sm w-full relative">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bgColor}">
                            <i class="fa-solid ${iconClass} text-[20px]"></i>
                        </div>
                        <div class="ml-4 flex-1 min-w-0 pr-10">
                            <h4 class="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-1 truncate">${fileNameClean}</h4>
                            <div class="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                <span class="flex items-center gap-1"><i class="fa-regular fa-calendar-days opacity-70"></i> ${genericDate}</span>
                            </div>
                        </div>
                        <a href="${downloadUrl}" target="_blank" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold flex items-center justify-center transition-colors active:scale-90 shadow-sm">
                            <i class="fa-solid fa-download text-lg"></i>
                        </a>
                    </div>
                `;
            fileGrid.appendChild(card);
        });

        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        fileGrid.classList.remove('hidden');
        fileGrid.className = "flex flex-col gap-3 md:gap-0 pb-10 w-full"; // override container to be a simple vertical block

    } catch (error) {
        console.error(error);
        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        errorState.classList.remove('hidden');
        errorState.classList.add('flex');

        let msg = "Terjadi kesalahan koneksi internet. Silakan coba sebentar lagi.";
        if (error.message.includes('403')) {
            msg = "Batas akses GitHub API tercapai (maksimal 60 request/jam). Mohon tunggu beberapa menit lalu muat ulang halaman.";
        } else if (error.message.includes('404')) {
            msg = "Folder materi tidak ditemukan (404).";
        } else {
            msg = error.message;
        }

        document.getElementById('errorMsg').textContent = msg;
    }
}

async function updateStorage() {
    const storageText = document.getElementById('storageText');
    const storageBar = document.getElementById('storageBar');
    const storageDetails = document.getElementById('storageDetails');

    if (!storageText || !storageBar || !storageDetails) return;

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
        if (!response.ok) throw new Error("Gagal mengambil data repositori");

        const data = await response.json();
        const repoSizeKB = data.size; // Size in KB
        const repoSizeMB = (repoSizeKB / 1024).toFixed(1);

        // Define limit (e.g., 1000MB for Free Tier soft limit or 2000MB for safety)
        const limitMB = 1000;
        const percentage = Math.min((repoSizeMB / limitMB) * 100, 100).toFixed(0);

        storageText.textContent = `Penyimpanan (${percentage}% penuh)`;
        storageBar.style.width = `${percentage}%`;
        storageDetails.textContent = `${repoSizeMB} MB dari ${limitMB} MB terpakai`;

        // Change bar color if safe or critical
        if (percentage > 90) {
            storageBar.classList.replace('bg-blue-500', 'bg-red-500');
        } else if (percentage > 70) {
            storageBar.classList.replace('bg-blue-500', 'bg-orange-500');
        }

    } catch (error) {
        console.error("Storage fetch error:", error);
        storageText.textContent = "Penyimpanan (Data Error)";
        storageDetails.textContent = "Gagal memuat detail penyimpanan.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchFiles();
    updateStorage();
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('../sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.log('Service Worker registration failed', err));
    });
}
