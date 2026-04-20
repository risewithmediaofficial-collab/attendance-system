import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { TemplateCard, type TemplateCardProps } from "@/components/TemplateCard";

export type TemplateCategory = "all" | "informational" | "comparative" | "social" | "transactional";

export interface ContentTemplate extends Omit<TemplateCardProps, 'onUse'> {
  id: string;
  category: TemplateCategory;
  onUse?: () => void;
}

interface ContentTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ContentTemplate[];
  onSelectTemplate?: (template: ContentTemplate) => void;
}

export function ContentTemplateSelector({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
}: ContentTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("all");

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory = activeCategory === "all" || template.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, activeCategory, searchQuery]);

  const handleTemplateUse = (template: ContentTemplate) => {
    if (template.onUse) {
      template.onUse();
    }
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border border-neutral-200 bg-white shadow-xl rounded-xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b border-neutral-100 space-y-2">
          <DialogTitle className="text-2xl font-bold text-neutral-900">
            Generate Content Using Templates
          </DialogTitle>
          <p className="text-sm text-neutral-500">
            Choose a template to get started with your content
          </p>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-neutral-200 rounded-lg focus:border-[#4F6FAF] focus:ring-2 focus:ring-[#4F6FAF]/10 transition-all"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" value={activeCategory} onValueChange={(value) => setActiveCategory(value as TemplateCategory)}>
            <TabsList className="bg-transparent p-0 h-auto gap-2 border-b border-neutral-200">
              {[
                { value: "all" as const, label: "Show all" },
                { value: "informational" as const, label: "Informational" },
                { value: "comparative" as const, label: "Comparative" },
                { value: "social" as const, label: "Social" },
                { value: "transactional" as const, label: "Transactional" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-0 py-3 text-sm font-medium text-neutral-600 border-b-2 border-transparent rounded-none bg-transparent data-[state=active]:border-[#4F6FAF] data-[state=active]:text-[#4F6FAF] data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-neutral-900 transition-colors"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Templates Grid */}
            <TabsContent value={activeCategory} className="mt-8">
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      icon={template.icon}
                      title={template.title}
                      description={template.description}
                      badge={template.badge}
                      disabled={template.disabled}
                      onUse={() => handleTemplateUse(template)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-neutral-500 mb-2">No templates found</p>
                  <p className="text-sm text-neutral-400">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
