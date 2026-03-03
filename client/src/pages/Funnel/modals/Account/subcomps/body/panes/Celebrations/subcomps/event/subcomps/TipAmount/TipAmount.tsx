import React from 'react';

const TipAmount = ({ tip }: { tip: number }) => {
  if (!Number.isFinite(tip) || tip <= 0) return null;
  return (
    <span className='tip-amount' title='Tip Amount'>
      +${tip}
    </span>
  );
};

export default React.memo(TipAmount);
