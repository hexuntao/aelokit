import EmailLayout from '../components/email-layout';
import type { BaseEmailProps } from '../types';
import { Text } from '@react-email/components';
import { createTranslator } from 'use-intl/core';

interface ContactMessageProps extends BaseEmailProps {
  name: string;
  email: string;
  message: string;
}

export default function ContactMessage({
  name,
  email,
  message,
  locale,
  messages,
}: ContactMessageProps) {
  const t = createTranslator({
    locale,
    messages,
    namespace: 'Mail.contactMessage',
  });

  return (
    <EmailLayout locale={locale} messages={messages}>
      <Text>{t('name', { name })}</Text>
      <Text>{t('email', { email })}</Text>
      <Text>{t('message', { message })}</Text>
    </EmailLayout>
  );
}
