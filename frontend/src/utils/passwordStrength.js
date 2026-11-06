const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "qwerty123",
  "qwertyuiop",
  "iloveyou",
  "abc12345",
  "matkhau123",
  "lofitalk",
]);

// 0 = too short / very weak … 4 = strong. Only a hint for the user; the server
// enforces the real rule (at least 8 characters).
export const scorePassword = (password = "") => {
  if (password.length < 8) return 0;
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 1;
  if (/^(.)\1+$/.test(password)) return 1;

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(password)
  ).length;

  let score = 1;
  if (password.length >= 12) score += 1;
  if (classes >= 2) score += 1;
  if (classes >= 3 && password.length >= 10) score += 1;
  return Math.min(score, 4);
};
