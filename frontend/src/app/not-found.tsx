import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1319] text-white p-6">
      <div className="text-center">
        <h1 className="text-9xl font-chakra font-bold text-[#00EAFF] tracking-widest drop-shadow-[0_0_15px_rgba(0,234,255,0.4)]">
          404
        </h1>
        <h2 className="text-2xl font-chakra font-bold text-white uppercase tracking-wider mt-4">
          Hub / Page Not Found
        </h2>
        <p className="text-[#C8C7C7] text-sm mt-2 max-w-md mx-auto">
          The coordinate you requested does not exist in the ArcNet grid. Check the path or return to base.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block bg-[#00EAFF] text-[#10141A] font-chakra font-bold text-sm uppercase tracking-wider px-6 py-3 rounded hover:bg-[#00d0e0] transition-colors shadow-[0_0_10px_rgba(0,234,255,0.3)]"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
