import { ChatbotUISVG } from "@/components/icons/chatbotui-svg"
import { SubmitButton } from "@/components/ui/submit-button"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/supabase/types"
import { createServerClient } from "@supabase/ssr"
import { IconArrowRight } from "@tabler/icons-react"
import { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Login"
}

export default async function Login({
  searchParams
}: {
  searchParams: { message: string }
}) {
  const cookieStore = cookies() // read HTTP incoming request cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
  const session = (await supabase.auth.getSession()).data.session

  if (session) {
    const { data: homeWorkspace, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      throw new Error(error.message)
    }

    return redirect(`/${homeWorkspace.id}/chat`)
  }

  const defaultEmail = "user@gmail.com"
  const defaultPassword = "password"

  const signIn = async (formData: FormData) => {
    "use server"

    const email = defaultEmail
    const password = defaultPassword
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    console.log(formData)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log(data)

    if (error) {
      return redirect(`/login?message=${error.message}`)
    }

    const { data: homeWorkspace, error: homeWorkspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      throw new Error(
        homeWorkspaceError?.message || "An unexpected error occurred"
      )
    }

    return redirect(`/${homeWorkspace.id}/chat`)
  }

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <form
        className="flex size-full flex-col items-center justify-center"
        action={signIn}
      >
        <div>
          <ChatbotUISVG theme={"dark"} scale={0.3} />
        </div>

        <div className="mt-2 text-4xl font-bold">Chatbot UI</div>

        <SubmitButton className="mt-4 flex w-[200px] items-center justify-center rounded-md bg-blue-500 p-2 font-semibold">
          Start Chatting
          <IconArrowRight className="ml-1" size={20} />
        </SubmitButton>
      </form>
    </div>
  )
}
