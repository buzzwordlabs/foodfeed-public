import React, { useState } from 'react';

import Emoji from '../../Emoji';
import css from './CollapsableCard.module.css';
import { textColor } from '../../../constants';

interface State {
  expanded: boolean;
}

interface Props {
  id: number;
  parentId: string;
  question: string;
  answer: string;
}

const CollapsableCard: React.FC<Props> = (props) => {
  const [state, setState] = useState<State>({ expanded: false });

  const expand = () => {
    setState({ ...state, expanded: !state.expanded });
  };

  const { question, answer } = props;

  return (
    <div className={`${css.cardItem} ${css.shadow}`}>
      <div className={`${css.cardHeader}`} onClick={expand}>
        <h5
          className={`my-auto d-inline ${css.noSelect}`}
          style={{ fontWeight: 600 }}
        >
          {question}
        </h5>
        <span className="d-inline" style={{ float: 'right' }}>
          {state.expanded ? (
            <Emoji
              value="📖"
              ariaLabel="Open Book"
              style={{ fontSize: '1.2rem' }}
            />
          ) : (
            <Emoji
              value="📘"
              ariaLabel="Closed Book"
              style={{ fontSize: '1.2rem' }}
            />
          )}
        </span>
      </div>
      {state.expanded && (
        <div className="card-body" style={{ paddingTop: 0, paddingBottom: 0 }}>
          {answer.split('\n').map((string: string, key: number) => (
            <p style={{ fontSize: '1.1rem', color: textColor }} key={key}>
              {string}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollapsableCard;
