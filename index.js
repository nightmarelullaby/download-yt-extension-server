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
  const ls = runYtDlp(url, [...cookiesArgs, '--js-runtimes', 'node', '--print-json', '-q', '--skip-download']);
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

app.get('/api/get-formats', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  const ls = runYtDlp(url, [...cookiesArgs, '--js-runtimes', 'node', '-F', '--print-json', '-q', '--skip-download']);
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
                  const rawJson = JSON.parse(line);
                  const avFormats = rawJson.formats.filter(
                    f => (f.vcodec !== "none" && f.acodec !== "none") || f.format_id === '250' || f.format_id === '251'
                  );

                  return res.json(avFormats);

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
  const { url, type, format_id, resolution } = req.query;
  if (!url || typeof url !== 'string' || !url.startsWith('http') || !resolution) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

const ext = type === 'video' ? 'mp4' : 'webm';

  const videoFormat = format_id ? format_id : `bestvideo[ext=mp4][height=${resolution}]+bestaudio/best[ext=mp4][height<=${resolution}]`
  const audioFormat = resolution === 'high' && type === 'audio' ? 'bestaudio[ext=webm]' : 'worstaudio[ext=webm]'
  console.log("yt-dlp URL:", url);

  const ytdlp = runYtDlp(url, [
    ...cookiesArgs,
    '-o', '-',
    '-f',
    type === 'video' ? videoFormat : audioFormat,
    '--js-runtimes', 'node',
    '--no-progress',
    '--no-warnings',
    '--quiet',
    '--retries', 'infinite',
    '--fragment-retries', 'infinite',
    '--http-chunk-size', '1M',
    '--concurrent-fragments', '5',
    ...(type === 'video' ? ['--remux-video', 'mp4'] : ['--audio-format', 'mp3']),
  ]);

  ytdlp.stdout._readableState.highWaterMark = 1024 * 64;
  ytdlp.stderr._readableState.highWaterMark = 1024 * 16;


  ytdlp.stderr.on('data', data => {
    console.error('yt-dlp error:', data.toString());
  });

  ytdlp.on('close', code => {
    console.log(`yt-dlp process exited with code ${code}`);
  });

  res.writeHead(200, {
    'Content-Type': type === 'video' ? 'video/mp4' : 'audio/webm',
    'transfer-encoding': 'chunked',
    'Content-Disposition': `attachment; filename=download.${ext}`
  });

  ytdlp.stdout.pipe(res);
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;