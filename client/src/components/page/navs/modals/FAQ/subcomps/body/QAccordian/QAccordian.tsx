import React from 'react';
import { Accordion } from 'react-bootstrap';
import { addTrackingParams, trackLinkClick } from '@Utils';
import './style.css';

interface Questions {
  q: string;
  a: string;
  key: number;
}

/**
 * Safely parse FAQ answer text and convert only <a> tags to React links
 * All other HTML is stripped and rendered as plain text
 * This prevents XSS attacks while allowing links in FAQ content
 * Adds UTM tracking parameters and click tracking for external links
 */
const parseFAQAnswer = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const linkRegex =
    /<a\s+href=['"]([^'"]+)['"](?:\s+target=['"]([^'"]+)['"])?(?:\s+rel=['"]([^'"]+)['"])?>(.*?)<\/a>/gi;

  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Extract link attributes
    const originalHref = match[1];
    const target = match[2] || '_blank';
    const rel = match[3] || 'noopener noreferrer';
    const linkText = match[4];

    // Only allow http/https links or relative paths
    const isSafeUrl =
      originalHref.startsWith('/') ||
      originalHref.startsWith('http://') ||
      originalHref.startsWith('https://');

    if (isSafeUrl) {
      // Add tracking parameters to external URLs
      const trackedHref = addTrackingParams(
        originalHref,
        { medium: 'faq' },
        linkText
      );

      parts.push(
        <a
          key={`link-${match.index}`}
          href={trackedHref}
          target={target}
          rel={rel}
          className='natural-link'
          onClick={() =>
            trackLinkClick(originalHref, linkText, { medium: 'faq' })
          }
        >
          {linkText}
        </a>
      );
    } else {
      // If URL is unsafe, just render the link text
      parts.push(linkText);
    }

    lastIndex = linkRegex.lastIndex;
  }

  // Add remaining text after last link
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no links found, return original text
  return parts.length > 0 ? parts : [text];
};

const QAccordian = ({ questions }: { questions: Questions[] }) => (
  <Accordion
    flush
    defaultActiveKey={'FAQ-accordion-' + String(questions[0].key)}
  >
    {questions.map((q) => (
      <Accordion.Item
        key={'FAQ-accordion-' + String(q.key)}
        eventKey={'FAQ-accordion-' + String(q.key)}
      >
        <div key={'FAQ-accordion-' + String(q.key)}>
          <Accordion.Header className={'faq-question'}>{q.q}</Accordion.Header>
          <Accordion.Body className={'faq-answer'}>
            {parseFAQAnswer(q.a)}
          </Accordion.Body>
        </div>
      </Accordion.Item>
    ))}
  </Accordion>
);

export default React.memo(QAccordian);
