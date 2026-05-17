import EmailButton from '../components/email-button';
import EmailLayout from '../components/email-layout';
import type { BaseEmailProps } from '../types';
import { Text } from '@react-email/components';
import { createTranslator } from 'use-intl/core';

interface VerifyEmailProps extends BaseEmailProps {
  url: string;
  name: string;
}

export default function VerifyEmail({
  url,
  name,
  locale,
  messages,
}: VerifyEmailProps) {
  const t = createTranslator({
    locale,
    messages,
    namespace: 'Mail.verifyEmail',
  });

  return (
    <EmailLayout locale={locale} messages={messages}>
      <Text>{t('title', { name })}</Text>
      <Text>{t('body')}</Text>
      <EmailButton href={url}>{t('confirmEmail')}</EmailButton>
    </EmailLayout>
  );
}
