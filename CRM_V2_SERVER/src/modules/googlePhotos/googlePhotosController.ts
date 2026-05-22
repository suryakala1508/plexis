// import { Request, Response } from "express";
// import { OAuth2Client } from "google-auth-library";
// import axios from "axios";
// import { ENV } from "../../config/env";

// import { GooglePhotosBatch } from "./GooglePhotosBatch";

// const getOAuthClient = () =>
//   new OAuth2Client(
//     ENV.GOOGLE_PHOTOS_CLIENT_ID,
//     ENV.GOOGLE_PHOTOS_CLIENT_SECRET,
//     ENV.GOOGLE_PHOTOS_REDIRECT_URI
//   );

// // Step 1: Redirect user to Google OAuth (Now expects a POST with array of urls)
// export const getAuthUrl = async (req: Request, res: Response) => {
//   try {
//     const { imageUrls, galleryUrl, clientEmail } = req.body;
    
//     // Ensure we have an array to process, even if it's just one image
//     const urlsToProcess = Array.isArray(imageUrls) ? imageUrls : [req.query.imageUrl as string].filter(Boolean);
//     const redirectTarget = galleryUrl || `${ENV.FRONTEND_URL}/`;

//     if (urlsToProcess.length === 0) {
//       return res.status(400).json({ error: "Missing imageUrls parameter" });
//     }

//     // Save batch to Mongo with 1h expiry
//     const batch = await GooglePhotosBatch.create({
//       imageUrls: urlsToProcess,
//       galleryUrl: redirectTarget,
//       clientEmail: clientEmail || ""
//     });

//     const client = getOAuthClient();
//     const url = client.generateAuthUrl({
//       access_type: "offline",
//       scope: ["https://www.googleapis.com/auth/photoslibrary.appendonly"],
//       state: batch._id.toString(), // Pass the Mongo ID instead of heavy URLs
//     });

//     res.json({ url });
//   } catch (error) {
//     console.error("Error generating auth url", error);
//     res.status(500).json({ error: "Failed to initialize Google Photos export" });
//   }
// };

// // Step 2: Handle callback, upload images to Google Photos
// export const handleCallback = async (req: Request, res: Response) => {
//   const code = req.query.code as string;
//   const batchId = req.query.state as string;

//   if (!code || !batchId) {
//     res.redirect(`${ENV.FRONTEND_URL}?googlePhotos=error&msg=missing_params`);
//     return;
//   }

//   try {
//     const batch = await GooglePhotosBatch.findById(batchId);
//     if (!batch) {
//        res.redirect(`${ENV.FRONTEND_URL}?googlePhotos=error&msg=batch_expired`);
//        return;
//     }

//     const tokenResponse = await axios.post(
//       "https://oauth2.googleapis.com/token",
//       {
//         code,
//         client_id: ENV.GOOGLE_PHOTOS_CLIENT_ID,
//         client_secret: ENV.GOOGLE_PHOTOS_CLIENT_SECRET,
//         redirect_uri: ENV.GOOGLE_PHOTOS_REDIRECT_URI,
//         grant_type: "authorization_code",
//       }
//     );
//     const accessToken = tokenResponse.data.access_token;

//     const newMediaItems = [];

//     // Loop through all images stored in the batch cache
//     for (const url of batch.imageUrls) {
//         try {
//           // Fetch image from DigitalOcean
//           const imageResponse = await axios.get(url, { responseType: "arraybuffer" });
//           const imageBuffer = Buffer.from(imageResponse.data);
//           const mimeType = imageResponse.headers["content-type"] || "image/jpeg";
//           const filename = url.split("/").pop() || "photo.jpg";

//           // Upload raw bytes to Google Photos buffer
//           const uploadResponse = await axios.post(
//             "https://photoslibrary.googleapis.com/v1/uploads",
//             imageBuffer,
//             {
//               headers: {
//                 Authorization: `Bearer ${accessToken}`,
//                 "Content-Type": "application/octet-stream",
//                 "X-Goog-Upload-Content-Type": mimeType,
//                 "X-Goog-Upload-Protocol": "raw",
//               },
//             }
//           );
          
//           newMediaItems.push({
//             description: "Uploaded via Plexis CRM",
//             simpleMediaItem: {
//               fileName: filename,
//               uploadToken: uploadResponse.data,
//             },
//           });
//         } catch (itemErr: any) {
//             console.error("Failed to upload single item buffer to Google", url, itemErr.message);
//         }
//     }

//     // Step C: Create media items in library (up to 50 at a time)
//     // For safety against large galleries, we chunk them natively into batches of 50
//     const chunkSize = 50;
//     for (let i = 0; i < newMediaItems.length; i += chunkSize) {
//        const chunk = newMediaItems.slice(i, i + chunkSize);
//        await axios.post(
//           "https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate",
//           { newMediaItems: chunk },
//           { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
//         );
//     }

//     // Clean up temporary cache
//     await GooglePhotosBatch.findByIdAndDelete(batchId);

//     // Redirect back to exactly where the user was
//     const emailParam = batch.clientEmail ? `&email=${encodeURIComponent(batch.clientEmail)}` : '';
//     res.redirect(`${batch.galleryUrl}?googlePhotos=success${emailParam}&count=${newMediaItems.length}`);
//   } catch (err: any) {
//     console.error("Google Photos upload error:", err?.response?.data || err.message);
//     res.redirect(`${ENV.FRONTEND_URL}?googlePhotos=error`);
//   }
// };