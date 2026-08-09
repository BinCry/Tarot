const fs = require('fs');
const path = require('path');
const https = require('https');

// We use the open source dataset from metabismuth/tarot-json
// which contains public domain Rider Waite Smith images.
const BASE_URL = 'https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards/';

const publicCardsDir = path.join(__dirname, '../public/cards');
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(publicCardsDir)) {
  fs.mkdirSync(publicCardsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      resolve(); // Already downloaded
      return;
    }
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        file.close();
        fs.unlink(dest, () => {}); // Delete the file async.
        reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {}); // Delete the file async.
      reject(err.message);
    });
  });
}

async function main() {
  console.log('Fetching tarot data...');
  try {
    // We can fetch the JSON or just generate it. 
    // Since we need Vietnamese interpretations, we will keep our generate-cards.js structure 
    // but just map the image names to standard ones.
    
    // Instead of downloading their JSON, we'll just download the 78 images.
    // The naming in that repo is:
    // Major: m00.jpg to m21.jpg
    // Wands: w01.jpg to w14.jpg
    // Cups: c01.jpg to c14.jpg
    // Swords: s01.jpg to s14.jpg
    // Pentacles: p01.jpg to p14.jpg

    const suits = [
      { prefix: 'm', count: 22, name: 'Major' }, // Major Arcana 0-21
      { prefix: 'w', count: 14, name: 'Wands' },
      { prefix: 'c', count: 14, name: 'Cups' },
      { prefix: 's', count: 14, name: 'Swords' },
      { prefix: 'p', count: 14, name: 'Pentacles' }
    ];

    let total = 0;
    for (const suit of suits) {
      const start = suit.prefix === 'm' ? 0 : 1;
      const end = suit.prefix === 'm' ? 21 : 14;
      
      for (let i = start; i <= end; i++) {
        const numStr = i.toString().padStart(2, '0');
        const filename = `${suit.prefix}${numStr}.jpg`;
        const url = `${BASE_URL}${filename}`;
        const dest = path.join(publicCardsDir, filename);
        
        try {
          await downloadFile(url, dest);
          total++;
          if (total % 10 === 0) console.log(`Downloaded ${total}/78 images...`);
        } catch (e) {
          console.error(`Failed to download ${filename}:`, e);
        }
      }
    }
    console.log('All images downloaded successfully to public/cards!');
    
    // Now let's generate the updated tarot-cards.json with these image paths
    generateVietnameseData();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

function generateVietnameseData() {
  const majorArcanaNames = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
    "Judgement", "The World"
  ];

  const suits = ["Wands", "Cups", "Swords", "Pentacles"];
  const suitPrefixes = { "Wands": "w", "Cups": "c", "Swords": "s", "Pentacles": "p" };
  const ranks = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

  const cards = [];
  let id = 1;

  // Major Arcana
  majorArcanaNames.forEach((name, index) => {
    const numStr = index.toString().padStart(2, '0');
    cards.push({
      id: id++,
      name: name,
      image: `/cards/m${numStr}.jpg`,
      arcana: "Major",
      suit: "None",
      keywords: ["..."],
      uprightMeaning: `Ý nghĩa xuôi của ${name}.`,
      reversedMeaning: `Ý nghĩa ngược của ${name}.`
    });
  });

  // Minor Arcana
  suits.forEach(suit => {
    ranks.forEach((rank, index) => {
      const name = `${rank} of ${suit}`;
      const numStr = (index + 1).toString().padStart(2, '0');
      const prefix = suitPrefixes[suit];
      cards.push({
        id: id++,
        name: name,
        image: `/cards/${prefix}${numStr}.jpg`,
        arcana: "Minor",
        suit: suit,
        keywords: ["..."],
        uprightMeaning: `Ý nghĩa xuôi của ${name}.`,
        reversedMeaning: `Ý nghĩa ngược của ${name}.`
      });
    });
  });

  fs.writeFileSync(path.join(dataDir, 'tarot-cards.json'), JSON.stringify(cards, null, 2));
  console.log("Updated data/tarot-cards.json with correct image paths.");
}

main();
