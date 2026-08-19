import Link from "next/link"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/session"
import { getMentionableUsers } from "@/lib/mentions-server"
import { getFeed } from "@/lib/posts"
import { getPromptContext } from "@/lib/prompts"
import { spiritAnimalTagline } from "@/lib/spirit-animals"
import { Avatar } from "./_components/Avatar"
import { Composer } from "./_components/Composer"
import { PostCard } from "./_components/PostCard"
import { PromptCard } from "./_components/PromptCard"
import { SignOutButton } from "./_components/SignOutButton"

// The feed re-reads posts on each request (reactions/photos change often).
export const dynamic = "force-dynamic"

export default async function Home() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const [posts, mentionables, prompt] = await Promise.all([
    getFeed(),
    getMentionableUsers(),
    getPromptContext(profile.id),
  ])

  const promptSubmission =
    prompt.state.status === "live" && !prompt.myAlreadySubmitted
      ? { promptId: prompt.state.promptId, promptText: prompt.state.promptText }
      : null

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar
            animalKey={profile.spirit_animal}
            size="md"
            crowned={prompt.crownHolderId === profile.id}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {profile.display_name}
            </p>
            <p className="truncate text-xs text-olive-dark">
              {spiritAnimalTagline(
                profile.spirit_animal,
                profile.animal_nickname,
                profile.animal_adjective,
                { short: true },
              )}
            </p>
            {profile.prompt_fire_streak > 0 && (
              <p className="text-xs text-ink/60">
                🔥 {profile.prompt_fire_streak}-day streak
              </p>
            )}
          </div>
        </div>
        <span className="font-display text-base lowercase tracking-tight text-olive-dark">
          spiritfeed
        </span>
        <div className="flex items-center gap-4">
          {profile.is_admin && (
            <Link
              href="/admin"
              className="text-sm text-ink/60 underline underline-offset-4 hover:text-ink"
            >
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      <PromptCard
        state={prompt.state}
        roster={prompt.roster}
        currentUserId={profile.id}
      />

      <Composer mentionables={mentionables} promptSubmission={promptSubmission} />

      {posts.length === 0 ? (
        <div className="border-2 border-dashed border-ink/30 px-4 py-12 text-center">
          <p className="text-sm text-ink/70">Nothing here yet.</p>
          <p className="mt-1 text-xs text-ink/50">
            Post a photo or set a status to kick things off.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              crownHolderId={prompt.crownHolderId}
            />
          ))}
        </div>
      )}
    </main>
  )
}
