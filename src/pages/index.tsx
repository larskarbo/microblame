import Link from "next/link"
import Head from "next/head"
import { Button } from "../components/Button"
import clsx from "clsx"

export const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Head>
        <title>microblame ⚡️ Postgres Slow Query Detector</title>
        <meta
          name="description"
          content="Find and fix slow Postgres queries with precise source code mapping"
        />
      </Head>

      <main className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">microblame ⚡️</span>
            <span className="block text-indigo-600 mt-2">
              Postgres Slow Query Detector
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
            Instantly identify your slowest Postgres queries and pinpoint exactly where they originate in your code.
            No more endless debugging or guesswork.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/dashboard" passHref>
              <Button className="px-8 py-3 text-base bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/setup" passHref>
              <Button className="px-8 py-3 text-base">Setup Guide</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
