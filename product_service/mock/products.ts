export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

export const products: Product[] = [
  {
    id: "1",
    title: "Cloud Masterpiece",
    description: "A premium digital asset designed for cloud computing enthusiasts.",
    price: 100,
  },
  {
    id: "2",
    title: "Serverless Mug",
    description: "Keep your coffee hot while your Lambda functions stay cold-started.",
    price: 25,
  },
  {
    id: "uuid-3",
    title: "AWS Hero Cape",
    description: "A legendary item for those who successfully deployed Task 3.",
    price: 50,
  },
];