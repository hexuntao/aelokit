import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { ForgotPassword as BaseForgotPassword } from '@repo/mail/templates';

const ForgotPassword = BaseForgotPassword as typeof BaseForgotPassword & {
  PreviewProps?: typeof previewProps;
};

const previewProps = {
  locale: routing.defaultLocale,
  messages: defaultMessages,
  url: 'https://example.com',
  name: 'username',
};

ForgotPassword.PreviewProps = previewProps;

export default ForgotPassword;
