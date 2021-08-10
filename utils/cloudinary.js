const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDDINARY_API_KEY,
    api_secret: process.env.CLOUDDINARY_API_SECRET
});

// const uploadSingle = (file) => {
//     return new Promise((resolve, reject) => {
//         cloudinary.uploader.upload(file, {
//             folder: 'status',
//             use_filename: true,
//         })
//             .then(result => {
//                 if (result) {
//                     const fs = require('fs');
//                     fs.unlinkSync(file);
//                     resolve({
//                         secure_url: result.secure_url,
//                         public_id: result.public_id
//                     })
//                 }
//             })
//     })
// }

module.exports = cloudinary;