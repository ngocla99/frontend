import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'card' | 'avatar' | 'text' | 'button' | 'image';
  count?: number;
  animated?: boolean;
}

export const SkeletonLoader = ({ 
  className, 
  variant = 'card', 
  count = 1,
  animated = true 
}: SkeletonLoaderProps) => {
  const baseClasses = cn(
    "bg-muted rounded",
    animated && "animate-pulse",
    className
  );

  const variants = {
    card: "h-24 w-full",
    avatar: "h-12 w-12 rounded-full",
    text: "h-4 w-3/4",
    button: "h-10 w-24",
    image: "h-48 w-full"
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div 
      key={i} 
      className={cn(baseClasses, variants[variant])}
    />
  ));

  if (count === 1) return items[0];

  return (
    <div className="space-y-2">
      {items}
    </div>
  );
};

export const MatchCardSkeleton = () => (
  <div className="bg-card rounded-lg p-4 border animate-pulse">
    <div className="flex items-center gap-3">
      <SkeletonLoader variant="avatar" animated={false} />
      <div className="flex-1 space-y-2">
        <SkeletonLoader variant="text" className="h-3 w-1/3" animated={false} />
        <SkeletonLoader variant="text" className="h-2 w-1/2" animated={false} />
      </div>
      <div className="text-center">
        <SkeletonLoader variant="text" className="h-6 w-12 mx-auto" animated={false} />
        <SkeletonLoader variant="text" className="h-2 w-8 mx-auto mt-1" animated={false} />
      </div>
      <SkeletonLoader variant="avatar" animated={false} />
    </div>
  </div>
);

export const PhotoUploadSkeleton = () => (
  <div className="bg-card rounded-lg p-6 border animate-pulse">
    <div className="space-y-4">
      <div className="flex gap-4 justify-center">
        <SkeletonLoader variant="button" animated={false} />
        <SkeletonLoader variant="button" animated={false} />
      </div>
      <SkeletonLoader variant="image" className="h-32" animated={false} />
      <div className="flex gap-2 justify-center">
        <SkeletonLoader variant="button" animated={false} />
        <SkeletonLoader variant="button" animated={false} />
      </div>
    </div>
  </div>
);

export const BabyGeneratorSkeleton = () => (
  <div className="bg-card rounded-lg p-6 border animate-pulse">
    <div className="space-y-6">
      <div className="text-center">
        <SkeletonLoader variant="text" className="h-6 w-1/2 mx-auto" animated={false} />
      </div>
      <div className="flex justify-between items-center">
        <SkeletonLoader variant="image" className="h-20 w-20 rounded-full" animated={false} />
        <SkeletonLoader variant="image" className="h-24 w-24 rounded-full" animated={false} />
        <SkeletonLoader variant="image" className="h-20 w-20 rounded-full" animated={false} />
      </div>
      <SkeletonLoader variant="button" className="w-full h-12" animated={false} />
    </div>
  </div>
);