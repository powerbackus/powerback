const handleMessage = (firstName, donation) =>
  firstName &&
  donation && (
    <>
      {` ${firstName.length ? `${firstName}, t` : ' T'}`}
      hank you for your{' '}
      <span className='alert-donation-amt'>{`$${donation}`}</span>{' '}
      contribution!
    </>
  );

export { handleMessage };
