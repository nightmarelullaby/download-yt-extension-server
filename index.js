import express from 'express';
import cors from 'cors';
import { runYtDlp } from './utils/ytdlp.js';
import { cookiesPath } from './cookies/index.js';
const app = express();
const port = 3000;

app.use(cors({
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}));

const cookiesArgs = [
    '--cookies', cookiesPath,
    '--js-runtimes', 'node'
]
console.log(cookiesPath)

app.get('/api/get-info', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  const ls = runYtDlp(url, [...cookiesArgs, '--print-json', '-q', '--skip-download']);
  console.log('Getting info...!')
  try {
    let buffer = '';
    ls.stdout.on('data', async (data) => {
        buffer += data.toString();

        let lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
            if (line.trim()) {
              try {
                  const obj = JSON.parse(line);
                  return res.json(obj);

              } catch (err) {
                  console.error('Invalid JSON line:', line);
              }
            }
        }
    })
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/download', async (req, res) => {
  const { url, type } = req.query;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  console.log(url, type)
  const ytdlp = runYtDlp(url, [
    ...cookiesArgs,
    '-o', '-',
    '-f', `${type === 'video' ? '94' : 'bestaudio[ext=webm]'}`,
    '--no-progress',
    '--no-warnings',
    '--quiet',
  ]);

  res.writeHead(200,
    {
      'Content-Type': type === 'video' ? 'video/mp4' : 'audio/mpeg',
      'transfer-encoding': 'chunked',
      'content-disposition':`attachment; filename=audio.${type === 'video' ? 'mp4' : 'mp3'}`
    })
  ytdlp.stdout.pipe(res)
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;