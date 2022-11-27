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

const getBlobName = (identifier, originalName) => {
    return `${identifier}/${originalName}.txt`;
};

// POST dataupload page
// Possible error: These variable declarations might not happen before appending data to blobs due to synchronocity
// Solution: Create async method(s) with await statements in them containing code below
router.post('/', uploadStrategy, (req, res) => {
    const appendBlobs = [];
    // Creates blob categories 1 through 6
    for(let i = 1; i <= 6; i++){
        appendBlobs.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,getBlobName(req.body['key'], 'Category' + i)));
    }
    
    for(let i = 1; i <= 6; i++){
        if(req.body[('value' + i)]){
            let entry = req.body[('value' + i)] + ' ' + req.body[('date' + i)] + '\n';
            console.log(entry);
            appendBlobs[i - 1].appendBlock(entry, entry.length).catch((err)=>{if(err) {handleError(err,res);return;}});
        }
    }
    res.render('success', { 
        message: 'Your data point has been stored successfully.' 
    });
});

module.exports = router;