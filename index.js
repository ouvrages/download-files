import CordovaPromiseFS from 'cordova-promise-fs';
import Promise  from 'bluebird';

const fs = CordovaPromiseFS({
  persistent: true,
  storageSize: 50 * 1024 * 1024,
  concurrency: 3,
  Promise: require('bluebird'),
});

function downloadFile(dirEntry, file) {
  return fs.exists(dirEntry.fullPath + file.filename)
    .then((fileEntry) => {

      if (fileEntry) {

        file.localURL = fileEntry.toURL();
        return Promise.resolve();

      } else {

        return fs.download(file.url, dirEntry.toURL() + file.filename)
          .then((fileEntry) => {
            return new Promise((resolve, reject) => {
              file.localURL = fileEntry.toURL();
              resolve();
            });
          });

      }
    });
}

function cleanUpFiles(dirEntry, files) {
  return fs.list(dirEntry.fullPath)
    .then((filenames) => {
      console.log('Existing files', filenames);
      return Promise.each(filenames, (filepath, index) => {
        let filename = fs.filename(filepath);
        let file = files.find((file) => { return(file.filename == filename); });

        if (file !== undefined) {

          return Promise.resolve();

        } else {

          console.log('Removing file', filepath);
          return fs.remove(filepath)
            .then(() => {
              console.log('File removed');
              return Promise.resolve();
            });

        }
      });
    });
}

export function downloadFiles(files, directoryName, options) {
  if (fs.isCordova) {
    return fs.ensure(directoryName)
      .then((dirEntry) => {
        return Promise.each(files, (file, index) => {
          return downloadFile(dirEntry, file);
        })
        .then((files) => {
          return cleanUpFiles(dirEntry, files)
            .then(() => {
              return Promise.resolve(files);
            });
        });
      });
  } else {
    files = files.map((file) => {
      file.localURL = file.url;
      return file;
    });
    return Promise.resolve(files);
  }
}

export default downloadFiles;
