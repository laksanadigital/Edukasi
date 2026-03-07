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
    fileGrid.classList.remove('flex', 'md:grid');
    fileGrid.innerHTML = '';

    try {
        const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${currentFolder}?ref=${BRANCH}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Filter out index.html and README.md, keep only media/documents
        const files = data.filter(item => item.type === 'file' && !item.name.endsWith('.html') && !item.name.toLowerCase().endsWith('readme.md'));

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

        // For GitHub API, html_url opens in browser (good for 'Lihat'), download_url directly downloads
        const viewUrl = file.html_url;
        const downloadUrl = file.download_url || file.html_url;

        card.innerHTML = `
                <!-- Desktop View (Google Drive File Style) -->
                <a href="${viewUrl}" target="_blank" class="hidden md:flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden drive-item transition-all hover:shadow-md cursor-pointer relative h-56 w-full">
                    <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                        <i class="fa-solid ${iconClass} text-lg shrink-0"></i>
                        <span class="font-medium text-[13px] text-slate-700 dark:text-slate-200 truncate pr-2 select-none" title="${file.name}">${file.name}</span>
                    </div>
                    
                    <!-- Thumbnail Area -->
                    <div class="flex-1 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:bg-slate-100 dark:group-hover:bg-slate-900/80 transition-colors">
                        <i class="fa-solid ${iconClass} text-5xl opacity-40 group-hover:scale-110 transition-transform duration-300"></i>
                        <!-- Overlay options on hover -->
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                            <span class="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white text-lg"><i class="fa-solid fa-eye text-slate-800 hidden group-hover/btn:block"></i><i class="fa-solid fa-eye group-hover/btn:hidden"></i></span>
                            <span class="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white text-lg"><i class="fa-solid fa-download text-slate-800 hidden group-hover/btn:block"></i><i class="fa-solid fa-download group-hover/btn:hidden"></i></span>
                        </div>
                    </div>
                </a>

                <!-- Mobile View (Learning App Lesson Card) -->
                <div class="md:hidden flex flex-col p-4 bg-white dark:bg-slate-800 rounded-[1.25rem] border border-slate-100 dark:border-slate-700/50 shadow-sm w-full">
                    <div class="flex items-center active:scale-[0.98] transition-transform mb-3">
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgColor}">
                            <i class="fa-solid ${iconClass} text-[22px]"></i>
                        </div>
                        <div class="ml-4 flex-1 min-w-0 pr-2">
                            <h4 class="font-bold text-slate-800 dark:text-white text-sm truncate leading-tight mb-1">${fileNameClean}</h4>
                            <div class="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                <span class="flex items-center gap-1.5"><i class="fa-regular fa-folder-open opacity-70"></i> ${fileSize}</span>
                                <span class="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                <span class="flex items-center gap-1.5"><i class="fa-regular fa-clock opacity-70"></i> Modul Terbuka</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2 mt-1">
                        <a href="${viewUrl}" target="_blank" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold font-bold text-xs transition-colors">
                            <i class="fa-solid fa-eye"></i> Lihat
                        </a>
                        <a href="${downloadUrl}" target="_blank" download class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors">
                            <i class="fa-solid fa-download"></i> Unduh
                        </a>
                    </div>
                </div>
            `;
        fileGrid.appendChild(card);

        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        fileGrid.classList.remove('hidden');
        fileGrid.classList.add('flex', 'md:grid');

    } catch (error) {
        console.error(error);
        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        errorState.classList.remove('hidden');
        errorState.classList.add('flex');
        document.getElementById('errorMsg').textContent = "Terjadi kesalahan koneksi internet atau API limit tercapai. Silakan coba sebentar lagi.";
    }
}

document.addEventListener('DOMContentLoaded', fetchFiles);
