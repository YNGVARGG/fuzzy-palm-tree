# Standard IA visual direction

A French dental reception pilot: warm ivory, deep teal and sage, generous typography, a small bird mascot and product-led examples. Main implementation: components/landing/experience.tsx and app/landing.css.

The landing demonstrates a fictional call becoming a staff follow-up. It does not claim that calls, booking integrations or compliance certifications are live. Production sign-in links appear only when NEXT_PUBLIC_APP_URL is configured; development links to the local practice app. NEXT_PUBLIC_SITE_URL optionally overrides the private preview URL for metadata.

Motion uses short entrance transitions, viewport reveals, hover feedback and a user-controlled three-stage illustration. Playback pauses offscreen and in background tabs. Reduced-motion preferences disable visual animation. The practice login and cabinet share the mascot and restrained page transitions.

## Mascot provenance

public/standard-bird.png was generated with the built-in image generation tool on 2026-09-06, then copied unchanged to the practice app. Model version was not supplied by the tool. Design direction informed by https://github.com/s1dashu/ip-as-logo-skill (MIT): simple rounded forms, a limited palette and a lower-corner composition. This is an original generated mascot, not Arini artwork.

Prompt direction: one square muted mint background (#C5E8D5), ivory and deep teal (#173E35) baby bird, four to seven simple rounded shapes, tiny eyes and beak, broad wing, lower-right composition, subtle dimensional shading, no text, scenery or additional objects.

## Validation

Production compilation and TypeScript checks; lint for the active landing components. No browser visual audit was requested or performed. Test the final page across real devices before public launch.

## Demo bookings

Primary navigation, hero and closing actions now lead to #demo. The section links directly to the owner's supplied Cal.com event, https://cal.com/yonathan-henok-bjumzf/demo. NEXT_PUBLIC_DEMO_URL can override this at build time; only HTTPS Cal.com event paths are accepted. There is no local fake booking confirmation, availability or collection form. The visitor completes scheduling on Cal.com, without a clinic login.
