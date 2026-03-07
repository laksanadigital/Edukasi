const fs = require('fs');
const path = require('path');

// Folders to scan for materials
const materialFolders = [
    'administrasi-perkantoran',
    'cloud-computing',
    'database-backend',
    'ethical-hacking',
    'iot-mikrokontroler',
    'jaringan-komputer',
    'kecerdasan-buatan',
    'manajemen-server',
    'microsoft-office',
    'web-development'
];

const outputFile = path.join(__dirname, 'assets', 'js', 'materials_registry.json');
let registry = {};

materialFolders.forEach(folder => {
    const folderPath = path.join(__dirname, folder);

    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        const validFiles = [];

        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);

            // Only include files (not directories) and exclude HTML/MD files
            if (stats.isFile() && !file.endsWith('.html') && !file.toLowerCase().endsWith('readme.md') && !file.startsWith('.')) {
                validFiles.push({
                    name: file,
                    size: stats.size,
                    path: `${folder}/${file}` // Relative path
                });
            }
        });

        registry[folder] = validFiles;
    } else {
        registry[folder] = [];
    }
});

fs.writeFileSync(outputFile, JSON.stringify(registry, null, 2));
console.log(`[Success] Material registry generated at ${outputFile} with ${Object.values(registry).flat().length} total files.`);
