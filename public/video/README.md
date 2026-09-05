Drop the finished intro video here as `intro.mp4` (i.e. `public/video/intro.mp4`).

That's the only step needed — the app already looks for it at that path. Until
the file exists, the intro screen shows "(Intro video coming soon)" and a
Continue button, so nothing is broken in the meantime.

Keep the file reasonably small (a plain 2D animation shouldn't need to be
large) — it's served directly from Vercel and loaded on every phone this
gets sent to over mobile data.
