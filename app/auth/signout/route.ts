import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

// POST /auth/signout — clears the session and returns to the login screen.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  })
}
