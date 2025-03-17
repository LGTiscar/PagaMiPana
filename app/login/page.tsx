import { LoginForm } from "@/components/login-form"
import { QuickSplitLogo } from "@/components/quicksplit-logo"

export default function LoginPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 safe-area-padding flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <QuickSplitLogo size="xl" />
        </div>
        <LoginForm />
      </div>
    </main>
  )
}

