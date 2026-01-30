'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ProductInfoSection {
  id: string;
  title: string;
  content: string;
  order_index: number;
}

interface ProductInfoAccordionProps {
  sections: ProductInfoSection[];
}

export function ProductInfoAccordion({ sections }: ProductInfoAccordionProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <Accordion type="single" collapsible className="w-full">
        {sections.map((section, index) => (
          <AccordionItem key={section.id} value={`item-${index}`}>
            <AccordionTrigger className="text-lg font-semibold">
              {section.title}
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {section.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
