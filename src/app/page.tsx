export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">The Grudgekeeper - Tactics Demo</h1>
      <p className="text-xl mb-8">Tactical combat prototype</p>
      <a 
        href="/game"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        Start Game
      </a>
    </main>
  )
}