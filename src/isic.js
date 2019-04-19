import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';

const URL = 'https://isic-archive.com/api/v1';

const SLEEP_MILLISECONDS = 500;

// const LIMIT = 50; // Max limit
const LIMIT = 20;

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

const dataDir = path.resolve(__dirname, '../data');

const downloadImageMetadata = async id => {
  // e.g.
  // { _id: '5436e3abbae478396759f0cf',
  //   _modelType: 'image',
  //   created: '2014-10-09T19:36:11.989000+00:00',
  //   creator: { _id: '5450e996bae47865794e4d0d', name: 'User 6VSN' },
  //   dataset:
  //    { _accessLevel: 0,
  //      _id: '5a2ecc5e1165975c945942a2',
  //      description:
  //       'Moles and melanomas.\nBiopsy-confirmed melanocytic lesions. Both malignant and benign lesions are included.',
  //      license: 'CC-0',
  //      name: 'UDA-1',
  //      updated: '2014-11-10T02:39:56.492000+00:00' },
  //   meta:
  //    { acquisition: [Object],
  //      clinical: [Object],
  //      unstructured: [Object],
  //      unstructuredExif: {} },
  //   name: 'ISIC_0000000',
  //   notes: { reviewed: [Object], tags: [Array] },
  //   updated: '2015-02-23T02:48:17.495000+00:00' }
  return fetch(`${URL}/image/${id}`).then(res => res.json());
};

const downloadAndSaveImageMetadata = async id => {
  const metadata = await downloadImageMetadata(id);
  return fs.writeFile(
    `${dataDir}/${id}.json`,
    JSON.stringify(metadata, null, '  ')
  );
};

const downloadFile = async (url, path) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', err => reject(err));
    fileStream.on('finish', () => resolve());
  });
};

export const downloadAndSaveImage = async id => {
  return downloadFile(`${URL}/image/${id}/download`, `${dataDir}/${id}.jpg`);
};

export const downloadImageAndMetadata = async id => {
  console.log(`downloading image ${id}`);
  await downloadAndSaveImageMetadata(id);
  await downloadAndSaveImage(id);
};

export const downloadImages = async (offset = 0) => {
  // e.g.
  // [ { _id: '5436e3b1bae478396759f133',
  //      name: 'ISIC_0000050',
  //      updated: '2015-02-23T02:58:29.441000+00:00' },
  //   ...
  // ]
  const images = await fetch(
    `${URL}/image?limit=${LIMIT}&offset=${offset}`
  ).then(res => res.json());

  if (images) {
    const promises = images.map(image => downloadImageAndMetadata(image._id));

    // Wait for batch so that we don't run out of mem
    await Promise.all(promises);

    // Sleep to avoid rate limiting
    await timeout(SLEEP_MILLISECONDS);

    await downloadImages(offset + LIMIT);
  }
};
