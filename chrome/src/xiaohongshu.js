export function xiaohongshuNoteId(url) {
  try {
    const page = new URL(url);
    if (page.origin === "https://www.xiaohongshu.com") {
      return /^\/explore\/([a-f0-9]{24})\/?$/.exec(page.pathname)?.[1] ?? null;
    }
  } catch {}
  return null;
}

// This function is serialized by scripting.executeScript and runs in the
// extension's isolated world. Only the active note's media is returned.
export function readXiaohongshuVideo(noteId) {
  if (
    location.origin !== "https://www.xiaohongshu.com" ||
    location.pathname.replace(/\/$/, "") !== `/explore/${noteId}`
  ) {
    return null;
  }
  const script = Array.from(document.scripts, (item) => item.textContent ?? "")
    .find((text) => /window\.__INITIAL_STATE__\s*=/.test(text));
  const marker = /"noteDetailMap"\s*:\s*(?=\{)/.exec(script ?? "");
  if (!marker) return null;

  // The surrounding initial state can contain JS literals such as undefined.
  // Read the note map as data, without executing any page-supplied code.
  const source = script.slice(marker.index + marker[0].length);
  let depth = 0;
  let quoted = false;
  let escaped = false;
  let end = 0;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') {
      quoted = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}" && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  if (!end) return null;

  let note;
  try {
    note = JSON.parse(source.slice(0, end))[noteId]?.note;
  } catch {
    return null;
  }
  if (note?.type !== "video") return null;
  const streams = Object.values(note.video?.media?.stream ?? {}).flat()
    .filter((item) => item?.width > 0 && item.height > 0
      && typeof item.audioCodec === "string" && item.audioCodec !== "" && item.audioCodec !== "none")
    .sort((a, b) => b.width * b.height - a.width * a.height
      || (b.avgBitrate ?? 0) - (a.avgBitrate ?? 0));
  for (const stream of streams) {
    const backups = Array.isArray(stream.backupUrls) ? stream.backupUrls : [];
    for (const candidate of [...backups, stream.masterUrl]) {
      try {
        const url = new URL(candidate);
        if (
          ["https:", "http:"].includes(url.protocol) &&
          url.hostname.endsWith(".xhscdn.com") &&
          !url.username && !url.password && !url.port &&
          url.pathname.endsWith(".mp4")
        ) {
          url.protocol = "https:";
          return { url: url.href, width: stream.width, height: stream.height };
        }
      } catch {}
    }
  }
  return null;
}

export async function captureXiaohongshuVideo(tabId, noteId, executeScript) {
  if (typeof tabId !== "number" || !noteId || !executeScript) return null;
  try {
    const [reply] = await executeScript({
      target: { tabId },
      func: readXiaohongshuVideo,
      args: [noteId],
    });
    return reply?.result ?? null;
  } catch {
    return null;
  }
}
