"use client";

export default function RecentHappenings() {
  // Placeholder data for MVP
  const newsItems = [
    "Rockstar announces the delay of GTA 6",
    "Arcavon released Trailer for their highly anticipated sci-fi game \"Reboot the Dawn\"",
  ];

  return (
    <div className="bg-transparent border border-[#23262D] rounded-md p-6 h-[500px]">
      <h3 className="text-gray-100 font-bold text-lg mb-6">Recent Happenings</h3>
      <div className="flex flex-col gap-6">
        {newsItems.map((item, index) => (
          <p key={index} className="text-gray-300 text-sm leading-relaxed cursor-pointer hover:text-[#10B981] transition-colors">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
