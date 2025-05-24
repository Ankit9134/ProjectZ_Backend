const express = require('express');
const {getAllCollections, getActiveCollections, createCollection, updateCollection, deleteCollection, clickCounts, getClicksByTimeframe} = require('../../controller/marketing-dashboard/collectionController')
const upload = require('../../config/multerConfig');

const router = express.Router();

router.get('/', getAllCollections);
router.post('/', createCollection);

router.post('/collection-click/:_id', clickCounts)   // add a new click entry with current date
router.get('/:id/clicks', getClicksByTimeframe)

router.get('/active', getActiveCollections);

router.put('/:id', upload, updateCollection);
router.delete('/:id', deleteCollection);

module.exports = router;
