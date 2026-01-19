
const fs = require('fs');

const content = fs.readFileSync('c:/Users/admin/Desktop/UPDATED_POS-20260118T134210Z-1-001/UPDATED_POS/cafe_pos_new-main/src/lib/translations.ts', 'utf8');

// Simple regex parser for keys in each language block
const langBlocks = content.split(/\s+([a-z]{2}): \{ \/\/ [^\n]*/);
for (let i = 1; i < langBlocks.length; i += 2) {
    const lang = langBlocks[i];
    const block = langBlocks[i + 1];
    const lines = block.split('\n');
    const keys = new Set();
    const duplicates = [];

    lines.forEach(line => {
        const match = line.match(/^\s*"([^"]+)":/);
        if (match) {
            const key = match[1];
            if (keys.has(key)) {
                duplicates.push(key);
            }
            keys.add(key);
        }
    });

    if (duplicates.length > 0) {
        console.log(`Duplicates in [${lang}]:`, duplicates);
    }
}
