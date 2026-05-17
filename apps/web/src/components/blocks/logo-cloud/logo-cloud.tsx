import { useTranslations } from 'next-intl';

export default function LogoCloudSection() {
  const t = useTranslations('HomePage.logocloud');

  return (
    <section id="logo-cloud" className="bg-muted/50 px-4 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-xl font-medium">{t('title')}</h2>

        <div className="mx-auto mt-20 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16 sm:gap-y-12">
          <img
            className="h-5 w-fit dark:invert"
            src="https://cdn.simpleicons.org/nvidia/76B900"
            alt="Nvidia Logo"
            height="20"
            width="auto"
          />
          <img
            className="h-4 w-fit dark:invert"
            src="https://cdn.simpleicons.org/github"
            alt="GitHub Logo"
            height="16"
            width="auto"
          />
          <img
            className="h-5 w-fit dark:invert"
            src="https://cdn.simpleicons.org/nike"
            alt="Nike Logo"
            height="20"
            width="auto"
          />
          <img
            className="h-4 w-fit dark:invert"
            src="https://cdn.simpleicons.org/laravel/FF2D20"
            alt="Laravel Logo"
            height="16"
            width="auto"
          />
          <img
            className="h-5 w-fit dark:invert"
            src="https://cdn.simpleicons.org/lemonsqueezy/D4E157"
            alt="Lemon Squeezy Logo"
            height="20"
            width="auto"
          />
          <img
            className="h-6 w-fit dark:invert"
            src="https://cdn.simpleicons.org/supabase/3FCF8E"
            alt="Supabase Logo"
            height="24"
            width="auto"
          />
          <img
            className="h-4 w-fit dark:invert"
            src="https://cdn.simpleicons.org/tailwindcss/06B6D4"
            alt="Tailwind CSS Logo"
            height="16"
            width="auto"
          />
          <img
            className="h-5 w-fit dark:invert"
            src="https://cdn.simpleicons.org/vercel"
            alt="Vercel Logo"
            height="20"
            width="auto"
          />
          <img
            className="h-5 w-fit dark:invert"
            src="https://cdn.simpleicons.org/zapier/FF4A00"
            alt="Zapier Logo"
            height="20"
            width="auto"
          />
        </div>
      </div>
    </section>
  );
}
