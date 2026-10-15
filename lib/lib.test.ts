import { describe, expect, it } from "vitest";
import { build_library, fmt_time, natural_sort, srt_to_vtt } from "./files";
import { is_done, load_all, recent, save_pos, start_at } from "./progress";

function fake_file(path: string, size = 10) {
  const f = new File(["x".repeat(size)], path.split("/").pop()!, { lastModified: 1 });
  Object.defineProperty(f, "webkitRelativePath", { value: path });
  return f;
}

function fake_store() {
  const data: Record<string, string> = {};
  return { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) };
}

describe("files", () => {
  it("sorts like a human", () => {
    const names = ["10 outro.mp4", "2 setup.mp4", "1 intro.mp4"];
    expect(names.sort(natural_sort)).toEqual(["1 intro.mp4", "2 setup.mp4", "10 outro.mp4"]);
  });

  it("makes playlists from folders and finds subtitles", () => {
    const lib = build_library([
      fake_file("course/week 2/b.mp4"),
      fake_file("course/week 1/10 end.mp4"),
      fake_file("course/week 1/2 start.mp4"),
      fake_file("course/week 1/2 start.srt"),
      fake_file("course/notes.pdf"),
    ]);
    expect(lib.map((p) => p.name)).toEqual(["course / week 1", "course / week 2"]);
    expect(lib[0].items.map((v) => v.name)).toEqual(["2 start", "10 end"]);
    expect(lib[0].items[0].sub?.name).toBe("2 start.srt");
    expect(lib[0].items[1].sub).toBeUndefined();
  });

  it("loose files go in one list", () => {
    const f = new File(["x"], "clip.webm");
    expect(build_library([f])[0].name).toBe("loose videos");
  });

  it("changes srt to vtt", () => {
    const srt = "1\r\n00:00:01,500 --> 00:00:03,000\r\nhello\r\n";
    expect(srt_to_vtt(srt)).toBe("WEBVTT\n\n1\n00:00:01.500 --> 00:00:03.000\nhello\n");
  });

  it("formats time", () => {
    expect(fmt_time(65)).toBe("1:05");
    expect(fmt_time(3725)).toBe("1:02:05");
    expect(fmt_time(NaN)).toBe("0:00");
  });
});

describe("progress", () => {
  it("saves and loads", () => {
    const s = fake_store();
    save_pos("a", { pos: 30, len: 100, name: "a", folder: "f" }, s);
    expect(load_all(s).a.pos).toBe(30);
  });

  it("resumes a bit before, but not when done or barely started", () => {
    expect(start_at({ pos: 30, len: 100, at: 0, name: "", folder: "" })).toBe(27);
    expect(start_at({ pos: 95, len: 100, at: 0, name: "", folder: "" })).toBe(0);
    expect(start_at({ pos: 2, len: 100, at: 0, name: "", folder: "" })).toBe(0);
    expect(start_at(undefined)).toBe(0);
  });

  it("done at 92%", () => {
    expect(is_done({ pos: 92, len: 100, at: 0, name: "", folder: "" })).toBe(true);
    expect(is_done({ pos: 50, len: 100, at: 0, name: "", folder: "" })).toBe(false);
  });

  it("recent skips done ones, newest first", () => {
    const all = {
      a: { pos: 50, len: 100, at: 1, name: "a", folder: "" },
      b: { pos: 99, len: 100, at: 3, name: "b", folder: "" },
      c: { pos: 20, len: 100, at: 2, name: "c", folder: "" },
    };
    expect(recent(all).map(([k]) => k)).toEqual(["c", "a"]);
  });
});
