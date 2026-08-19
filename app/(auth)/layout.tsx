import { CollageBackground } from "./_components/CollageBackground"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-10">
      <CollageBackground />
      {/* Focal bone card floating on the collage — chunky border, hard shadow. */}
      <div className="pixel-card w-full max-w-sm p-6">{children}</div>
    </main>
  )
}
