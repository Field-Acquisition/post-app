export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-lg space-y-6 text-zinc-900 dark:text-zinc-100">
        <h1 className="text-2xl font-semibold tracking-tight">GET → POST forward</h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Send a <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">GET</code>{" "}
          to <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">/api/forward</code>{" "}
          with URL query parameters. They are parsed into JSON and posted to the URL in{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">FORWARD_POST_URL</code>.
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Example:{" "}
          <code className="break-all rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            /api/forward?record_id=recXXX&amp;availability=open
          </code>{" "}
          → POST body includes those fields, and the browser sees a confirmation page with{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">record_id</code>{" "}
          and{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">availability</code>.
        </p>
      </main>
    </div>
  );
}
