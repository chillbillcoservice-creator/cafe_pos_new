
const fs = require('fs');
const content = fs.readFileSync('c:/Users/admin/Desktop/UPDATED_POS-20260118T134210Z-1-001/UPDATED_POS/cafe_pos_new-main/src/lib/translations.ts', 'utf8');

const key = "Cancel Reservation";
const matches = content.matchAll(/\s+([a-z]{2}):\s*\{([\s\S]*?)\},/g);
for (const match of matches) {
    const lang = match[1];
    const block = match[2];
    const lines = block.split('\n');
    let count = 0;
    lines.forEach((line, index) => {
        if (line.includes(`"${key}":`)) {
            count++;
            console.log(`Found "${key}" in "${lang}" at block relative line ${index + 1}`);
        }
    });
    if (count > 1) {
        console.log(`DUPLICATE "${key}" IN "${lang}"!`);
    }
}
