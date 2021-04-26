import { passwordRegex, usernameRegex } from "./regex";

// @ts-ignore
import { isEmail } from "validator";
import { cleanOutgoingText } from "./pg13";

export const validateUsername = (username: string) => {
  const [cleanUsername, errorReason] = cleanOutgoingText({
    text: username,
    restrictProfane: true,
  });
  if (!errorReason) {
    return usernameRegex.test(cleanUsername);
  }
  return false;
};

export const validatePassword = (password: string) =>
  passwordRegex.test(password);

export const validatePersonName = (personName: string) =>
  personName.trim().length > 0 && personName.trim().length < 31;

export const validateEmail = (email: string) => isEmail(email);

export const validateBio = (bio: string) => {
  const [cleanBio, errorReason] = cleanOutgoingText({
    text: bio,
    restrictProfane: true,
  });
  if (errorReason) return false;
  return true;
};
