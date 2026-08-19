export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={
          className ??
          "text-sm text-foreground/60 underline underline-offset-4 hover:text-foreground"
        }
      >
        Sign out
      </button>
    </form>
  )
}
