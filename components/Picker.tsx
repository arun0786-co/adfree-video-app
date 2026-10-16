"use client";

import { useEffect, useRef, useState } from "react";

type props = {
  on_files: (files: File[]) => void;
  big?: boolean;
};

// open a folder (keeps sub folders as playlists) or just some files. also drag and drop.
export default function Picker({ on_files, big }: props) {
  const folder_ref = useRef<HTMLInputElement>(null);
  const files_ref = useRef<HTMLInputElement>(null);
  const [drag, set_drag] = useState(false);

  useEffect(() => {
    // react has no prop for this, so set it by hand
    folder_ref.current?.setAttribute("webkitdirectory", "");
  }, []);

  useEffect(() => {
    if (!big) return;
    const over = (e: DragEvent) => {
      e.preventDefault();
      set_drag(true);
    };
    const leave = () => set_drag(false);
    const drop = (e: DragEvent) => {
      e.preventDefault();
      set_drag(false);
      const list = e.dataTransfer?.files;
      if (list?.length) on_files([...list]);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [big, on_files]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) on_files([...list]);
    e.target.value = ""; // so picking the same folder again still works
  };

  const buttons = (
    <div className="flex flex-wrap gap-2 justify-center">
      <button className="btn" onClick={() => folder_ref.current?.click()}>open folder</button>
      <button className="btn ghost" onClick={() => files_ref.current?.click()}>open files</button>
      <input ref={folder_ref} type="file" multiple hidden onChange={pick} />
      <input ref={files_ref} type="file" multiple hidden accept="video/*,.mkv,.srt,.vtt" onChange={pick} />
    </div>
  );

  if (!big) return buttons;

  return (
    <div className={`drop ${drag ? "on" : ""}`}>
      <h2 className="text-2xl font-bold mb-2">your videos, no ads</h2>
      <p className="muted mb-6 max-w-md text-center">
        open a folder of videos (a course, a series, your downloads). every sub folder becomes a playlist.
        nothing is uploaded, it all plays right here in your browser.
      </p>
      {buttons}
      <p className="muted text-sm mt-4">or drop video files anywhere on this page</p>
    </div>
  );
}
