export type Creator = {
  id: string;
  userId: string;
  name: string;
  about: string;
  photo: string;
  categories: string[];
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCreatorDto = {
  name: string;
  about: string;
  photo: string;
  userId: string;
  categories?: string[];
  price: number;
};
