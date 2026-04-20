import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import React from "react";

export interface TemplateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onUse?: () => void;
  badge?: string;
  disabled?: boolean;
}

export function TemplateCard({
  icon,
  title,
  description,
  onUse,
  badge,
  disabled = false,
}: TemplateCardProps) {
  return (
    <Card className="group relative overflow-hidden cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-full flex flex-col bg-white border border-[#E5E7EB] hover:border-[#4F6FAF] hover:shadow-md hover:scale-[1.02]">
      <CardContent className="p-6 pb-4 flex-1 flex flex-col">
        {/* Icon */}
        <div className="mb-4 inline-flex w-fit p-3 rounded-lg bg-[#F3F4F6] text-[#4F6FAF] group-hover:bg-[#EFF2FF] transition-colors duration-200">
          {icon}
        </div>

        {/* Badge */}
        {badge && (
          <div className="mb-3 inline-flex w-fit">
            <span className="px-2.5 py-1 text-xs font-semibold bg-[#EFF2FF] text-[#4F6FAF] rounded-full">
              {badge}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-base font-semibold text-neutral-900 mb-2 group-hover:text-[#4F6FAF] transition-colors duration-200">
          {title}
        </h3>

        {/* Description */}
        <CardDescription className="text-sm text-neutral-600 flex-1">
          {description}
        </CardDescription>
      </CardContent>

      {/* Footer with CTA */}
      <div className="px-6 pb-6 pt-2 border-t border-[#E5E7EB] group-hover:border-[#EFF2FF] transition-colors duration-200">
        <Button
          onClick={onUse}
          disabled={disabled}
          className="w-full justify-between group/btn bg-[#4F6FAF] text-white hover:bg-[#3F5F9F] rounded-lg font-semibold transition-all duration-200"
        >
          <span>Use this Template</span>
          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
}
