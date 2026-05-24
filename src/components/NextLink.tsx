'use client';

import React from 'react';
import NextNextLink from 'next/link';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export default function Link(props: LinkProps) {
  const { href, children, onClick, className, ...rest } = props;

  return (
    <NextNextLink href={href} className={className} {...rest}>
      {children}
    </NextNextLink>
  );
}
