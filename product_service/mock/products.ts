export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

export const products: Product[] = [
  {
    id: "1",
    title: "Produkt 1",
    description: "Opis produktu 1",
    price: 100,
  },
  {
    id: "2",
    title: "Produkt 2",
    description: "Opis produktu 2",
    price: 200,
  },
  {
    id: "uuid-3",
    title: "Produkt Specjalny",
    description: "Opis produktu specjalnego",
    price: 300,
  },
];