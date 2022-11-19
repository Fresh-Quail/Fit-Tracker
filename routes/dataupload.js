if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const
      express = require('express')
    , router = express.Router()

    , multer = require('multer')
    , inMemoryStorage = multer.memoryStorage()
    , uploadStrategy = multer({ storage: inMemoryStorage }).any('image')

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


router.post('/', uploadStrategy, async(req, res) => {
    const blobService = [];
    
    //Creates blob categorys 1 through 6
    for(let i = 1; i < 7; i++){ //Possible error: These variable declarations might not happen before appending data to blobs
        blobService.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,'Category-' + i + '.txt'));
    }
    
    for(let i = 1; i < 7; i++){
        if(req.body[('value' + i)] != "")
        {
            await blobService[i - 1].appendBlock(req.body[('value' + i)] + '\n', (req.body[('value' + i)] + '\n').length).catch((err)=>{if(err) {handleError(err);return;}});
            await blobService[i - 1].appendBlock(req.body[('date' + i)] + '\n', (req.body[('date' + i)] + '\n').length).catch((err)=>{if(err) {handleError(err);return;}});
        }
    }
    res.render('success', { 
        message: 'File uploaded to Azure Blob storage.' 
    });
    
});

module.exports = router;