import Link from "next/link"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/session"
import { getFeed } from "@/lib/posts"
import { Avatar } from "./_components/Avatar"
import { Composer } from "./_components/Composer"
import { PostCard } from "./_components/PostCard"
import { SignOutButton } from "./_components/SignOutButton"

// The feed re-reads posts on each request (reactions/photos change often).
export const dynamic = "force-dynamic"

export default async function Home() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const posts = await getFeed()

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar animalKey={profile.spirit_animal} size="sm" />
          <p className="text-sm font-medium">{profile.display_name}</p>
        </div>
        <div className="flex items-center gap-4">
          {profile.is_admin && (
            <Link
              href="/admin"
              className="text-sm text-foreground/60 underline underline-offset-4 hover:text-foreground"
            >
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      <Composer />

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/15 px-4 py-12 text-center">
          <p className="text-sm text-foreground/60">Nothing here yet.</p>
          <p className="mt-1 text-xs text-foreground/40">
            Post a photo or set a status to kick things off.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
