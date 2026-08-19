export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={
          className ??
          "text-sm text-ink/60 underline underline-offset-4 hover:text-ink"
        }
      >
        Sign out
      </button>
    </form>
  )
}
