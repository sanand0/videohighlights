# Video Highlights

A demo showing how LLMs can transcribe and personalize videos for different audiences.

Deployed at [Video Highlights](https://sanand0.github.io/videohighlights/) showing public asset management videos from:

- [JHI](https://sanand0.github.io/videohighlights/#jhi)
- [PIMCO](https://sanand0.github.io/videohighlights/#pimco)
- [PGIM](https://sanand0.github.io/videohighlights/#pgim)

## Adding demos

Download the videos as audio files using `yt-dlp` and `mutagen` to convert them to Opus format:

```bash
cd videos/
uvx --with mutagen yt-dlp --extract-audio --audio-format opus \
  'https://youtu.be/4PYvOKpE4C0' \
  'https://youtu.be/OwYEaJH1un8' \
  'https://youtu.be/ePY4mf4BXvM' \
  'https://youtu.be/_cKcEbJy24A' \
  'https://youtu.be/FXxfW_fA5HU'

# Convert OPUS to transcript in a Whisper format
llm groq-whisper --response-format video.opus > video.json
```

Then update `config.json` using an LLM with the transcripts. Ensure that the `source`
