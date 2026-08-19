import type { FeedPost } from "@/lib/posts"
import { relativeTime } from "@/lib/time"
import { Avatar } from "./Avatar"
import { ReactionBar } from "./ReactionBar"

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="space-y-3 rounded-xl border border-foreground/10 p-3">
      <header className="flex items-center gap-2.5">
        <Avatar animalKey={post.authorAnimal} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{post.authorName}</p>
          <p className="text-xs text-foreground/40">
            {relativeTime(post.createdAt)}
          </p>
        </div>
      </header>

      {post.postType === "status" ? (
        <p className="whitespace-pre-wrap break-words px-1 text-[15px]">
          {post.caption}
        </p>
      ) : (
        <>
          {post.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.photoUrl}
              alt={post.caption ?? "Photo"}
              className="w-full rounded-lg object-contain"
            />
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-sm text-foreground/40">
              Photo unavailable
            </div>
          )}
          {post.caption && (
            <p className="whitespace-pre-wrap break-words px-1 text-sm">
              {post.caption}
            </p>
          )}
        </>
      )}

      <ReactionBar
        postId={post.id}
        initialCounts={post.reactionCounts}
        initialMine={post.myReactions}
      />
    </article>
  )
}
