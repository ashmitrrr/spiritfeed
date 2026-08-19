import type { FeedPost } from "@/lib/posts"
import { spiritAnimalTagline } from "@/lib/spirit-animals"
import { relativeTime } from "@/lib/time"
import { Avatar } from "./Avatar"
import { ReactionBar } from "./ReactionBar"
import { RichText } from "./RichText"

export function PostCard({ post }: { post: FeedPost }) {
  const tagline = spiritAnimalTagline(
    post.authorAnimal,
    post.authorNickname,
    post.authorAdjective,
  )
  return (
    <article className="pixel-panel space-y-3 p-3">
      <header className="flex items-center gap-2.5">
        <Avatar animalKey={post.authorAnimal} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{post.authorName}</p>
          <p className="truncate text-xs text-olive-dark">{tagline}</p>
        </div>
        <p className="shrink-0 text-xs text-ink/50">
          {relativeTime(post.createdAt)}
        </p>
      </header>

      {post.postType === "status" ? (
        <RichText
          text={post.caption ?? ""}
          className="whitespace-pre-wrap break-words px-1 text-[15px]"
        />
      ) : (
        <>
          {post.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.photoUrl}
              alt={post.caption ?? "Photo"}
              className="w-full border-2 border-ink object-contain"
            />
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed border-ink/30 px-4 py-10 text-sm text-ink/50">
              Photo unavailable
            </div>
          )}
          {post.caption && (
            <RichText
              text={post.caption}
              className="whitespace-pre-wrap break-words px-1 text-sm"
            />
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
