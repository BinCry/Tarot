const fs = require('fs');
const path = require('path');

const majorArcanaNames = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World"
];

const suits = ["Wands", "Cups", "Swords", "Pentacles"];
const ranks = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

const cards = [];
let id = 1;

// Major Arcana
majorArcanaNames.forEach((name, index) => {
  cards.push({
    id: id++,
    name: name,
    image: `/cards/major-${index}.jpg`,
    arcana: "Major",
    suit: "None",
    keywords: ["...", "..."],
    uprightMeaning: `Ý nghĩa xuôi của ${name}.`,
    reversedMeaning: `Ý nghĩa ngược của ${name}.`
  });
});

// Minor Arcana
suits.forEach(suit => {
  ranks.forEach((rank, index) => {
    const name = `${rank} of ${suit}`;
    cards.push({
      id: id++,
      name: name,
      image: `/cards/${suit.toLowerCase()}-${index + 1}.jpg`,
      arcana: "Minor",
      suit: suit,
      keywords: ["...", "..."],
      uprightMeaning: `Ý nghĩa xuôi của ${name}.`,
      reversedMeaning: `Ý nghĩa ngược của ${name}.`
    });
  });
});

const dir = path.join(__dirname, 'data');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

fs.writeFileSync(path.join(dir, 'tarot-cards.json'), JSON.stringify(cards, null, 2));
console.log("Generated 78 cards.");
