import express from 'express';
import cors from 'cors';
import ytdl from '@distube/ytdl-core';

const app = express();
const port = 3000;

const cookies = [
  { name: "VISITOR_INFO1_LIVE", value: "rwGXRtO2Kbs" },
  { name: "YSC", value: "rfRkGOKwCRI" }
];

const agentOptions = {
  pipelining: 5,
  maxRedirections: 0
};

const agent = ytdl.createAgent(cookies, agentOptions);

app.use(cors());

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  console.log('new api download!');

  try {
    const info = await ytdl.getInfo(url, { agent });

    const formats = info.formats.map(f => ({
      itag: f.itag,
      resolution: f.height ? `${f.height}p` : 'audio',
      ext: f.container,
      filesize: f.contentLength ? parseInt(f.contentLength) : null,
      codec: f.codecs,
      url: f.url
    }));

    return res.json({ downloadUrl: formats });
  } catch (err) {
    console.error('ytdl error:', err);
    return res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;