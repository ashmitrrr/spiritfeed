import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { PHOTO_BUCKET } from "@/lib/posts"

export type DeleteUserResult = { ok: true } | { ok: false; error: string }

/**
 * Fully removes a user, using the service-role client. Verified against the live
 * schema (2026): FKs to `profiles` split into two groups —
 *
 *   CASCADE  → posts, reactions, statuses, streaks (auto-removed with the
 *              profile, which itself cascades from auth.users)
 *   NO ACTION → spirit_animals.taken_by, invites.created_by/used_by,
 *              setup_lock.claimed_by, weekly_recaps.most_active_user_id
 *
 * The NO ACTION references would block the profile delete, so we clear them
 * explicitly here first. In particular:
 *   - spirit_animals.taken_by is NOT `on delete set null`, so the animal is
 *     freed manually (otherwise the delete fails and the animal stays locked).
 *   - invites.created_by is NOT NULL, so invites the user created/used are
 *     deleted (can't be nulled).
 *   - setup_lock.claimed_by is nulled, never the row deleted — removing the
 *     row would re-enable the one-time /setup bootstrap.
 *
 * Storage photos for the user's posts are removed before the posts rows go.
 * Order matters: weekly_recaps.top_post_id (NO ACTION → posts) is cleared before
 * deleting posts.
 */
export async function deleteUserCompletely(
  userId: string,
): Promise<DeleteUserResult> {
  const admin = createAdminClient()

  // 1. Collect this user's post ids + photo paths before anything is deleted.
  const { data: posts, error: postsError } = await admin
    .from("posts")
    .select("id, photo_path")
    .eq("author_id", userId)
  if (postsError) {
    return { ok: false, error: "Couldn't read the user's posts." }
  }
  const postIds = (posts ?? []).map((p) => p.id)
  const photoPaths = (posts ?? [])
    .map((p) => p.photo_path)
    .filter((path): path is string => Boolean(path))

  // 2. Clear weekly_recaps references (NO ACTION) before the posts/profile go.
  if (postIds.length > 0) {
    await admin
      .from("weekly_recaps")
      .update({ top_post_id: null })
      .in("top_post_id", postIds)
  }
  await admin
    .from("weekly_recaps")
    .update({ most_active_user_id: null })
    .eq("most_active_user_id", userId)

  // 3. Remove the user's post photos from storage.
  if (photoPaths.length > 0) {
    const { error: storageError } = await admin.storage
      .from(PHOTO_BUCKET)
      .remove(photoPaths)
    if (storageError) {
      return { ok: false, error: "Couldn't remove the user's photos." }
    }
  }

  // 4. Delete owned content explicitly (posts cascade their own reactions;
  //    reactions the user left elsewhere, their status, and streak go too).
  await admin.from("reactions").delete().eq("user_id", userId)
  if (postIds.length > 0) {
    await admin.from("posts").delete().eq("author_id", userId)
  }
  await admin.from("statuses").delete().eq("user_id", userId)
  await admin.from("streaks").delete().eq("user_id", userId)

  // 5. Free the spirit animal (taken_by is NOT on-delete-set-null).
  await admin
    .from("spirit_animals")
    .update({ taken_by: null })
    .eq("taken_by", userId)

  // 6. Delete invites this user created or used (created_by is NOT NULL).
  await admin
    .from("invites")
    .delete()
    .or(`created_by.eq.${userId},used_by.eq.${userId}`)

  // 7. Release the setup lock claim if they held it (null it — don't delete
  //    the row, or /setup would re-open).
  await admin
    .from("setup_lock")
    .update({ claimed_by: null })
    .eq("claimed_by", userId)

  // 8. Finally delete the auth user; profiles cascades from auth.users.
  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) {
    return { ok: false, error: "Couldn't delete the account. Try again." }
  }

  return { ok: true }
}
