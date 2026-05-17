import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { VerifyEmail as BaseVerifyEmail } from '@repo/mail/templates';

const VerifyEmail = BaseVerifyEmail as typeof BaseVerifyEmail & {
  PreviewProps?: typeof previewProps;
};

const previewProps = {
  locale: routing.defaultLocale,
  messages: defaultMessages,
  url: 'https://example.com',
  name: 'username',
};

VerifyEmail.PreviewProps = previewProps;

export default VerifyEmail;
