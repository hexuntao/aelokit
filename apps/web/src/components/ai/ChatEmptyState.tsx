'use client';

import { MessageCircle, Code, Lightbulb, FileText, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatContext } from './ChatProvider';

interface QuickPrompt {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ChatEmptyState() {
  const { setInput } = useChatContext();

  const quickPrompts: QuickPrompt[] = [
    {
      text: 'Help me write some code',
      icon: Code,
    },
    {
      text: 'Explain a concept to me',
      icon: Brain,
    },
    {
      text: 'Brainstorm some ideas',
      icon: Lightbulb,
    },
    {
      text: 'Write an email draft',
      icon: FileText,
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-4 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
        <MessageCircle className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Start a conversation or select a quick prompt below to get started.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {quickPrompts.map((prompt, index) => {
          const Icon = prompt.icon;
          return (
            <Button
              key={index}
              variant="secondary"
              className="h-auto py-4 px-6 justify-start text-left hover:bg-muted transition-all group"
              onClick={() => setInput(prompt.text)}
            >
              <Icon className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>{prompt.text}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
