/* globals YT */

import { render, html } from "https://cdn.jsdelivr.net/npm/lit-html@3/+esm";

const youtubeScript = document.createElement("script");
youtubeScript.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(youtubeScript, firstScriptTag);
let player;

const $home = document.querySelector("#home");
const $app = document.querySelector("#app");
const $transcript = document.querySelector("#transcript");
const config = await fetch("config.json").then((r) => r.json());

let transcriptData;

const homePage = html`
  <h1 class="display-1 my-5 text-center">Video Highlights</h1>

  <p class="text-center display-6">Search with Gen AI. Get answers directly, with citations.</p>
  <div class="mx-auto my-5" style="max-width: 30rem">
    <p>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
  </div>

  <div class="demos row row-cols-1 row-cols-sm-2 row-cols-lg-3">
    ${Object.entries(config.demos).map(
      ([key, demo]) => html`
        <div class="col py-3">
          <a class="demo card h-100 text-decoration-none" href="#?${new URLSearchParams({ id: key })}">
            <div class="card-body">
              <h5 class="card-title">${demo.title}</h5>
              <p class="card-text">
                <img class="img-fluid" src="https://img.youtube.com/vi/${demo.youtube}/0.jpg" />
              </p>
            </div>
          </a>
        </div>
      `,
    )}
  </div>
`;

const renderSegment = ({ id, start, text, avg_logprob }) =>
  html`<span data-start="${start}" data-id="${id}" data-logprob="${avg_logprob}">${text}</span>`;

async function renderApp(demo) {
  transcriptData = await fetch(demo.transcript).then((r) => r.json());

  // Group segments into paragraphs that end with ?, ! or .
  const paragraphs = [[]];
  for (const segment of transcriptData.segments) {
    paragraphs.at(-1).push(segment);
    if (segment.text.match(/[.?!]\s*$/)) paragraphs.push([]);
  }

  render(
    html`
      <h2 class="my-3">Transcript</h2>
      ${paragraphs.map((segments) => html`<p>${segments.map(renderSegment)}</p>`)}
    `,
    $transcript,
  );
  player.cueVideoById(demo.youtube);

  transcriptData.segments.forEach((segment) => {
    segment.element = $transcript.querySelector(`[data-id="${segment.id}"]`);
  });
}

// When a segment is clicked, jump to that segment in the video
$transcript.addEventListener("click", (e) => {
  const $segment = e.target.closest("[data-start]");
  if ($segment) player.seekTo($segment.dataset.start, true);
});

const errorPage = html`
  <div class="alert alert-danger alert-dismissible my-5 text-center" role="alert">
    <h4 class="alert-heading">Demo not found.</h4>
    <div>Please try another one.</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
`;

function show(ids) {
  for (const [id, show] of Object.entries(ids)) document.getElementById(id).classList.toggle("d-none", !show);
  window.scrollTo(0, 0);
}

async function redraw() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const id = hash.get("id");
  const demo = config.demos[id];
  // TODO: Clear the app, since YouTube API might mess things upp
  // Render the home page if no id is provided
  if (!id) {
    show({ home: true, screen: false, app: false });
    render(homePage, $home);
  }
  if (id && !demo) {
    show({ home: true, screen: false, app: false });
    render([errorPage, homePage], $app);
  }
  // Render the demo page if id is provided, possibly with an error
  if (id && demo) {
    show({ home: false, screen: true, app: true });
    await renderApp(demo);
  }
}

window.addEventListener("hashchange", redraw);

window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("video", {
    height: "360",
    width: "640",
    playerVars: { autoplay: 0, playsinline: 1, modestbranding: 1, rel: 0 },
    events: {
      onReady: () => {
        $home.innerHTML = "";
        redraw();
      },
      onStateChange: onPlayerStateChange,
    },
  });
};

let videoPlayingInterval;
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    videoPlayingInterval = setInterval(updatePosition, 200);
    updatePosition();
  } else clearInterval(videoPlayingInterval);
}

function updatePosition() {
  const time = player.getCurrentTime();
  // find the segment that contains this time
  const segment = transcriptData.segments.find((seg) => seg.start <= time && time < seg.end);
  if (segment) {
    transcriptData.segments.forEach((seg) => seg.element.classList.toggle("highlight", seg === segment));
    // segment.element.scrollIntoView({ block: "center" });
  }
}
