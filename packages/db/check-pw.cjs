require('dotenv').config({ path: '../../.env' });
const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL is missing!");
} else if (url.includes("[YOUR-PASSWORD]")) {
  console.log("You literally left the string '[YOUR-PASSWORD]' in the file!");
} else {
  console.log("Password seems to be filled in, but auth still fails.");
}
