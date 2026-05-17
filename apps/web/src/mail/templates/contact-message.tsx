import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { ContactMessage as BaseContactMessage } from '@repo/mail/templates';

const ContactMessage = BaseContactMessage as typeof BaseContactMessage & {
  PreviewProps?: typeof previewProps;
};

const previewProps = {
  locale: routing.defaultLocale,
  messages: defaultMessages,
  name: 'username',
  email: 'username@example.com',
  message: 'This is a test message',
};

ContactMessage.PreviewProps = previewProps;

export default ContactMessage;
