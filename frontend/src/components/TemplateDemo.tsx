import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ContentTemplateSelector,
  type ContentTemplate,
  type TemplateCategory,
} from "@/components/ContentTemplateSelector";
import {
  BookOpen,
  BarChart3,
  Share2,
  FileText,
  Zap,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";

/**
 * TemplateDemo Component
 *
 * This component demonstrates how to use the new ContentTemplateSelector
 * modal with the SaaS redesign.
 *
 * Features:
 * - Modal with template selection
 * - Categorized templates
 * - Search functionality
 * - Tab filtering
 */

const SAMPLE_TEMPLATES: ContentTemplate[] = [
  {
    id: "smart-suggestion",
    title: "Smart Suggestion",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "informational",
    icon: <Zap className="h-5 w-5" />,
    badge: "Popular",
    onUse: () => console.log("Using Smart Suggestion template"),
  },
  {
    id: "blog-post",
    title: "Blog Post",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "informational",
    icon: <FileText className="h-5 w-5" />,
    onUse: () => console.log("Using Blog Post template"),
  },
  {
    id: "listicle",
    title: "Listicle",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "informational",
    icon: <BookOpen className="h-5 w-5" />,
    onUse: () => console.log("Using Listicle template"),
  },
  {
    id: "ultimate-guide",
    title: "Ultimate Guide",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "informational",
    icon: <Package className="h-5 w-5" />,
    onUse: () => console.log("Using Ultimate Guide template"),
  },
  {
    id: "how-to-article",
    title: "How-To Article",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "informational",
    icon: <CheckCircle className="h-5 w-5" />,
    onUse: () => console.log("Using How-To Article template"),
  },
  {
    id: "comparison-post",
    title: "Comparison Post",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "comparative",
    icon: <BarChart3 className="h-5 w-5" />,
    badge: "New",
    onUse: () => console.log("Using Comparison Post template"),
  },
  {
    id: "vs-comparison",
    title: "VS Comparison",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "comparative",
    icon: <TrendingUp className="h-5 w-5" />,
    onUse: () => console.log("Using VS Comparison template"),
  },
  {
    id: "pros-cons",
    title: "Pros & Cons",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "comparative",
    icon: <AlertCircle className="h-5 w-5" />,
    onUse: () => console.log("Using Pros & Cons template"),
  },
  {
    id: "social-post",
    title: "Social Post",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "social",
    icon: <Share2 className="h-5 w-5" />,
    onUse: () => console.log("Using Social Post template"),
  },
  {
    id: "twitter-thread",
    title: "Twitter Thread",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "social",
    icon: <MessageSquare className="h-5 w-5" />,
    onUse: () => console.log("Using Twitter Thread template"),
  },
  {
    id: "linkedin-post",
    title: "LinkedIn Post",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "social",
    icon: <Share2 className="h-5 w-5" />,
    onUse: () => console.log("Using LinkedIn Post template"),
  },
  {
    id: "email-newsletter",
    title: "Email Newsletter",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "transactional",
    icon: <MessageSquare className="h-5 w-5" />,
    onUse: () => console.log("Using Email Newsletter template"),
  },
  {
    id: "announcement",
    title: "Announcement",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "transactional",
    icon: <AlertCircle className="h-5 w-5" />,
    onUse: () => console.log("Using Announcement template"),
  },
  {
    id: "press-release",
    title: "Press Release",
    description: "Produce AI select the content type based on the top-rated posts",
    category: "transactional",
    icon: <FileText className="h-5 w-5" />,
    onUse: () => console.log("Using Press Release template"),
  },
];

export function TemplateDemo() {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);

  const handleSelectTemplate = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setOpen(false);
    // Handle your template selection logic here
    console.log("Selected template:", template.title);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900">Content Template Selector</h1>
        <p className="text-neutral-600">
          Modern SaaS redesign with clean, minimal design and brand colors
        </p>
      </div>

      {/* Main Button */}
      <div className="space-y-4">
        <Button
          onClick={() => setOpen(true)}
          className="bg-[#4F6FAF] text-white hover:bg-[#3F5F9F] px-6 py-3 rounded-lg font-semibold"
        >
          Open Template Selector
        </Button>

        {selectedTemplate && (
          <div className="p-4 bg-[#EFF2FF] border border-[#4F6FAF] rounded-lg">
            <p className="text-sm text-neutral-600">
              <strong>Selected Template:</strong> {selectedTemplate.title}
            </p>
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
          <h3 className="font-semibold text-neutral-900 mb-2">✨ Clean Design</h3>
          <p className="text-sm text-neutral-600">
            Minimal, premium SaaS look inspired by Notion, Stripe, Linear
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
          <h3 className="font-semibold text-neutral-900 mb-2">🎨 Brand Colors</h3>
          <p className="text-sm text-neutral-600">
            Primary: #4F6FAF, Secondary: #6C8CFF applied consistently
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
          <h3 className="font-semibold text-neutral-900 mb-2">📱 Responsive</h3>
          <p className="text-sm text-neutral-600">
            3 columns on desktop, 2 on tablet, 1 on mobile
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
          <h3 className="font-semibold text-neutral-900 mb-2">🔍 Search & Filter</h3>
          <p className="text-sm text-neutral-600">
            Full-text search with category tabs for easy navigation
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
          <h3 className="font-semibold text-neutral-900 mb-2">✅ Hover Effects</h3>
          <p className="text-sm text-neutral-600">
            Subtle scale, border color change, smooth transitions
          </p>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
          <h3 className="font-semibold text-neutral-900 mb-2">🎯 No Glassmorphism</h3>
          <p className="text-sm text-neutral-600">
            Removed heavy effects for a clean, modern aesthetic
          </p>
        </div>
      </div>

      {/* ContentTemplateSelector Modal */}
      <ContentTemplateSelector
        open={open}
        onOpenChange={setOpen}
        templates={SAMPLE_TEMPLATES}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}

export default TemplateDemo;
