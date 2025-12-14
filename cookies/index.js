import path from 'node:path';

const __dirname = import.meta.dirname;
const cookiesPath = path.resolve(__dirname, 'c.txt');

export { cookiesPath }