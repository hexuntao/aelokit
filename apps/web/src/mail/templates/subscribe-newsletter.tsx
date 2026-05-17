import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { SubscribeNewsletter as BaseSubscribeNewsletter } from '@repo/mail/templates';

const SubscribeNewsletter =
  BaseSubscribeNewsletter as typeof BaseSubscribeNewsletter & {
    PreviewProps?: typeof previewProps;
  };

const previewProps = {
  locale: routing.defaultLocale,
  messages: defaultMessages,
};

SubscribeNewsletter.PreviewProps = previewProps;

export default SubscribeNewsletter;
