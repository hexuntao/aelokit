import { ChatInterface } from '@/components/ai';
import { useTranslations } from 'next-intl';

export const metadata = {
  title: 'Chat - AeloKit',
};

export default function ChatPage() {
  const t = useTranslations('Dashboard');

  const breadcrumbs = [
    {
      label: t('chat.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
