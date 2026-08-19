import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { pushAfterResponse, sendPushToUser } from "@/lib/push"
import {
  ASSIGN_WINDOW_MS,
  PROMPT_TEXT_MAX,
  PROMPT_WINDOW_MS,
} from "@/lib/prompt-constants"

// Re-export so existing server-side importers keep working.
export { ASSIGN_WINDOW_MS, PROMPT_TEXT_MAX, PROMPT_WINDOW_MS }

// ── Date helpers ────────────────────────────────────────────────────────────
// "Today" is the UTC calendar day. JUDGMENT CALL: the spec says "each calendar
// day" without a timezone; UTC keeps it deterministic server-side and matches
// the DB's `current_date`. If the group wants their own local day, this is the
// single place to change.
export function promptDateToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// ── Public shapes ───────────────────────────────────────────────────────────
export type TodaysPrompt =
  | {
      status: "live"
      promptId: string
      promptText: string
      isBackup: boolean
      authorId: string
      authorName: string
      postedAt: string
      windowEndsAt: string
    }
  | {
      status: "awaiting"
      assigneeId: string
      assigneeName: string
      deadlineAt: string
    }

export type PromptRosterEntry = {
  userId: string
  displayName: string
  spiritAnimal: string
  status: "approved" | "submitted" | "pending"
}

export type PromptContext = {
  state: TodaysPrompt
  roster: PromptRosterEntry[] | null
  crownHolderId: string | null
  /** When there's a live prompt: whether the current user already submitted. */
  myAlreadySubmitted: boolean
}

type AdminClient = ReturnType<typeof createAdminClient>

// ── Internal reads ──────────────────────────────────────────────────────────
async function loadLivePrompt(
  admin: AdminClient,
  date: string,
): Promise<TodaysPrompt | null> {
  const { data } = await admin
    .from("daily_prompts")
    .select(
      "id, prompt_text, is_backup, author_id, posted_at, window_ends_at, author:profiles!daily_prompts_author_id_fkey(display_name)",
    )
    .eq("prompt_date", date)
    .maybeSingle()
  if (!data) return null
  const author = Array.isArray(data.author) ? data.author[0] : data.author
  return {
    status: "live",
    promptId: data.id,
    promptText: data.prompt_text,
    isBackup: data.is_backup,
    authorId: data.author_id,
    authorName: author?.display_name ?? "Someone",
    postedAt: data.posted_at,
    windowEndsAt: data.window_ends_at,
  }
}

async function totalMemberCount(admin: AdminClient): Promise<number> {
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
  return count ?? 0
}

/** ceil(total members / 2) — the 🔥 count a submission needs to be approved. */
export function fireThreshold(totalMembers: number): number {
  return Math.ceil(totalMembers / 2)
}

// ── Streak reset by inaction ────────────────────────────────────────────────
// Run once, at the moment a new day's prompt is created: anyone who didn't earn
// a fire on the *previous* prompt day has their streak broken (reset to 0).
async function resetStreaksBrokenByInaction(
  admin: AdminClient,
  newDate: string,
): Promise<void> {
  const { data: prev } = await admin
    .from("daily_prompts")
    .select("prompt_date")
    .lt("prompt_date", newDate)
    .order("prompt_date", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!prev) return // no previous prompt day, nothing to break

  // Zero the streak for everyone whose last fire wasn't on the previous prompt
  // day. Idempotent: re-running produces the same result.
  await admin
    .from("profiles")
    .update({ prompt_fire_streak: 0 })
    .gt("prompt_fire_streak", 0)
    .or(`prompt_last_fire_date.is.null,prompt_last_fire_date.neq.${prev.prompt_date}`)
}

