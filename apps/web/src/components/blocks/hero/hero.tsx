import { AnimatedGroup } from '@/components/tailark/motion/animated-group';
import { TextEffect } from '@/components/tailark/motion/text-effect';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import {
  ArrowRight,
  CheckCircle2Icon,
  CpuIcon,
  TerminalSquareIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      y: 12,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  const t = useTranslations('HomePage.hero');
  const linkIntroduction = '/#features';
  const linkPrimary = '/#pricing';
  const linkSecondary = '/dashboard';

  return (
    <>
      <main id="hero" className="overflow-hidden">
        <section>
          <div className="relative border-b pt-12">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <LocaleLink
                    href={linkIntroduction}
                    className="group mx-auto flex w-full max-w-[calc(100vw-3rem)] items-center justify-center gap-2 rounded-2xl border border-border bg-background/80 p-2 pl-4 hover:bg-muted sm:w-fit sm:rounded-full sm:p-1 sm:pl-4"
                  >
                    <span className="text-foreground text-balance text-center text-sm">
                      {t('introduction')}
                    </span>

                    <div className="size-6 shrink-0 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </LocaleLink>
                </AnimatedGroup>

                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 text-balance text-6xl font-bricolage-grotesque font-medium tracking-normal lg:mt-14 xl:text-[6.5rem]"
                >
                  {t('title')}
                </TextEffect>

                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-8 max-w-3xl text-balance text-lg text-muted-foreground md:text-xl"
                >
                  {t('description')}
                </TextEffect>

                <AnimatedGroup
                  variants={transitionVariants}
                  className="mx-auto mt-8 grid max-w-3xl gap-3 text-left text-sm text-muted-foreground sm:grid-cols-3"
                >
                  <div className="flex items-center gap-2 border-t pt-3">
                    <CheckCircle2Icon className="size-4 text-primary dark:text-accent" />
                    <span>Production base</span>
                  </div>
                  <div className="flex items-center gap-2 border-t pt-3">
                    <CpuIcon className="size-4 text-primary dark:text-accent" />
                    <span>Agent-ready</span>
                  </div>
                  <div className="flex items-center gap-2 border-t pt-3">
                    <TerminalSquareIcon className="size-4 text-primary dark:text-accent" />
                    <span>Self-hostable</span>
                  </div>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                  <div
                    key={1}
                    className="rounded-[calc(var(--radius-xl)+0.125rem)] border border-primary/15 bg-primary/10 p-0.5 dark:border-accent/20 dark:bg-accent/10"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base"
                    >
                      <LocaleLink href={linkPrimary}>
                        <span className="text-nowrap">{t('primary')}</span>
                      </LocaleLink>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-10.5 rounded-xl px-5"
                  >
                    <LocaleLink href={linkSecondary}>
                      <span className="text-nowrap">{t('secondary')}</span>
                    </LocaleLink>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div
                  aria-hidden
                  className="bg-linear-to-b to-background absolute inset-0 z-10 from-transparent from-55%"
                />
                <div className="inset-shadow-2xs ring-muted/50 dark:inset-shadow-white/20 relative mx-auto max-w-6xl overflow-hidden rounded-2xl border bg-card p-4 shadow-lg shadow-zinc-950/10 ring-1">
                  <Image
                    className="bg-muted/50 relative hidden rounded-xl dark:block"
                    src="/images/blocks/music.png"
                    alt="AeloKit workspace preview"
                    width={2796}
                    height={2008}
                  />
                  <Image
                    className="z-2 border-border/25 relative rounded-xl border dark:hidden"
                    src="/images/blocks/music-light.png"
                    alt="AeloKit workspace preview"
                    width={2796}
                    height={2008}
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  );
}
