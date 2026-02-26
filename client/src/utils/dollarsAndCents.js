import accounting from 'accounting';

export const dollarsAndCents = (amount) => {
  if (Number.isInteger(amount)) return '$' + amount;
  else return accounting.formatMoney(amount);
};
