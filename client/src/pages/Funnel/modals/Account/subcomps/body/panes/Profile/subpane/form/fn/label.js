export const handleLabel = (field) => {
  if (field.required) {
    return (
      <>
        {field.label}
        <span className='req-asterisk'> *</span>
      </>
    );
  } else {
    return <>{field.label}</>;
  }
};
