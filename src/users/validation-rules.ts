/** International format, e.g. +22901020304 */
export const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
/** 8 to 72 characters (bcrypt limit), at least one letter and one digit. */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;