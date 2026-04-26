import { ShieldCheck } from "lucide-react";

export function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ShieldCheck className="w-10 h-10 text-[#2a2d3a] mb-3" />
      <p className="text-[#e8eaf0] font-medium">{title}</p>
      {description && <p className="text-[#6b7280] text-sm mt-1">{description}</p>}
    </div>
  );
}
