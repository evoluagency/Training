import type {Metadata} from 'next';

export const metadata:Metadata = {
  title: 'Simulador Tributário 2027',
  description: 'Comparador tributário de cenários de compra e venda, com RBT12, Anexos do Simples Nacional, ICMS, CBS, IBS e transporte.',
  alternates: {canonical: '/simulador'},
};

export {default} from './melhorregime/page';
