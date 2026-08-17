# Product Requirements — SpiritFeed

## Summary

SpiritFeed is a private, minimalist pic-and-status sharing app for a fixed group of 15-20 friends. It exists purely for fun and closeness within the group — not growth, not engagement metrics, not public use. Access is entirely invite-based and password protected. There is no path for a stranger to ever sign up.

## Goals

- Give the group an easy, low-friction way to share a photo or a status without the performance anxiety of a public platform
- Add a handful of playful, group-specific features that a mainstream app couldn't or wouldn't build
- Stay small enough that one person (Ashmit) can build and maintain it solo
- Feel personal and a bit nostalgic rather than corporate — this is a clubhouse, not a product

## Non-goals

- No public signup, no discovery, no follower counts, no algorithmic feed
- No ads, no analytics/tracking beyond what's needed for the app's own features
- No content moderation tooling beyond basic delete/report (the group is trusted, so this stays minimal)
- Not built for scale — 15-20 users is the design ceiling, not a starting point

## Users

Every user is a real-world friend, added by invite only. There are no anonymous or public users. For v1, everyone has equal permissions except the app owner (Ashmit), who can generate invites and remove users if needed.

## Core loop

1. Open the app (installed as a PWA on your phone)
2. See the feed — recent photos and statuses from the group, newest first
3. Post a photo or update your status
4. React to a couple of things with an emoji
5. Glance at the mood dashboard to see how everyone's doing
6. Close the app

That's it. The whole point is that this takes under a minute.

## Feature list (v1)

### Auth & onboarding
- Invite-link based signup: the app owner generates a one-time invite link per friend
- The invited friend opens the link, sets their own username and password
- As the final step of onboarding, the user **picks a spirit animal** — see below
- Standard login after that (username + password)

### Spirit animal avatars
- On account creation, every user picks a spirit animal from a curated set of illustrated animal icons (e.g. fox, otter, owl, raccoon, axolotl, crow, etc.)
- The spirit animal becomes that user's avatar everywhere in the app: feed posts, mood dashboard, streak heatmap, reactions, weekly recap
- No profile photos — the spirit animal *is* the identity. This keeps things playful and consistent, and sidesteps "who has the best profile picture" entirely
- Default design decision: your spirit animal is picked once and is permanent (part of the fun/lore — you're stuck with it). If the group wants a "trade or reroll" mechanic later, that's a natural v2 feature, but v1 ships as fixed-for-life
- Each animal in the set should be visually distinct (so at-a-glance recognition works in a small grid) and each should be unique per user — no two friends share the same animal (enforced at pick time)

### Photo & status posts
- Post a single photo with an optional caption (short — this isn't a blog)
- Post a standalone status line without a photo (like an away message), which replaces your previous status
- Feed is reverse-chronological, all posts from all users, no filtering or ranking
- Posts show the poster's spirit animal avatar, name, timestamp, and caption/status

### Reactions
- Emoji reactions on posts, small fixed set (not full custom emoji picker) to keep it simple
- No text comments in v1 — reactions only, to preserve the low-pressure feel

### Mood dashboard
- A single screen showing every user's spirit animal plus their current status line, all at once
- Think of it as a living "who's around and how are they doing" board
- Updates whenever someone changes their status

### Streaks & heatmap
- Each user has a posting streak (consecutive days with at least one post or status update)
- A calendar heatmap (GitHub-contributions-graph style) per user, or a combined group view
- Purely for fun/gentle gamification — no punishment for breaking a streak, no leaderboard pressure baked in (though a lighthearted leaderboard could be a v1.5 addition if the group wants it)

### Time capsule posts
- When creating a post, a user can optionally set it as a time capsule with an unlock date in the future
- The post is invisible to everyone (including the poster's normal feed view) until the unlock date, at which point it appears in the feed as normal, timestamped with the original post date and a "time capsule" tag
- Good for birthday messages, "guess what happens" posts, future check-ins, etc.

### Weekly recap
- An automatically generated digest, produced every Sunday
- Includes: the most-reacted-to post of the week, who posted the most, any streaks that were broken or hit a milestone, and any time capsules that unlocked that week
- Delivered as a screen in the app (a "This Week" view); a push notification or email version is a nice-to-have, not required for v1

### Invite management
- App owner can view active/pending invites and generate new ones from a simple admin view
- App owner can remove a user if needed (e.g. someone leaves the friend group)

## Explicitly deferred to v2+

These were discussed but are cut from v1 to keep the build scope realistic:

- Daily BeReal-style randomized posting prompt/notification
- Location pins on posts
- Anonymous polls/confessions
- "Ping" / thinking-of-you nudges
- Group-specific meme/inside-joke tagging system
- Spirit animal trading/rerolling

## Success criteria

The app is a success if the group actually uses it more than once a week without being reminded to. That's the only metric that matters here.
