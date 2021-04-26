import React from 'react';
// import css from './Accordion.module.css';
import CollapsableCard from './CollapsableCard/CollapsableCard';

interface FAQType {
  question: string;
  answer: string;
}

export default function Accordion(props: any) {
  return (
    <div id={props.id}>
      {props.faq.length > 0
        ? props.faq.map((card: FAQType, key: number) => {
            const answer = card.answer.replace(/ \\n /g, '\n\n');
            return (
              <CollapsableCard
                question={card.question}
                answer={answer}
                parentId={props.id}
                id={key}
                key={key}
              />
            );
          })
        : null}
    </div>
  );
}