// ── Create a live daily prompt (shared by assignee-submit + backup) ─────────
async function createDailyPrompt(
  admin: AdminClient,
  args: {
    date: string
    authorId: string
    text: string
    isBackup: boolean
  },
): Promise<TodaysPrompt | null> {
  const now = new Date()
  const windowEnds = new Date(now.getTime() + PROMPT_WINDOW_MS)
  const { data, error } = await admin
    .from("daily_prompts")
    .insert({
      prompt_date: args.date,
      author_id: args.authorId,
      prompt_text: args.text,
      is_backup: args.isBackup,
      posted_at: now.toISOString(),
      window_ends_at: windowEnds.toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    // Someone else created today's prompt in a race (unique on prompt_date) —
    // just return whatever now exists.
    return loadLivePrompt(admin, args.date)
  }

  // New prompt day → settle the previous day's streaks (winner only).
  await resetStreaksBrokenByInaction(admin, args.date)
  void data

  // The prompt is now live → notify everyone except its author.
  pushAfterResponse(async () => {
    const { data: members } = await admin
      .from("profiles")
      .select("id")
      .neq("id", args.authorId)
    await Promise.all(
      (members ?? []).map((m) =>
        sendPushToUser(m.id, {
          title: "Today's prompt is live 🔥",
          body: args.text,
          url: "/",
        }),
      ),
    )
  })

  return loadLivePrompt(admin, args.date)
}

// ── The lazy state machine ──────────────────────────────────────────────────
/**
 * Resolves (and lazily advances) today's prompt state. Called on feed render.
 * - If a live prompt exists → return it.
 * - Else if someone's assignment is still within its deadline → "awaiting".
 * - Else pick a new assignee (excluding anyone already assigned today) and
 *   create their assignment → "awaiting".
 * - If everyone's already had (and missed) a slot → fall back to a random
 *   backup prompt, authored by the most-recently-assigned member.
 */
export async function getTodaysPrompt(depth = 0): Promise<TodaysPrompt> {
  const admin = createAdminClient()
  const today = promptDateToday()

  const live = await loadLivePrompt(admin, today)
  if (live) return live

  const { data: assignments } = await admin
    .from("prompt_assignments")
    .select(
      "id, user_id, deadline_at, fulfilled, assigned_at, user:profiles!prompt_assignments_user_id_fkey(display_name)",
    )
    .eq("prompt_date", today)
    .order("assigned_at", { ascending: false })

  const rows = assignments ?? []
  const active = rows.find(
    (a) => !a.fulfilled && new Date(a.deadline_at).getTime() > Date.now(),
  )
  if (active) {
    const u = Array.isArray(active.user) ? active.user[0] : active.user
    return {
      status: "awaiting",
      assigneeId: active.user_id,
      assigneeName: u?.display_name ?? "Someone",
      deadlineAt: active.deadline_at,
    }
  }

  const assignedIds = rows.map((a) => a.user_id)

  // Candidates: members with no assignment today.
  let candidateQuery = admin
    .from("profiles")
    .select("id, display_name, last_prompt_master_date")
  if (assignedIds.length > 0) {
    candidateQuery = candidateQuery.not("id", "in", `(${assignedIds.join(",")})`)
  }
  const { data: candidates } = await candidateQuery

  if (candidates && candidates.length > 0) {
    // Fairness: prefer null (never been master) then oldest last_prompt_master_date,
    // random among the top group.
    const nulls = candidates.filter((c) => !c.last_prompt_master_date)
    let group = nulls
    if (group.length === 0) {
      const minDate = candidates.reduce(
        (m, c) =>
          (c.last_prompt_master_date as string) < m
            ? (c.last_prompt_master_date as string)
            : m,
        candidates[0].last_prompt_master_date as string,
      )
      group = candidates.filter((c) => c.last_prompt_master_date === minDate)
    }
    const pick = group[Math.floor(Math.random() * group.length)]
    const deadline = new Date(Date.now() + ASSIGN_WINDOW_MS).toISOString()
    const { error } = await admin
      .from("prompt_assignments")
      .insert({ user_id: pick.id, prompt_date: today, deadline_at: deadline })
    if (error) {
      // Race (someone got assigned concurrently) — re-resolve once or twice.
      if (depth < 3) return getTodaysPrompt(depth + 1)
    } else {
      // Freshly assigned → tell them it's their turn (4h window).
      pushAfterResponse(async () => {
        await sendPushToUser(pick.id, {
          title: "Your turn to set the prompt 🖊️",
          body: "You've been picked as today's prompt master. You have 4 hours!",
          url: "/",
        })
      })
    }
    return {
      status: "awaiting",
      assigneeId: pick.id,
      assigneeName: pick.display_name,
      deadlineAt: deadline,
    }
  }

  // Everyone had a slot and missed → backup prompt, authored by the most
  // recently assigned member (rows is ordered assigned_at desc, non-empty here).
  const { data: backups } = await admin
    .from("backup_prompts")
    .select("prompt_text")
  const backup =
    backups && backups.length > 0
      ? backups[Math.floor(Math.random() * backups.length)]
      : { prompt_text: "Post something that made you smile today." }
  const authorId = rows[0]?.user_id
  if (!authorId) {
    // No members at all (shouldn't happen while someone's viewing the feed).
    return getTodaysPrompt(depth + 1)
  }
  const created = await createDailyPrompt(admin, {
    date: today,
    authorId,
    text: backup.prompt_text,
    isBackup: true,
  })
  if (created) return created
  // Extremely unlikely fall-through.
  return {
    status: "awaiting",
    assigneeId: authorId,
    assigneeName: rows[0] && !Array.isArray(rows[0].user) ? rows[0].user?.display_name ?? "Someone" : "Someone",
    deadlineAt: new Date().toISOString(),
  }
}

// ── Assignee submits the prompt text ────────────────────────────────────────
export type SubmitPromptResult = { ok: true } | { ok: false; error: string }

export async function submitTodaysPrompt(
  userId: string,
  rawText: string,
): Promise<SubmitPromptResult> {
  const text = rawText.trim()
  if (!text) return { ok: false, error: "Write a prompt first." }
  if (text.length > PROMPT_TEXT_MAX) {
    return { ok: false, error: `Keep it under ${PROMPT_TEXT_MAX} characters.` }
  }

  const admin = createAdminClient()
  const today = promptDateToday()

  // Already a live prompt today?
  const existing = await loadLivePrompt(admin, today)
  if (existing) {
    return { ok: false, error: "Today's prompt is already set." }
  }

  // Must be the user's own, unfulfilled, in-window assignment.
  const { data: assignment } = await admin
    .from("prompt_assignments")
    .select("id, deadline_at, fulfilled")
    .eq("prompt_date", today)
    .eq("user_id", userId)
    .maybeSingle()
  if (!assignment || assignment.fulfilled) {
    return { ok: false, error: "It's not your turn to set the prompt." }
  }
  if (new Date(assignment.deadline_at).getTime() <= Date.now()) {
    return { ok: false, error: "Your time to set the prompt has passed." }
  }

  const created = await createDailyPrompt(admin, {
    date: today,
    authorId: userId,
    text,
    isBackup: false,
  })
  if (!created) return { ok: false, error: "Couldn't post the prompt. Try again." }

  await admin
    .from("prompt_assignments")
    .update({ fulfilled: true })
    .eq("id", assignment.id)
  await admin
    .from("profiles")
    .update({ last_prompt_master_date: today })
    .eq("id", userId)

  return { ok: true }
}

// ── Roster: who's submitted / approved / pending for the live prompt ────────
export async function getPromptRoster(
  promptId: string,
): Promise<PromptRosterEntry[]> {
  const admin = createAdminClient()
  const [{ data: profiles }, { data: submissions }] = await Promise.all([
    admin.from("profiles").select("id, display_name, spirit_animal").order("display_name"),
    admin.from("posts").select("id, author_id").eq("daily_prompt_id", promptId),
  ])

  const subs = submissions ?? []
  const postIds = subs.map((s) => s.id)
  let fires: { post_id: string; user_id: string }[] = []
  if (postIds.length > 0) {
    const { data } = await admin
      .from("reactions")
      .select("post_id, user_id")
      .eq("emoji", "🔥")
      .in("post_id", postIds)
    fires = data ?? []
  }

  const threshold = fireThreshold((profiles ?? []).length)
  const subByAuthor = new Map(subs.map((s) => [s.author_id, s]))

  return (profiles ?? []).map((p) => {
    const sub = subByAuthor.get(p.id)
    let status: PromptRosterEntry["status"] = "pending"
    if (sub) {
      const count = fires.filter(
        (f) => f.post_id === sub.id && f.user_id !== p.id,
      ).length
      status = count >= threshold ? "approved" : "submitted"
    }
    return {
      userId: p.id,
      displayName: p.display_name,
      spiritAnimal: p.spirit_animal,
      status,
    }
  })
}

// ── Crown ───────────────────────────────────────────────────────────────────
export async function getCrownHolderId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("spirit_crown")
    .select("holder_id")
    .eq("id", 1)
    .maybeSingle()
  return data?.holder_id ?? null
}

