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

// POST upload page
router.post('/', uploadStrategy, (req, res) => {
    const blobService = [];
    // Creates blob representing category 1
    blobService.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,getBlobName('Category1')));
    // Creates blobs representing categories 2 through 6
    for(let i = 2; i <= 6; i++){
        blobService.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,getBlobName('Category' + i)));
    }
    // Check if category 6 exists (if so, don't upload anything because all 6 categories have been entered)
    blobService[5].exists().then(async(exists) => {
        if(exists){
            res.render('success', { 
                message: 'You have already reached the maximum category limit.' 
            });
        }
        else{
            let str = req.body['category-name'][0]+'\n'+req.body['category-name'][1]+'\n';
            // The creation of categorgy 1 (only if it does not exist) ------------------------------
            await blobService[0].exists().then(async(exists) => {
                // If category 1 does not exist, create it and then break
                if(!exists){
                    console.log('Category1 does not exist -> Create it.');
                    blobService[0].create();
                    blobService[0].appendBlock(str, str.length).then(()=>{})
                    .catch((err)=>{if(err) {handleError(err);return;}});
                }
                else{ // If category 1 does not exist, for each blob after one, only create it if the one before exists
                    console.log('Category1 exists -> Create next available category.');
                    for(var i = 5; i >= 0; i--)
                    {
                        await blobService[i].exists().then(async(exists) => {
                            // If this category exists, create following category and append name & units
                            if(exists){
                                console.log('Category' + (i+1) + ' exists.');
                                await blobService[i+1].exists().then(async(exists) => {
                                    if(!exists){
                                        console.log('Category' + (i+2) + ' does not exist -> Create it.');
                                        await blobService[i+1].create();
                                        await blobService[i+1].appendBlock(str, str.length).then(()=>{})
                                        .catch((err)=>{if(err) {handleError(err);return;}});
                                    }
                                    else{
                                        console.log('Category' + (i+2) + ' exists -> Don\'t overwrite it.');
                                    }
                                })
                                .catch((err)=>{if(err) {handleError(err);return;}});
                            }
                            else{
                                console.log('Category' + (i+1) + ' does not exist -> Check Category'+ (i) + '.');
                            }
                        })
                        .catch((err)=>{if(err) {handleError(err);return;}})
                    }
                }
            })
            res.render('success', { 
                message: 'Your category has been stored successfully.' 
            });
        }
    })
});

module.exports = router;