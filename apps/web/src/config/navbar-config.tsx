'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import {
  AudioLinesIcon,
  BuildingIcon,
  ChartNoAxesCombinedIcon,
  CircleDollarSignIcon,
  CircleHelpIcon,
  ComponentIcon,
  CookieIcon,
  FileTextIcon,
  FilmIcon,
  FlameIcon,
  FootprintsIcon,
  ImageIcon,
  ListChecksIcon,
  LockKeyholeIcon,
  LogInIcon,
  MailIcon,
  MailboxIcon,
  MessageCircleIcon,
  NewspaperIcon,
  RocketIcon,
  ShieldCheckIcon,
  SnowflakeIcon,
  SplitSquareVerticalIcon,
  SquareCodeIcon,
  SquareKanbanIcon,
  SquarePenIcon,
  ThumbsUpIcon,
  UserPlusIcon,
  UsersIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { websiteConfig } from './website';

/**
 * Get navbar config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://example.com/docs/config/navbar
 *
 * @returns The navbar config with translated titles and descriptions
 */
export function useNavbarLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');

  return [
    {
      title: t('features.title'),
      href: Routes.Features,
      external: false,
    },
    {
      title: t('pricing.title'),
      href: Routes.Pricing,
      external: false,
    },
    ...(websiteConfig.blog.enable
      ? [
          {
            title: t('blog.title'),
            href: Routes.Blog,
            external: false,
          },
        ]
      : []),
    ...(websiteConfig.docs.enable
      ? [
          {
            title: t('docs.title'),
            href: Routes.Docs,
            external: false,
          },
        ]
      : []),
  ];
}
