import React from 'react';
import { Badge } from 'react-bootstrap';
import './style.css';

type LinkBadgeProps = {
  bg: string;
  cls: string;
};

const LinkBadge = ({ bg, cls }: LinkBadgeProps) => (
  <Badge
    bg={bg}
    className={`text-muted ${cls}`}
  >
    {cls}
  </Badge>
);

export default React.memo(LinkBadge);
