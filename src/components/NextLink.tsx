'use client';

import React from 'react';


export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export default function Link(props: LinkProps) {
  const { href, children, onClick, className, ...rest } = props;

  // Fallback to a standard anchor tag if next/link is not available in the environment
  return (
    <a href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
