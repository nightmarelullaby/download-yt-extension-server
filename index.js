import express from 'express';
// import exec from 'yt-dlp-exec';
import cors from 'cors';
import { execFile } from 'child_process';
import path from 'path';

const app = express();
const port = 3000;

app.use(cors())

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if(!url) return res.status(400).json({ error: 'invalid url' });


execFile("./yt-dlp", [
  url,
  '--dump-single-json',
  '--no-warnings',
  '--no-call-home',
  '--no-check-certificate'
], (error, stdout, stderr) => {
  if (error) {
    console.error('yt-dlp error:', error);
    return;
  }
  try {
        const result = JSON.parse(stdout);
        const formats = result.formats.map(f => ({
            format_id: f.format_id,
            resolution: f.height ? `${f.height}p` : 'audio',
            ext: f.ext,
            filesize: f.filesize,
            codec: f.vcodec || f.acodec,
            url: f.url
        }));


      console.log(result)
    return res.json({ downloadUrl: formats });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

})

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;