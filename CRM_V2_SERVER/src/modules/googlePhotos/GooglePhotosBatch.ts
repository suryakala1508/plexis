// import mongoose, { Schema, Document } from "mongoose";

// export interface IGooglePhotosBatch extends Document {
//   imageUrls: string[];
//   galleryUrl: string;
//   clientEmail?: string;
//   createdAt: Date;
// }

// const GooglePhotosBatchSchema: Schema = new Schema(
//   {
//     imageUrls: { type: [String], required: true },
//     galleryUrl: { type: String, required: true },
//     clientEmail: { type: String, required: false },
//     createdAt: { type: Date, default: Date.now, expires: "1h" }, // auto-delete doc after 1 hour
//   },
//   { timestamps: true }
// );

// export const GooglePhotosBatch = mongoose.model<IGooglePhotosBatch>(
//   "GooglePhotosBatch",
//   GooglePhotosBatchSchema
// );
