import React from 'react';
import ListGroup from 'react-bootstrap/esm/ListGroup';
import { RULES } from '@Tuples';
import './style.css';

const Body = () => (
  <div className='pt-lg-3'>
    <ListGroup className='pb-lg-2'>
      {RULES.map((rule, i) => (
        <ListGroup.Item key={rule}>{`${i + 1} ${rule}`}</ListGroup.Item>
      ))}
    </ListGroup>
    <p className='list-group-item escrow-info pt-3 pt-lg-2'>
      Contributions go directly into a secure holding account. If there's
      cause for your Celebration, your contribution is delivered to your
      chosen candidate.
    </p>
  </div>
);

export default React.memo(Body);
