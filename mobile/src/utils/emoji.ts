import { randomNumberFromRange } from "./random";

export enum PostReactionsStringIndexed {
  "like" = "❤️",
  "thumbs_up" = "👍",
  "yum" = "😋",
  "slight_smile" = "🙂",
  "smile" = "😄",
  "joy" = "😂",
  "blush_smile" = "😊",
  "heart_eyes" = "😍",
  "curry_rice" = "🍛",
  "bento_box" = "🍱",
  "salad" = "🥗",
  "peach" = "🍑",
  "hamburger" = "🍔",
  "pizza" = "🍕",
  "burrito" = "🌯",
  "taco" = "🌮",
  "hot_beverage" = "☕",
  "ice_cream" = "🍨",
  "fire" = "🔥",
}

export enum PostReactionsEmojiIndexed {
  "❤️" = "like",
  "👍" = "thumbs_up",
  "😋" = "yum",
  "🙂" = "slight_smile",
  "😄" = "smile",
  "😂" = "joy",
  "😊" = "blush_smile",
  "😍" = "heart_eyes",
  "🍛" = "curry_rice",
  "🍱" = "bento_box",
  "🥗" = "salad",
  "🍑" = "peach",
  "🍔" = "hamburger",
  "🍕" = "pizza",
  "🌯" = "burrito",
  "🌮" = "taco",
  "☕" = "hot_beverage",
  "🍨" = "ice_cream",
  "🔥" = "fire",
}

export type PostReaction = {
  postId: string;
  reaction: PostReactionStringOptions;
  count: number;
  reacted: boolean;
};

export type PostReactionStringOptions = keyof typeof PostReactionsStringIndexed;
export type PostReactionEmojisOptions = keyof typeof PostReactionsEmojiIndexed;

export const findReactionObjectFromArray = (
  reactionString: PostReactionStringOptions,
  postReactions: PostReaction[]
) => {
  const index = postReactions.findIndex(
    ({ reaction }) => reaction === reactionString
  );
  if (index === -1) return;
  const postReaction = postReactions[index];
  return { postReaction, index };
};

export const resolveReactionStringToEmoji = (
  string: PostReactionStringOptions
) => {
  if (Object.keys(PostReactionsStringIndexed).includes(string)) {
    return PostReactionsStringIndexed[string];
  }
};

export const getRandomHumanEmoji = () => {
  const humanEmojis = ["👍", "😋", "🙂", "😄", "😊", "😍"];
  return humanEmojis[randomNumberFromRange(humanEmojis.length - 1)];
};