// ── Fire award, evaluated on every 🔥 reaction ──────────────────────────────
/**
 * After a 🔥 is added to a prompt-tagged post, award the poster a "fire" if the
 * submission just reached the approval threshold and they haven't already
 * earned one for this prompt. Best-effort; never throws into the reaction path.
 */
export async function evaluatePromptFire(postId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: post } = await admin
      .from("posts")
      .select("id, author_id, daily_prompt_id")
      .eq("id", postId)
      .maybeSingle()
    if (!post?.daily_prompt_id) return

    const { data: prompt } = await admin
      .from("daily_prompts")
      .select("prompt_date")
      .eq("id", post.daily_prompt_id)
      .maybeSingle()
    if (!prompt) return

    const { data: fires } = await admin
      .from("reactions")
      .select("user_id")
      .eq("post_id", postId)
      .eq("emoji", "🔥")
    const count = (fires ?? []).filter((f) => f.user_id !== post.author_id).length

    const threshold = fireThreshold(await totalMemberCount(admin))
    if (threshold === 0 || count < threshold) return

    const { data: poster } = await admin
      .from("profiles")
      .select("id, prompt_fire_streak, prompt_last_fire_date")
      .eq("id", post.author_id)
      .maybeSingle()
    if (!poster) return
    // Already earned a fire for this prompt day — nothing to do (idempotent).
    if (poster.prompt_last_fire_date === prompt.prompt_date) return

    const consecutive =
      poster.prompt_last_fire_date === addDays(prompt.prompt_date, -1)
    const newStreak = consecutive ? poster.prompt_fire_streak + 1 : 1

    await admin
      .from("profiles")
      .update({
        prompt_fire_streak: newStreak,
        prompt_last_fire_date: prompt.prompt_date,
      })
      .eq("id", poster.id)

    if (newStreak >= 3) {
      const { data: crown } = await admin
        .from("spirit_crown")
        .select("holder_id")
        .eq("id", 1)
        .maybeSingle()
      const isNewHolder = crown?.holder_id !== poster.id
      await admin
        .from("spirit_crown")
        .upsert({ id: 1, holder_id: poster.id, achieved_at: new Date().toISOString() })
      if (isNewHolder) {
        pushAfterResponse(async () => {
          await sendPushToUser(poster.id, {
            title: "You won the crown 👑",
            body: "Three prompt days in a row — you're the reigning SpiritFeed champ.",
            url: "/",
          })
        })
      }
    }
  } catch {
    // Never let prompt bookkeeping break the reaction itself.
  }
}

// ── One-shot bundle for the feed page ───────────────────────────────────────
export async function getPromptContext(
  currentUserId: string,
): Promise<PromptContext> {
  const state = await getTodaysPrompt()
  const crownHolderId = await getCrownHolderId()

  if (state.status !== "live") {
    return { state, roster: null, crownHolderId, myAlreadySubmitted: false }
  }

  const admin = createAdminClient()
  const [roster, { data: mine }] = await Promise.all([
    getPromptRoster(state.promptId),
    admin
      .from("posts")
      .select("id")
      .eq("daily_prompt_id", state.promptId)
      .eq("author_id", currentUserId)
      .maybeSingle(),
  ])

  return {
    state,
    roster,
    crownHolderId,
    myAlreadySubmitted: Boolean(mine),
  }
}
