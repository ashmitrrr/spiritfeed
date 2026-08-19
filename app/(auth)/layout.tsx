export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
