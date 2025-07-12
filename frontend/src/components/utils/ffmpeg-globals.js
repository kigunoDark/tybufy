import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

window.FFmpeg = FFmpeg;
window.fetchFile = fetchFile;
window.toBlobURL = toBlobURL;

export { FFmpeg, fetchFile, toBlobURL };