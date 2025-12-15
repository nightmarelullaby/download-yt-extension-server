import {spawn} from 'child_process';

function runYtDlp(url, args) {

  return spawn('yt-dlp', args.concat([url]),{
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

}

export {runYtDlp}