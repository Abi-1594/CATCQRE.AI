import CatScrub from "@/components/cat-scrub"

export default function Home() {
  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <CatScrub />
      </div>
    </main>
  )
}
