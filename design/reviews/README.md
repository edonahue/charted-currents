# Visual review artifacts

This directory is for a **small, intentional set of review artifacts** from major visual packet boundaries. It is not a screenshot dump and should not accumulate every iteration.

## Packet 1 review set

When browser tooling permits, retain the final pre-handoff screenshots for:

- `packet1-desktop-1440x900.png`
- `packet1-ultrawide-3440x1440.png`
- `packet1-phone-390x844.png`
- `packet1-phone-430x932.png`

Also add/update `packet1-review.md` with:

- commit/revision reviewed;
- whether screenshots are from the real running app;
- browser/viewport information;
- what changed during the deliberate post-functionality visual refinement pass;
- known visual limitations;
- any remaining question intentionally deferred.

## Rules

- Screenshots must come from the actual running application, not generated mockups.
- Check them for private/unrelated desktop/browser information before committing.
- Capture the application viewport cleanly; do not include unrelated tabs, notifications, local paths, account UI, or personal data.
- Do not commit dozens of intermediate screenshots. Four final representative views are enough for Packet 1.
- If browser tooling cannot produce safe image files, report that limitation rather than creating fake evidence.
- Review artifacts are development evidence, not public-product assets and should not be imported by the application.

The purpose is to make visual quality inspectable across human/model handoffs and later regression reviews.
