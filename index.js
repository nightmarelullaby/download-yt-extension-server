import express from 'express';
import cors from 'cors';
import path from 'path';
import {spawn} from 'child_process';
const app = express();
const port = 3000;

app.use(cors());

function runYtDlp(url, args) {
  return spawn('yt-dlp', args.concat([url]));
}

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  const ls = runYtDlp(url, ['--print-json', '-q', '--skip-download']);
  console.log('here!')
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

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;