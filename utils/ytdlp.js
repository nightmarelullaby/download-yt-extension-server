import {spawn} from 'child_process';

function runYtDlp(url, args) {
  return spawn('yt-dlp', args.concat([url]));
}

export {runYtDlp}