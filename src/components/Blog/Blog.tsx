import type { CSSProperties } from 'react';
import { blogPosts } from '../../data/blog';
import { useReveal } from '../../hooks/useReveal';
import { isFilled } from '../../lib/utils';
import { Icon } from '../shared/Icon';
import { SplitText } from '../shared/SplitText';
import './blog.css';

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Blog() {
  const kicker = useReveal<HTMLParagraphElement>();
  const list = useReveal<HTMLOListElement>();
  return (
    <section id="blog" className="section blog" aria-labelledby="blog-title">
      <div className="container blog__layout">
        <header className="section-head blog__head">
          <p className="kicker" data-reveal ref={kicker}>
            Blog
          </p>
          <SplitText as="h2" id="blog-title" className="heading" text="Notes and ideas" mode="words" />
          <p className="lede">Thinking on design, marketing and building things, written down as it happens.</p>
        </header>

        <ol className="blog__list" role="list" ref={list} data-reveal="fade">
          {blogPosts.map((post, i) => {
            const live = isFilled(post.href);
            const inner = (
              <>
                <span className="blog__orb" aria-hidden="true" />
                <span className="blog__topic">{post.topic}</span>
                <span className="blog__title">{post.title}</span>
                <span className="blog__excerpt">{post.excerpt}</span>
                <span className="blog__meta">
                  {live ? (
                    <>
                      {isFilled(post.date) && <time dateTime={post.date}>{formatDate(post.date)}</time>}
                      <Icon name="arrow" size={16} />
                    </>
                  ) : (
                    <span className="blog__soon">In the works</span>
                  )}
                </span>
              </>
            );
            return (
              <li key={post.title} className="blog__item" style={{ '--i': i } as CSSProperties}>
                {live ? (
                  <a className="blog__row" href={post.href} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div className="blog__row is-draft">{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
