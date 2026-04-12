export type GalleryImage = {
  id: string;
  url: string;
  storagePath: string;
  position: number;
  createdAt: string;
};

export type Creator = {
  id: string;
  userId: string | null;
  name: string;
  about: string;
  photo: string;
  galleryImages?: GalleryImage[];
  categories: string[];
  price: number;
  age?: number;
  location?: string;
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
  age?: number;
  location?: string;
};
