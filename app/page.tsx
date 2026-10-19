"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Library from "@/components/Library";
import Picker from "@/components/Picker";
import Player from "@/components/Player";
import { build_library, fmt_time, type playlist } from "@/lib/files";
import { load_all, recent, type progress_entry } from "@/lib/progress";

export default function Home() {
  const [lists, set_lists] = useState<playlist[]>([]);
  const [current, set_current] = useState<string>();
  const [progress, set_progress] = useState<Record<string, progress_entry>>({});

  const reload = useCallback(() => set_progress(load_all()), []);
  useEffect(reload, [reload]);

  const flat = useMemo(() => lists.flatMap((pl) => pl.items), [lists]);
  const idx = flat.findIndex((v) => v.key === current);
  const item = idx >= 0 ? flat[idx] : undefined;
  // next / prev stay inside the same playlist
  const same = (j: number) => j >= 0 && j < flat.length && item && flat[j].folder === item.folder;

  const on_files = useCallback((files: File[]) => {
    const lib = build_library(files);
    set_lists(lib);
    set_current(undefined);
  }, []);

  const go_on = recent(progress).filter(([k]) => flat.some((v) => v.key === k));
  const total = flat.length;

  return (
    <div className="app">
      <header className="top">
        <span className="font-bold text-lg">adfree</span>
        <span className="muted text-sm hidden sm:inline">your own videos. no ads, no tracking.</span>
        <div className="ml-auto">{total > 0 && <Picker on_files={on_files} />}</div>
      </header>

      {total === 0 ? (
        <Picker on_files={on_files} big />
      ) : (
        <div className="main">
          <Library lists={lists} progress={progress} current={current} on_play={set_current} />
          <section className="stage">
            {item ? (
              <Player
                item={item}
                saved={progress[item.key]}
                has_prev={!!same(idx - 1)}
                has_next={!!same(idx + 1)}
                on_prev={() => set_current(flat[idx - 1].key)}
                on_next={() => set_current(flat[idx + 1].key)}
                on_saved={reload}
              />
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-1">{total} videos in {lists.length} playlist{lists.length === 1 ? "" : "s"}</h2>
                <p className="muted mb-6">pick a video on the left.</p>
                {go_on.length > 0 && (
                  <>
                    <h3 className="font-semibold mb-2">continue watching</h3>
                    <div className="cards">
                      {go_on.map(([k, p]) => (
                        <button key={k} className="card" onClick={() => set_current(k)}>
                          <b className="truncate block">{p.name}</b>
                          <span className="muted text-xs truncate block">{p.folder}</span>
                          <span className="muted text-xs">{fmt_time(p.pos)} / {fmt_time(p.len)}</span>
                          <span className="bar mt-2"><span style={{ width: `${(100 * p.pos) / p.len}%` }} /></span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
