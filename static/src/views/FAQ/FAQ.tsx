import CollapsableCard from '../../components/Accordion/CollapsableCard/CollapsableCard';
import React from 'react';

type FAQsType = { question: string; answer: string }[];

const FAQ: React.FC = () => {
  const [faqs, setFaqs] = React.useState<FAQsType>([]);

  React.useEffect(() => {
    (async () => {
      const res = await fetch('/faqs', {
        method: 'GET'
      });
      const json: { faq: FAQsType } = await res.json();
      if (res.ok) setFaqs(json.faq);
    })();
  }, []);

  return (
    <div className="container">
      <div className="row">
        <div className="col-12 col-md-6 offset-md-3">
          <h1 className="text-center">Frequently Asked Questions </h1>
          <h4 className="text-center mb-5">
            Got questions? We've got answers.
          </h4>
          <div id="faqs">
            {faqs.map((card, key) => {
              const answer = card.answer.replace(/ \\n /g, '\n\n');
              return (
                <CollapsableCard
                  question={card.question}
                  answer={answer}
                  parentId="faqs"
                  id={key}
                  key={key}
                />
              );
            })}
          </div>
          <h5 className="mt-5 text-center">
            Still need help? Try messaging us with the bubble on the bottom
            right!
          </h5>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
