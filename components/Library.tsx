"use client";

import { useState } from "react";
import type { playlist } from "@/lib/files";
import { is_done, pct, type progress_entry } from "@/lib/progress";

type props = {
  lists: playlist[];
  progress: Record<string, progress_entry>;
  current?: string;
  on_play: (key: string) => void;
};

export default function Library({ lists, progress, current, on_play }: props) {
  const [q, set_q] = useState("");
  const [closed, set_closed] = useState<Record<string, boolean>>({});
  const needle = q.trim().toLowerCase();

  return (
    <aside className="side">
      <input className="search" placeholder="search videos" value={q} onChange={(e) => set_q(e.target.value)} />
      {lists.map((pl) => {
        const items = needle ? pl.items.filter((v) => v.name.toLowerCase().includes(needle)) : pl.items;
        if (!items.length) return null;
        const done = pl.items.filter((v) => is_done(progress[v.key])).length;
        const open = needle ? true : !closed[pl.name];
        return (
          <section key={pl.name} className="mb-3">
            <button className="pl_head" onClick={() => set_closed({ ...closed, [pl.name]: open })}>
              <span>{open ? "▾" : "▸"} {pl.name}</span>
              <span className="muted text-xs">{done}/{pl.items.length}</span>
            </button>
            {open && (
              <ul>
                {items.map((v) => {
                  const p = progress[v.key];
                  return (
                    <li key={v.key}>
                      <button className={`item ${v.key === current ? "now" : ""}`} onClick={() => on_play(v.key)} title={v.name}>
                        <span className="truncate">{is_done(p) ? "✓ " : ""}{v.name}</span>
                        {v.sub && <span className="cc">cc</span>}
                        <span className="bar"><span style={{ width: `${pct(p)}%` }} /></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </aside>
  );
}
