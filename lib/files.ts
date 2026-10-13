// turning a pile of picked files into a library (folders = playlists)

export const VIDEO_EXT = ["mp4", "webm", "mkv", "mov", "m4v", "ogv"];
export const SUB_EXT = ["vtt", "srt"];

export type video_item = {
  key: string; // stable id for saving progress
  name: string; // file name without extension
  folder: string;
  file: File;
  sub?: File;
};

export type playlist = {
  name: string;
  items: video_item[];
};

export function ext_of(name: string) {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

export function base_of(name: string) {
  const i = name.lastIndexOf(".");
  return i < 0 ? name : name.slice(0, i);
}

// "2 intro" before "10 outro", like a human would sort
export function natural_sort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

// same file picked again later gets the same key, so progress comes back
export function key_of(path: string, f: { size: number; lastModified: number }) {
  return `${path}|${f.size}|${f.lastModified}`;
}

export function path_of(f: File) {
  // webkitRelativePath is set when a whole folder is picked
  const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath;
  return rel || f.name;
}

export function folder_of(path: string) {
  const parts = path.split("/");
  parts.pop();
  return parts.length ? parts.join(" / ") : "loose videos";
}

export function build_library(files: File[]): playlist[] {
  const subs = new Map<string, File>();
  for (const f of files) {
    if (SUB_EXT.includes(ext_of(f.name))) subs.set(base_of(path_of(f)), f);
  }

  const by_folder = new Map<string, video_item[]>();
  for (const f of files) {
    if (!VIDEO_EXT.includes(ext_of(f.name))) continue;
    const path = path_of(f);
    const folder = folder_of(path);
    const item: video_item = {
      key: key_of(path, f),
      name: base_of(f.name),
      folder,
      file: f,
      sub: subs.get(base_of(path)),
    };
    if (!by_folder.has(folder)) by_folder.set(folder, []);
    by_folder.get(folder)!.push(item);
  }

  return [...by_folder.entries()]
    .map(([name, items]) => ({ name, items: items.sort((a, b) => natural_sort(a.file.name, b.file.name)) }))
    .sort((a, b) => natural_sort(a.name, b.name));
}

// browsers only understand vtt subtitles, so srt gets changed a bit
export function srt_to_vtt(srt: string) {
  const body = srt
    .replace(/\r\n?/g, "\n")
    .replace(/^﻿/, "")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
    .trim();
  return "WEBVTT\n\n" + body + "\n";
}

export function fmt_time(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return (h ? `${h}:` : "") + `${mm}:${String(s).padStart(2, "0")}`;
}
