# FrameDot

The first-viewport FrameDot product demo, published as a static site on GitHub Pages.

The camera simulation works with drag, arrow keys, and Home to center. Every click on the waitlist button can increment a persistent aggregate count; no email or name is requested or stored. The click API runs at the FrameDot Sites backend, which records each accepted click in D1. It uses short-lived signed challenges, replay protection, proof of work, and per-source rate limits to reduce casual fabrication. The displayed number is recorded clicks, not unique people; determined or distributed abuse remains possible.
