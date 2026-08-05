import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function SiteLink({ item, active = false, children, ...props }) {
  const content = children ?? item.label;

  if (item.type === 'external') {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" {...props}>
        {content}
      </a>
    );
  }

  if (item.type === 'anchor') {
    return <a href={item.href} {...props}>{content}</a>;
  }

  const RouteLink = active ? NavLink : Link;
  const activeProps = active && item.to === '/' ? { end: true } : {};
  return <RouteLink to={item.to} {...activeProps} {...props}>{content}</RouteLink>;
}
