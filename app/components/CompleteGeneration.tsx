'use client';

interface CompleteGenerationProps {
  text: string;
  initialPhrase: string;
}

export default function CompleteGeneration({ text, initialPhrase }: CompleteGenerationProps) {
  const continuation = text.slice(initialPhrase.length);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-relaxed">
      <span className="text-gray-700">{initialPhrase}</span>
      <span className="text-[#378ADD] font-semibold">{continuation}</span>
    </div>
  );
}
