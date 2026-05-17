import type { ReactElement } from 'react';

/**
 * Render React email component to HTML string
 *
 * Avoid @react-email/render to prevent prettier imports in workerd.
 */
export const renderEmailHtml = async (email: ReactElement): Promise<string> => {
  const reactDomServer = (await import('react-dom/server')) as {
    renderToReadableStream?: (element: ReactElement) => Promise<ReadableStream>;
    renderToStaticMarkup?: (element: ReactElement) => string;
    renderToString?: (element: ReactElement) => string;
  };

  if (reactDomServer.renderToReadableStream) {
    const stream = await reactDomServer.renderToReadableStream(email);
    return await new Response(stream).text();
  }

  if (reactDomServer.renderToStaticMarkup) {
    return reactDomServer.renderToStaticMarkup(email);
  }

  if (reactDomServer.renderToString) {
    return reactDomServer.renderToString(email);
  }

  return '';
};

/**
 * Decode HTML entities to plain text
 */
const decodeHtmlEntities = (text: string): string =>
  text
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");

/**
 * Convert HTML to plain text
 *
 * Simple HTML-to-text fallback for email providers.
 */
export const toPlainText = (html: string): string => {
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return decodeHtmlEntities(stripped);
};
