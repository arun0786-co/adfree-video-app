# adfree

a video player for your own videos. no ads, no tracking, nothing gets uploaded.

i made it because i download courses and lectures and wanted something nicer than the normal file player: playlists, resume where i stopped, speed control, subtitles.

## features

- open a folder, every sub folder becomes a playlist (like `course/week 1`, `course/week 2`)
- sorts like a human: `2 intro` comes before `10 outro`
- remembers where you stopped in every video (saved in your browser only)
- "continue watching" list
- speed 0.5x to 3x, remembered
- subtitles: put `video.srt` or `video.vtt` next to `video.mp4` and it loads by itself
- auto next video in the playlist
- shortcuts like youtube:

| key | does |
| --- | --- |
| space / k | play, pause |
| j / l | back / forward 10 sec |
| ← / → | back / forward 5 sec |
| [ / ] | slower / faster |
| f | fullscreen |
| m | mute |
| n / p | next / prev video |
| c | subtitles on / off |

plays whatever your browser can play: mp4, webm, mov, mkv (mkv works in chrome / edge most of the time).

## run it

```
npm install
npm run dev
```

open http://localhost:3000

## put it online

`npm run build` makes a static site in `out/`. upload that folder to vercel, netlify or github pages. it has no server, the videos never leave the persons computer.

## tests

```
npm test
```

## todo

- remember the folder after a page reload (chrome can do this with the file system api)
- thumbnails
- notes / bookmarks at a time in the video
