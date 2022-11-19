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
    , containerName = process.env.AZURE_STORAGE_CONTAINER_NAME
;

const handleError = (err, res) => {
    res.status(500);
    res.render('error', { error: err });
};

const getBlobName = originalName => {
    const identifier = "CLIENTID"; // Make client identity
    return `${identifier}/${originalName}.txt`;
};

router.post('/', uploadStrategy, (req, res) => {
    const blobService = [];
    
    // Creates blob categories 1 through 6
    for(let i = 1; i <= 6; i++){ // Possible error: These variable declarations might not happen before appending data to blobs
        blobService.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,getBlobName('Category' + i)));
    }
    
    for(let i = 1; i <= 6; i++){
        if(req.body[('value' + i)] != ''){
            let value = req.body[('value' + i)] + ' ';
            let date = req.body[('date' + i)] + ' ';
            blobService[i - 1].appendBlock(value, value.length).catch((err)=>{if(err) {handleError(err);return;}});
            blobService[i - 1].appendBlock(date, date.length).catch((err)=>{if(err) {handleError(err);return;}});
        }
    }
    res.render('success', { 
        message: 'Your data point has been stored successfully.' 
    });
    
});

module.exports = router;