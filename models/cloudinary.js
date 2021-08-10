const cloudinary = require('../utils/cloudinary');

const fileUploadSingle = (file) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(file, {
            folder: 'home/single'
        })
            .then(result => {
                if (result) {
                    fs.unlinkSync(file);
                    resolve({
                        url: result.secure_url
                    })
                }
            })
    })
}

const fileUploadMultiple = (file) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(file, {
            folder: 'multiple'
        })
            .then(result => {
                if (result) {
                    const fs = require('fs');
                    fs.unlinkSync(file);
                    resolve({
                        url: result.secure_url,
                        id: result.public_id,
                        thumb1: reSizeImage(result.public_id, 200, 200),
                        main: reSizeImage(result.public_id, 500, 500),
                        thumb2: reSizeImage(result.public_id, 300, 300)
                    })
                }
            })
    })
}

const reSizeImage = (id, h, w) => {
    return cloudinary.url(id, {
        height: h,
        width: w,
        crop: 'scale',
        format: 'jpg'
    })
}
module.exports = fileUploadSingle;
module.exports = fileUploadMultiple;