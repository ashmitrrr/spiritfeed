import Image from "next/image"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/session"
import { getGroupMembers } from "@/lib/members"
import { getMentionableUsers } from "@/lib/mentions-server"
import { getFeed } from "@/lib/posts"
import { getPromptContext } from "@/lib/prompts"
import { spiritAnimalTagline } from "@/lib/spirit-animals"
import spiritfeedWordmark from "@/logo_home.png"
import { Avatar } from "./_components/Avatar"
import { Composer } from "./_components/Composer"
import { HeaderMenu } from "./_components/HeaderMenu"
import { PostCard } from "./_components/PostCard"
import { PromptCard } from "./_components/PromptCard"
import { RealtimeRefresh } from "./_components/RealtimeRefresh"

// The feed re-reads posts on each request (reactions/photos change often).
export const dynamic = "force-dynamic"

export default async function Home() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const [posts, mentionables, prompt, members] = await Promise.all([
    getFeed(),
    getMentionableUsers(),
    getPromptContext(profile.id),
    getGroupMembers(),
  ])

  const promptSubmission =
    prompt.state.status === "live" && !prompt.myAlreadySubmitted
      ? { promptId: prompt.state.promptId, promptText: prompt.state.promptText }
      : null

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
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
        <Image
          src={spiritfeedWordmark}
          alt="spiritfeed"
          className="mx-auto h-9 w-auto shrink-0"
        />
        <div className="flex justify-end">
          <HeaderMenu isAdmin={profile.is_admin} members={members} />
        </div>
      </header>

      <RealtimeRefresh />

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
