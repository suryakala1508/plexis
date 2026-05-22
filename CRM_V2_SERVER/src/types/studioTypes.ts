export interface SocialLink {
  platform: string;
  url: string;
}

export interface Studio {
  _id?: string;
  userId: string;
  studioName?: string;
  studioAddress?: [string];
  studioContactNumber?: [string];
  gstNumber?: string;
  panNumber?: string;
  socialLinks?: SocialLink[];
  createdAt?: Date;
  updatedAt?: Date;
}
