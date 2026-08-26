# WebGPU Constellation

A capability-gated advanced graphics study with a WebGPU triangle path and an always-available Canvas constellation fallback.

## What this demonstrates

Start with `tryWebGPU()`: feature detection, adapter/device request, shader module, pipeline, canvas context, and render pass. Then inspect `drawFallback()` to understand why an advanced capability-gated demo must keep a useful Canvas path. MDN currently marks WebGPU as limited availability and secure-context-only, so the fallback is part of the lesson.

## Run locally

Serve this folder with `python3 -m http.server 4173` on localhost or use HTTPS to exercise WebGPU; the Canvas fallback can still be studied from a direct file URL. No npm, bundler, framework, microphone, or upload is required.

## Privacy and compatibility

This lab keeps its state in the browser. It does not upload user content. Optional APIs are feature-detected and the page retains a visible fallback when the browser does not provide them.

## License

Released under the MIT License. See [LICENSE](LICENSE).
