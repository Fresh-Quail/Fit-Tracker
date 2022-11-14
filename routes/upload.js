if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const
      express = require('express')
    , router = express.Router()

    , multer = require('multer')
    , inMemoryStorage = multer.memoryStorage()
    , uploadStrategy = multer({ storage: inMemoryStorage }).single('image')

    , { AppendBlobClient } = require('@azure/storage-blob')
    , getStream = require('into-stream')
    , containerName = 'localfit'
;

const handleError = (err, res) => {
    res.status(500);
    res.render('error', { error: err });
};

// const getBlobName = originalName => {
//     const identifier = Math.random().toString().replace(/0\./, ''); // remove "0." from start of string
//     return `${identifier}-${originalName}`;
// };
// function submitEntries(req, res) {
//     const body = [];
//     req.on('data', data => {
//         console.log('Pushing P');
//         body.push(data);
//     });

//     req.on('end', () => {
//         console.log('Success!');
//         const requestBody = Buffer.concat(body).toString();
//         console.log(requestBody);
//     })
// }


router.post('/', uploadStrategy, (req, res) => {

    const
          blobName = "file.txt"
        , blobService = new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,blobName)
    ;
    
    blobService.createIfNotExists();
    blobService.appendBlock(req.body['image'] + '\n', (req.body['image'] + '\n').length)
    .then(
        ()=>{
            res.render('success', { 
                message: 'File uploaded to Azure Blob storage.' 
            });
        }
    ).catch(
        (err)=>{
        if(err) {
            handleError(err);
            return;
        }
    })
});

module.exports = router;