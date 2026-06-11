export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6 pb-24">
      {/* Header Skeleton */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse border-2 border-white shadow-lg"></div>
      </div>

      {/* Join Group Section Skeleton */}
      <div className="w-full max-w-md mb-8 space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse px-1"></div>
        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm h-14 animate-pulse">
          <div className="flex-1 bg-gray-100 rounded-lg"></div>
          <div className="w-24 bg-gray-200 rounded-xl"></div>
        </div>
      </div>

      {/* Group List Skeleton */}
      <div className="w-full max-w-md space-y-4">
        <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse px-1"></div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-100 rounded-md animate-pulse"></div>
                </div>
              </div>
              <div className="w-5 h-5 bg-gray-100 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
