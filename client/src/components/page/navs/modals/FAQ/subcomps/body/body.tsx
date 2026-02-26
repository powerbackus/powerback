import React from 'react';
import { Tab } from 'react-bootstrap';
import QAccordian from './QAccordian';
import { FAQ } from '@Tuples';
import './style.css';

const Body = () => (
  <Tab.Content>
    {FAQ.map((section) => (
      <Tab.Pane
        key={'FAQ-section-' + String(section.key)}
        eventKey={'FAQ-event-' + String(section.key)}
      >
        <QAccordian
          questions={
            section.questions as {
              q: string;
              a: string;
              key: number;
            }[]
          }
        />
      </Tab.Pane>
    ))}
  </Tab.Content>
);

export default React.memo(Body);
