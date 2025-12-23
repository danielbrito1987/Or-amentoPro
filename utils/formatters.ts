
export const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3').substring(0, 14);
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').substring(0, 15);
};

export const maskCPF_CNPJ = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      .substring(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    .substring(0, 18);
};

export const formatCurrency = (value: any) => {
  // Converte para número caso venha como string da API
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(amount)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

export const maskCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const amount = parseFloat(digits) / 100;
  if (isNaN(amount)) return '';
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
