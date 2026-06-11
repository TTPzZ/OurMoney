export default function GroupDetailLoading() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pb-32">
      {/* Header Skeleton */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-3 w-20 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Settlement Summary Skeleton */}
        <section className="space-y-4">
          <div className="h-4 w-40 bg-gray-200 rounded-md animate-pulse px-1"></div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2 h-24 animate-pulse">
              <div className="h-3 w-16 bg-gray-100 rounded"></div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2 h-24 animate-pulse">
              <div className="h-3 w-16 bg-gray-100 rounded"></div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between h-20 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="w-20 h-8 bg-gray-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Bills Skeleton */}
        <section className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse px-1"></div>
          
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between h-20 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-3 w-24 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
