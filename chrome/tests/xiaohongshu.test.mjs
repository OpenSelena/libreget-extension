import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { detectSupportedMediaUrl } from "../src/detect.js";
import { captureXiaohongshuVideo, readXiaohongshuVideo } from "../src/xiaohongshu.js";

const noteId = "0123456789abcdef01234567";
const noteUrl = `https://www.xiaohongshu.com/explore/${noteId}`;
const mediaHost = "https://sns-video.example.xhscdn.com";

function rendition(width, height, suffix, extra = {}) {
  return { width, height, audioCodec: "aac", masterUrl: `${mediaHost}/${suffix}.mp4`, ...extra };
}

function pageContext(streams, { id = noteId, url = noteUrl, type = "video" } = {}) {
  const noteDetailMap = {
    [id]: { note: { type, desc: 'Text with braces {"notice"}', video: { media: { stream: { EF5: streams } } } } },
  };
  return {
    URL,
    location: new URL(url),
    document: {
      scripts: [{
        textContent: `window.__INITIAL_STATE__={"other":undefined,"note":{"noteDetailMap":${JSON.stringify(noteDetailMap)}}};`,
      }],
    },
  };
}

function extract(context) {
  return runInNewContext(`(${readXiaohongshuVideo.toString()})("${noteId}")`, context);
}

test("desktop note pages are supported by the existing send action", () => {
  const url = `${noteUrl}?xsec_token=example&xsec_source=pc_feed`;
  assert.deepEqual(detectSupportedMediaUrl(url), {
    platform: "xiaohongshu", contentType: "post", supported: true, url,
  });
  assert.equal(detectSupportedMediaUrl("https://www.xiaohongshu.com/explore"), null);
});

test("the injected reader selects the highest combined portrait stream", async () => {
  const context = pageContext([
    rendition(720, 1280, "720"),
    rendition(2160, 3840, "low-bitrate", { avgBitrate: 9_000_000 }),
    rendition(2160, 3840, "4k", {
      avgBitrate: 12_000_000,
      backupUrls: ["http://sns-bak-v6.xhscdn.com/clip-4k.mp4"],
    }),
    rendition(1080, 1920, "1080"),
    rendition(4320, 7680, "silent", { audioCodec: "none" }),
  ]);
  const selected = await captureXiaohongshuVideo(17, noteId, async ({ target, func, args }) => {
    assert.deepEqual(target, { tabId: 17 });
    assert.deepEqual(args, [noteId]);
    assert.equal(func, readXiaohongshuVideo);
    return [{ result: extract(context) }];
  });
  assert.equal(selected.url, "https://sns-bak-v6.xhscdn.com/clip-4k.mp4");
  assert.equal(selected.width, 2160);
  assert.equal(selected.height, 3840);
});

test("only the current note and legitimate Xiaohongshu MP4 endpoints are accepted", () => {
  const unsafe = rendition(2160, 3840, "external", {
    masterUrl: "https://xhscdn.com.example.net/clip.mp4",
    backupUrls: ["https://user:password@sns-bak-v6.xhscdn.com/clip.mp4"],
  });
  const standard = rendition(720, 1280, "720");
  assert.equal(extract(pageContext([unsafe, standard])).url, `${mediaHost}/720.mp4`);
  assert.equal(extract(pageContext([unsafe])), null);
  assert.equal(extract(pageContext([standard], { id: "fedcba9876543210fedcba98" })), null);
  assert.equal(extract(pageContext([standard], { url: noteUrl.replace("www.xiaohongshu.com", "example.org") })), null);
  assert.equal(extract(pageContext([standard], { type: "normal" })), null);
});

test("an unavailable tab leaves the original page fallback available", async () => {
  const result = await captureXiaohongshuVideo(17, noteId, async () => {
    throw new Error("The tab navigated");
  });
  assert.equal(result, null);
});
