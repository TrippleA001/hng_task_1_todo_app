/**
 * Route-level loading state: the three-pane shell as a skeleton, so a slow
 * workspace read keeps the layout instead of flashing an empty screen.
 *
 * Mirrors AppShell's responsive structure (mobile bar, sidebar from `lg`,
 * detail pane from `xl`) so nothing jumps when real content lands.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen justify-center p-0 sm:p-4 lg:p-6">
      <div className="w-full max-w-[1240px]">
        <div className="flex min-h-screen animate-pulse flex-col overflow-hidden bg-card sm:min-h-[calc(100vh-2rem)] sm:rounded-[20px] sm:shadow-[0_30px_80px_-45px_rgba(0,0,0,0.5)] lg:min-h-[calc(100vh-3rem)]">
          <div className="border-b border-line bg-sidebar px-4 py-3 lg:hidden">
            <div className="h-5 w-16 rounded bg-black/[0.07]" />
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="hidden w-[250px] shrink-0 space-y-3 bg-sidebar px-4 py-6 lg:block xl:w-[280px]">
              <div className="h-6 w-20 rounded bg-black/[0.07]" />
              <div className="h-9 rounded-lg bg-black/[0.05]" />
              <div className="h-9 rounded-lg bg-black/[0.05]" />
              <div className="h-9 rounded-lg bg-black/[0.05]" />
              <div className="h-9 rounded-lg bg-black/[0.05]" />
              <div className="h-6 w-16 rounded bg-black/[0.07]" />
              <div className="h-9 rounded-lg bg-black/[0.05]" />
              <div className="h-9 rounded-lg bg-black/[0.05]" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col space-y-4 bg-card px-4 py-6 sm:px-6 lg:px-8">
              <div className="h-9 w-40 rounded bg-black/[0.07]" />
              <div className="h-[52px] rounded-[10px] bg-black/[0.05]" />
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="h-16 rounded-lg bg-black/[0.04]" />
                ))}
              </div>
            </div>

            <div className="hidden w-[340px] shrink-0 space-y-4 bg-panel px-6 py-6 xl:block 2xl:w-[400px]">
              <div className="h-6 w-48 rounded bg-black/[0.07]" />
              <div className="h-4 w-full rounded bg-black/[0.05]" />
              <div className="h-4 w-3/4 rounded bg-black/[0.05]" />
              <div className="h-24 rounded-lg bg-black/[0.05]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}