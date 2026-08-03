# Security

This server is read-only: it queries the Podcast Index API and changes nothing. The things worth protecting are your `PODCASTINDEX_API_KEY` and `PODCASTINDEX_API_SECRET`, which are read from the environment and never logged. The secret is used to compute the request authorization hash and is never sent as a plain value.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: open the **Security** tab on this repo and click **Report a vulnerability**. Do not open a public issue for security problems.

I aim to respond within a week. Credit goes to the reporter in the fix notes unless you prefer otherwise.
