const busboy = require('busboy');
const { PassThrough } = require('stream');

const createUpload = () => {
  return {
    video: (fields) => (req, res, next) => {
      if (typeof busboy !== 'function') {
        console.error('Busboy is not a constructor');
        return next(new Error('Busboy is not a constructor'));
      }

      const busboyInstance = busboy({
        headers: req.headers,
        limits: { 
          fileSize: 1024 * 1024 * 1024, // 1GB limit
          files: 10 // Limit number of files
        },
      });

      req.files = {};
      let fileProcessingComplete = 0;
      let totalFiles = 0;

      busboyInstance.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        
        const allowedFields = Array.isArray(fields) 
          ? fields.map((f) => f.name) 
          : [fields];
          
        if (!allowedFields.includes(fieldname)) {
          file.resume();
          return;
        }

        totalFiles++;

        // For large files, use streaming instead of buffering
        const passThrough = new PassThrough();
        
        const fileData = {
          originalname: filename,
          mimetype: mimeType,
          stream: passThrough,
          size: 0,
        };

        file.on('data', (data) => {
          fileData.size += data.length;
          passThrough.write(data);
        });

        file.on('end', () => {
          passThrough.end();
          fileProcessingComplete++;
          
          if (!req.files[fieldname]) {
            req.files[fieldname] = [];
          }
          req.files[fieldname].push(fileData);
          
          // Check if all files are processed
          if (fileProcessingComplete === totalFiles) {
                       // Validate required files and body
            if (Object.keys(req.files).length === 0) {
              console.warn('No files received in request');
            }
            if (Object.keys(req.body).length === 0) {
              console.warn('No form fields received in request body');
            }
            next();
          }
        });

        file.on('error', (err) => {
          console.error(`Error processing file ${filename}:`, err.message);
          passThrough.destroy(err);
          next(err);
        });
      });

      busboyInstance.on('finish', () => {
        // Only proceed if no files were processed
        if (totalFiles === 0) {
          if (Object.keys(req.body).length === 0) {
            console.warn('No form fields received in request body');
          }
          next();
        }
      });

      busboyInstance.on('error', (err) => {
        console.error('Busboy error:', err.message);
        next(err);
      });

      req.pipe(busboyInstance);
    },

    other: {
      fields: (fields) => (req, res, next) => {
        if (typeof busboy !== 'function') {
          console.error('Busboy is not a constructor');
          return next(new Error('Busboy is not a constructor'));
        }

        const busboyInstance = busboy({
          headers: req.headers,
          limits: { 
            fileSize: 1024 * 1024 * 1024,
            files: 10
          },
        });

        req.files = {};
        req.body = {};
        let fileProcessingComplete = 0;
        let totalFiles = 0;

        // Handle form fields
        busboyInstance.on('field', (fieldname, value) => {
          req.body[fieldname] = value;
        });

        busboyInstance.on('file', (fieldname, file, info) => {
          const { filename, encoding, mimeType } = info;
          
          const allowedFields = fields.map((f) => f.name);
          if (!allowedFields.includes(fieldname)) {
            file.resume();
            return;
          }

          totalFiles++;

          // Use streaming for large files
          const passThrough = new PassThrough();
          
          const fileData = {
            originalname: filename,
            mimetype: mimeType,
            stream: passThrough,
            size: 0,
          };

          file.on('data', (data) => {
            fileData.size += data.length;
            passThrough.write(data);
          });

          file.on('end', () => {
            passThrough.end();
            fileProcessingComplete++;
            
            if (!req.files[fieldname]) {
              req.files[fieldname] = [];
            }
            req.files[fieldname].push(fileData);
       
            if (fileProcessingComplete === totalFiles) {
                           // Validate required files and body
              if (Object.keys(req.files).length === 0) {
                console.warn('No files received in request');
              }
              if (Object.keys(req.body).length === 0) {
                console.warn('No form fields received in request body');
              }
              next();
            }
          });

          file.on('error', (err) => {
            console.error(`Error processing file ${filename}:`, err.message);
            passThrough.destroy(err);
            next(err);
          });
        });

        busboyInstance.on('finish', () => {
          if (totalFiles === 0) {
            if (Object.keys(req.body).length === 0) {
              console.warn('No form fields received in request body');
            }
            next();
          }
        });

        busboyInstance.on('error', (err) => {
          console.error('Busboy error:', err.message);
          next(err);
        });

        req.pipe(busboyInstance);
      },

      single: (fieldname) => (req, res, next) => {
        if (typeof busboy !== 'function') {
          console.error('Busboy is not a constructor');
          return next(new Error('Busboy is not a constructor'));
        }

        const busboyInstance = busboy({
          headers: req.headers,
          limits: { 
            fileSize: 1024 * 1024 * 1024,
            files: 1
          },
        });

        req.file = null;
        req.body = {};
        let fileProcessed = false;

        // Handle form fields
        busboyInstance.on('field', (name, value) => {
          req.body[name] = value;
        });

        busboyInstance.on('file', (name, file, info) => {
          const { filename, encoding, mimeType } = info;
          
          if (name !== fieldname) {
            file.resume();
            return;
          }

          if (fileProcessed) {
            file.resume();
            return;
          }

          fileProcessed = true;

          // Use streaming for large files
          const passThrough = new PassThrough();
          
          const fileData = {
            originalname: filename,
            mimetype: mimeType,
            stream: passThrough,
            size: 0,
          };

          file.on('data', (data) => {
            fileData.size += data.length;
            passThrough.write(data);
          });

          file.on('end', () => {
            passThrough.end();
            req.file = fileData;
          
            // Validate required file and body
            if (!req.file) {
              console.warn('No file received in request');
            }
            if (Object.keys(req.body).length === 0) {
              console.warn('No form fields received in request body');
            }
            next();
          });

          file.on('error', (err) => {
            console.error(`Error processing file ${filename}:`, err.message);
            passThrough.destroy(err);
            next(err);
          });
        });

        busboyInstance.on('finish', () => {
          if (!fileProcessed) {
            if (Object.keys(req.body).length === 0) {
              console.warn('No form fields received in request body');
            }
            next();
          }
        });

        busboyInstance.on('error', (err) => {
          console.error('Busboy error:', err.message);
          next(err);
        });

        req.pipe(busboyInstance);
      },
    },
  };
};

module.exports = createUpload();

