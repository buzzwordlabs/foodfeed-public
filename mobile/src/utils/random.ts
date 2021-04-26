import FastImage from "react-native-fast-image";

export const randomNumberFromRange = (max: number) =>
  Math.floor(Math.random() * max) + 1;
export const getRandomQuirkyPhrase = () =>
  QUIRKY_PHRASES[randomNumberFromRange(10)];

export const getRandomGif = () =>
  FOOD_GIFS[randomNumberFromRange(Object.keys(FOOD_GIFS).length)];

export const getRandomFoodEmoji = () =>
  FOOD_EMOJIS[randomNumberFromRange(Object.keys(FOOD_EMOJIS).length)];

const FOOD_EMOJIS = [
  "🌮",
  "🌯",
  "🥓",
  "🥩",
  "🍗",
  "🍖",
  "🌭",
  "🍔",
  "🍟",
  "🍕",
  "🥪",
  "🥙",
  "🥗",
  "🥘",
  "🥫",
  "🍝",
  "🍜",
  "🍲",
  "🍛",
  "🍣",
  "🍱",
  "🥟",
  "🍳",
  "🧈",
  "🥞",
  "🧇",
];

const QUIRKY_PHRASES: { [index: number]: string } = {
  1: "Let's Taco Lot 🌮",
  2: "Cool Cookie 🍪",
  3: "Fortune Finder 🥠",
  4: "Let The Light Dim Sum 🥟",
  5: "Bring Home The Bacon 🥓",
  6: "I'm All Ears 🌽",
  7: "Just Peachy 🍑",
  8: "Keep It Short(cake) 🍰",
  9: "Quit Wining 🍷",
  10: "Don't Be Chicken 🍗",
};

const FOOD_GIFS: { [index: number]: string } = {
  1: "https://media.giphy.com/media/K4x1ZL36xWCf6/giphy.gif",
  2: "https://media.giphy.com/media/8MObiTsZrFlTi/giphy.gif",
  3: "https://media.giphy.com/media/eSQKNSmg07dHq/giphy.gif",
  4: "https://media.giphy.com/media/NV0eJfb73OB1K/giphy.gif",
  5: "https://media.giphy.com/media/l0O9yqyFbuxZoBifu/giphy.gif",
  6: "https://media.giphy.com/media/ERHjRf12yMGC4/giphy.gif",
  7: "https://media.giphy.com/media/SasDDqOSRclNu/giphy.gif",
  8: "https://media.giphy.com/media/fo6vEEeAutQWI/giphy.gif",
  9: "https://media.giphy.com/media/es4W3DeganNXa/giphy.gif",
  10: "https://media.giphy.com/media/JoyLs2iIFCUMdsY7Ho/giphy.gif",
};

const SEARCHING_GIFS: { [index: number]: string } = {
  1: "https://media.giphy.com/media/l2SpZkQ0XT1XtKus0/giphy.gif",
  2: "https://media.giphy.com/media/OQrx03s8VwOl7XmfiZ/giphy.gif",
  3: "https://media.giphy.com/media/l2JdTbYjJdLrJtsnS/giphy.gif",
};

const WAITING_GIFS: { [index: number]: string } = {
  1: "https://media.giphy.com/media/26n6xBpxNXExDfuKc/giphy.gif",
  2: "https://media.giphy.com/media/4NnTap3gOhhlik1YEw/giphy.gif",
  3: "https://media.giphy.com/media/AMSUrxqH4vxPW/giphy.gif",
  4: "https://media.giphy.com/media/o5oLImoQgGsKY/giphy.gif",
};

const preloadedGifs = [
  ...Object.values(FOOD_GIFS).map((uri) => ({ uri })),
  ...Object.values(SEARCHING_GIFS).map((uri) => ({ uri })),
  ...Object.values(WAITING_GIFS).map((uri) => ({ uri })),
  { uri: "https://i.imgur.com/3tCZe6G.gif" },
];

FastImage.preload(preloadedGifs);

export const getSearchingGif = () =>
  SEARCHING_GIFS[randomNumberFromRange(Object.keys(SEARCHING_GIFS).length)];

export const getWaitingGif = () =>
  WAITING_GIFS[randomNumberFromRange(Object.keys(WAITING_GIFS).length)];
