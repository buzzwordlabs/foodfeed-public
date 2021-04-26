/**
 * Rules:
 * 1. Minimum 2 characters
 * 2. Maximum 20 characters
 * 3. Only alphanumeric characters
 */
const usernameRegex = /^[a-zA-Z0-9]+([_-]?[a-zA-Z0-9]){2,20}$/;

/**
 * Rules:
 * 1. Minimum 8 characters
 * 2. Maximum 100 characters
 * 3. At least one uppercase letter
 * 4. At least one lowercase letter
 * 5. At least one number
 * 6. Only alphanumeric characters
 */
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[\w~@#$%^&*+=`|{}:;!.?\"()\[\]-]{8,100}$/;

export { usernameRegex, passwordRegex };
