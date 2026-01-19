
const fs = require('fs');
const content = fs.readFileSync('c:/Users/admin/Desktop/UPDATED_POS-20260118T134210Z-1-001/UPDATED_POS/cafe_pos_new-main/src/lib/translations.ts', 'utf8');

const matches = content.matchAll(/\s+([a-z]{2}):\s*\{([\s\S]*?)\},/g);
for (const match of matches) {
    const lang = match[1];
    const block = match[2];
    const lines = block.split('\n');
    const keys = {};
    lines.forEach((line, index) => {
        const keyMatch = line.match(/^\s*"([^"]+)":/);
        if (keyMatch) {
            const key = keyMatch[1];
            if (keys[key]) {
                keys[key].push(index + 1);
            } else {
                keys[key] = [index + 1];
            }
        }
    });
    for (const key in keys) {
        if (keys[key].length > 1) {
            process.stdout.write(`Duplicate key "${key}" in language "${lang}"\n`);
        }
    }
}
