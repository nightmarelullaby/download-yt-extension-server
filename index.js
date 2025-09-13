import express from 'express';
import ytdl from 'ytdl-core';
import exec from 'yt-dlp-exec';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors())

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if(!url) return res.status(400).json({ error: 'invalid url' });

  try {
      const result = await exec(url, {
          dumpSingleJson: true,
          noWarnings: true,
          noCallHome: true,
          noCheckCertificate: true
      });

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

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;