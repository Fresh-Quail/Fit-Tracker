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

// POST upload page
router.post('/', uploadStrategy, (req, res) => {
    const appendBlobs = [];
    const userID = req.body['category-name'][3];
    // Creates blob representing category 1
    appendBlobs.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,getBlobName(userID, 'Category1')));
    // Creates blobs representing categories 2 through 6
    for(let i = 2; i <= 6; i++){
        appendBlobs.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,getBlobName(userID, 'Category' + i)));
    }
    // Check if category 6 exists (if so, don't upload anything because all 6 categories have been entered)
    appendBlobs[5].exists().then(async(exists) => {
        if(exists){
            res.render('success', { 
                message: 'You have already reached the maximum category limit.' 
            });
        }
        else{
            let str = req.body['category-name'][0]+'\t'+req.body['category-name'][1]+'\t'+req.body['category-name'][2]+'\t';
            // The creation of categorgy 1 (only if it does not exist) ------------------------------
            await appendBlobs[0].exists().then(async(exists) => {
                // If category 1 does not exist, create it and then break
                if(!exists){
                    console.log('Category1 does not exist -> Create it.');
                    appendBlobs[0].create();
                    appendBlobs[0].appendBlock(str, str.length).then(()=>{})
                    .catch((err)=>{if(err) {handleError(err,res);return;}});
                }
                else{ // If category 1 does not exist, for each blob after one, only create it if the one before exists
                    console.log('Category1 exists -> Create next available category.');
                    for(var i = 5; i >= 0; i--)
                    {
                        await appendBlobs[i].exists().then(async(exists) => {
                            // If this category exists, create following category and append name & units
                            if(exists){
                                console.log('Category' + (i+1) + ' exists.');
                                await appendBlobs[i+1].exists().then(async(exists) => {
                                    if(!exists){
                                        console.log('Category' + (i+2) + ' does not exist -> Create it.');
                                        await appendBlobs[i+1].create();
                                        await appendBlobs[i+1].appendBlock(str, str.length).then(()=>{})
                                        .catch((err)=>{if(err) {handleError(err,res);return;}});
                                    }
                                    else{
                                        console.log('Category' + (i+2) + ' exists -> Don\'t overwrite it.');
                                    }
                                })
                                .catch((err)=>{if(err) {handleError(err,res);return;}});
                            }
                            else{
                                console.log('Category' + (i+1) + ' does not exist -> Check Category'+ (i) + '.');
                            }
                        })
                        .catch((err)=>{if(err) {handleError(err,res);return;}})
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