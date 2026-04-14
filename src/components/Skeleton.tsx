export const SkeletonCard = () => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
    <div className="space-y-4">
      <div className="h-4 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-32 animate-pulse" />
      <div className="h-8 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-48 animate-pulse" />
      <div className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-24 animate-pulse" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 2 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
        <div className="space-y-3">
          <div className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-16 animate-pulse" />
          <div className="h-6 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-20 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-32 animate-pulse" />
            <div className="h-4 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-20 animate-pulse" />
          </div>
          <div className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-48 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonMealGroup = () => (
  <div className="space-y-4">
    <div className="h-5 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-28 animate-pulse" />
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
          <div className="h-4 bg-gradient-to-r from-white/10 to-white/5 rounded-full w-40 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);
