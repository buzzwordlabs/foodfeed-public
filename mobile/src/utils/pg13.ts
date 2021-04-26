import Filter from "bad-words";
type ErrorReasons = "too_short" | "bad_words" | "";

type CleanOutgoingTextArgs = {
  text: string;
  restrictProfane?: boolean;
  minimumLength?: number;
};

const profanityFilter = new Filter({ showHead: false, showTail: false });
profanityFilter.removeWords(...["homo"]);
profanityFilter.addWords(...["hoe", "fuckwad", "buttfuck"]);

export const cleanOutgoingText = ({
  text,
  restrictProfane,
  minimumLength,
}: CleanOutgoingTextArgs): [string, ErrorReasons] => {
  const cleanedText = text.replace(/^\s+|\s+$/, "");
  if (cleanedText.length === 0) return [cleanedText, "too_short"];
  if (minimumLength && cleanedText.length < minimumLength)
    [cleanedText, "too_short"];
  if (restrictProfane && profanityFilter.isProfane(cleanedText))
    return [cleanedText, "bad_words"];
  return [cleanedText, ""];
};

export const cleanIncomingText = (text: string) => {
  const cleanedText = profanityFilter.clean(text.replace(/^\s+|\s+$/, ""));
  return profanityFilter.clean(cleanedText);
};
