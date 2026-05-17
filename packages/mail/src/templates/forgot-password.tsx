import EmailButton from '../components/email-button';
import EmailLayout from '../components/email-layout';
import type { BaseEmailProps } from '../types';
import { Text } from '@react-email/components';
import { createTranslator } from 'use-intl/core';

interface ForgotPasswordProps extends BaseEmailProps {
  url: string;
  name: string;
}

export default function ForgotPassword({
  url,
  name,
  locale,
  messages,
}: ForgotPasswordProps) {
  const t = createTranslator({
    locale,
    messages,
    namespace: 'Mail.forgotPassword',
  });

  return (
    <EmailLayout locale={locale} messages={messages}>
      <Text>{t('title', { name })}</Text>
      <Text>{t('body')}</Text>
      <EmailButton href={url}>{t('resetPassword')}</EmailButton>
    </EmailLayout>
  );
}
