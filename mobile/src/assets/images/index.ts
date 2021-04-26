import FastImage from "react-native-fast-image";
export * from "./logo";
export * from "./vectors";

const eatWithNewPeople = "https://i.imgur.com/WfiMUKW.png";
const watchLiveStreams = "https://i.imgur.com/MYM2nZ0.jpg";
const streamYourself = "https://i.imgur.com/rr77Zb6.jpg";
const avatarPlaceholder = "https://i.imgur.com/3tCZe6G.gif";

const preloadedImages = [
  eatWithNewPeople,
  watchLiveStreams,
  streamYourself,
  avatarPlaceholder,
].map((uri) => ({ uri }));
FastImage.preload(preloadedImages);

export {
  avatarPlaceholder,
  eatWithNewPeople,
  watchLiveStreams,
  streamYourself,
};
