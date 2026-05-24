import { listUserKnowledgeSources } from '@/ai/knowledge';
import { KnowledgeSourceManager } from '@/components/ai/knowledge-source-manager';
import { getSession } from '@/lib/server';
import { useTranslations } from 'next-intl';

export const metadata = {
  title: 'Knowledge - AeloKit',
};

export default async function KnowledgePage() {
  const t = useTranslations('Dashboard');
  const session = await getSession();
  const initialSources = session?.user?.id
    ? await listUserKnowledgeSources(session.user.id)
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-bold tracking-tight">
              {t('knowledge.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('knowledge.description')}
            </p>
          </div>
          <div className="px-4 lg:px-6">
            <KnowledgeSourceManager initialSources={initialSources} />
          </div>
        </div>
      </div>
    </div>
  );
}
