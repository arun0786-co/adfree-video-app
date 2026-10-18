"use client";

import { useEffect, useRef, useState } from "react";
import { ext_of, fmt_time, srt_to_vtt, type video_item } from "@/lib/files";
import { save_pos, start_at, type progress_entry } from "@/lib/progress";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const SPEED_KEY = "adfree_speed";

type props = {
  item: video_item;
  saved?: progress_entry;
  has_prev: boolean;
  has_next: boolean;
  on_prev: () => void;
  on_next: () => void;
  on_saved: () => void;
};

function load_speed() {
  try {
    return Number(localStorage.getItem(SPEED_KEY)) || 1;
  } catch {
    return 1;
  }
}

export default function Player({ item, saved, has_prev, has_next, on_prev, on_next, on_saved }: props) {
  const vid = useRef<HTMLVideoElement>(null);
  const last_save = useRef(0);
  const note_timer = useRef(0);
  const [src, set_src] = useState("");
  const [sub_src, set_sub_src] = useState("");
  const [speed, set_speed] = useState(1);
  const [auto_next, set_auto_next] = useState(true);
  const [note, set_note] = useState("");

  useEffect(() => set_speed(load_speed()), []);

  // make a local url for the file, and clean it up after
  useEffect(() => {
    const url = URL.createObjectURL(item.file);
    set_src(url);
    return () => URL.revokeObjectURL(url);
  }, [item]);

  useEffect(() => {
    let url = "";
    let gone = false;
    set_sub_src("");
    if (item.sub) {
      item.sub.text().then((txt) => {
        if (gone) return;
        const vtt = ext_of(item.sub!.name) === "srt" ? srt_to_vtt(txt) : txt;
        url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
        set_sub_src(url);
      });
    }
    return () => {
      gone = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [item]);

  useEffect(() => {
    if (vid.current) vid.current.playbackRate = speed;
  }, [speed, src]);

  const save = (force = false) => {
    const v = vid.current;
    if (!v || !v.duration) return;
    const now = Date.now();
    if (!force && now - last_save.current < 3000) return;
    last_save.current = now;
    save_pos(item.key, { pos: v.currentTime, len: v.duration, name: item.name, folder: item.folder });
    on_saved();
  };

  // small text over the video for a second
  const flash = (text: string) => {
    set_note(text);
    window.clearTimeout(note_timer.current);
    note_timer.current = window.setTimeout(() => set_note(""), 900);
  };

  const change_speed = (s: number) => {
    const next = Math.min(3, Math.max(0.25, Math.round(s * 100) / 100));
    set_speed(next);
    try {
      localStorage.setItem(SPEED_KEY, String(next));
    } catch {}
    flash(`speed ${next}x`);
  };

  // keyboard shortcuts, like youtube
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const v = vid.current;
      if (!v || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") {
        e.preventDefault();
        if (v.paused) v.play();
        else v.pause();
      } else if (k === "arrowleft" || k === "j") {
        v.currentTime = Math.max(0, v.currentTime - (k === "j" ? 10 : 5));
        flash(k === "j" ? "-10s" : "-5s");
      } else if (k === "arrowright" || k === "l") {
        v.currentTime = Math.min(v.duration || 0, v.currentTime + (k === "l" ? 10 : 5));
        flash(k === "l" ? "+10s" : "+5s");
      } else if (k === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else v.requestFullscreen?.();
      } else if (k === "m") {
        v.muted = !v.muted;
        flash(v.muted ? "muted" : "sound on");
      } else if (k === "]" || k === ">") {
        change_speed(speed + 0.25);
      } else if (k === "[" || k === "<") {
        change_speed(speed - 0.25);
      } else if (k === "n" && has_next) {
        on_next();
      } else if (k === "p" && has_prev) {
        on_prev();
      } else if (k === "c" && v.textTracks[0]) {
        const t = v.textTracks[0];
        t.mode = t.mode === "showing" ? "hidden" : "showing";
        flash(t.mode === "showing" ? "subtitles on" : "subtitles off");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  return (
    <div>
      <div className="relative">
        <video
          ref={vid}
          key={src}
          src={src}
          controls
          autoPlay
          className="video"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            v.playbackRate = speed;
            const t = start_at(saved);
            if (t) {
              v.currentTime = t;
              flash(`resumed at ${fmt_time(t)}`);
            }
          }}
          onTimeUpdate={() => save()}
          onPause={() => save(true)}
          onEnded={() => {
            save(true);
            if (auto_next && has_next) on_next();
          }}
        >
          {sub_src && <track kind="subtitles" src={sub_src} srcLang="en" label="subtitles" default />}
        </video>
        {note && <div className="note">{note}</div>}
      </div>

      <div className="tools">
        <h1 className="text-lg font-semibold truncate flex-1" title={item.name}>{item.name}</h1>
        <button className="btn ghost" disabled={!has_prev} onClick={on_prev}>prev</button>
        <button className="btn ghost" disabled={!has_next} onClick={on_next}>next</button>
        <select value={speed} onChange={(e) => change_speed(Number(e.target.value))} className="sel" title="speed">
          {SPEEDS.includes(speed) ? null : <option value={speed}>{speed}x</option>}
          {SPEEDS.map((s) => <option key={s} value={s}>{s}x</option>)}
        </select>
        <label className="muted text-sm flex items-center gap-1">
          <input type="checkbox" checked={auto_next} onChange={(e) => set_auto_next(e.target.checked)} /> auto next
        </label>
      </div>
      <p className="muted text-xs mt-1">
        {item.folder} &middot; keys: space play/pause, j/l 10s, arrows 5s, [ ] speed, f fullscreen, m mute, n/p next/prev, c subtitles
      </p>
    </div>
  );
}
