import { BillSplitCalculator } from "@/components/bill-split-calculator"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8 safe-area-padding relative">
          {/* Decorative elements with new color palette */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-dark rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-magenta rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-8">
              <p className="text-gray-600 mt-4">Upload a bill, assign items to people, and calculate who owes what</p>
            </div>
            <BillSplitCalculator />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

