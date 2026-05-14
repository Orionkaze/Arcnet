export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex justify-center items-center flex-1 animate-[slideFadeIn_300ms_ease-out_forwards] opacity-0">
      {children}
    </div>
  );
}
