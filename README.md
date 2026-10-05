# FrameDot

The first-viewport FrameDot product demo, published as a static site on GitHub Pages.

The camera simulation works with drag, arrow keys, and Home to center. The waitlist form accepts one submission per page load, then stays disabled until the page is refreshed. It stores each unique email once with the consent timestamp and privacy-notice version in the FrameDot Sites backend's D1 database; the public count is unique email signups. Accepted clicks are logged separately for 30 days. Short-lived signed challenges, replay protection, proof of work, and per-source rate limits reduce casual fabrication. Emails are not verified yet, so the count is not a verified count of unique people. The privacy notice explains the limited purpose, retention, service provider, and deletion contact.
