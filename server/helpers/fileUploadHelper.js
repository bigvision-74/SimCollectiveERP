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
          console.log(`Skipping file for field ${fieldname}: not in allowed fields ${allowedFields}`);
          file.resume();
          return;
        }

        totalFiles++;
        console.log(`Processing file ${filename} for field ${fieldname}, MIME: ${mimeType}`);

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
          console.log(`Received ${data.length} bytes for ${filename}, total size: ${fileData.size}`);
          passThrough.write(data);
        });

        file.on('end', () => {
          passThrough.end();
          fileProcessingComplete++;
          
          if (!req.files[fieldname]) {
            req.files[fieldname] = [];
          }
          req.files[fieldname].push(fileData);
          console.log(`Completed processing file ${filename} for field ${fieldname}`);
          
          // Check if all files are processed
          if (fileProcessingComplete === totalFiles) {
            console.log('All files processed:', {
              files: Object.keys(req.files).map((key) => ({
                field: key,
                count: req.files[key].length,
                details: req.files[key].map((f) => ({
                  name: f.originalname,
                  size: f.size,
                  mimetype: f.mimetype,
                })),
              })),
              body: req.body,
            });
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
          console.log('No files uploaded, proceeding with body:', req.body);
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

      console.log('Starting file upload processing for video middleware');
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
          console.log(`Received form field ${fieldname}: ${value}`);
        });

        busboyInstance.on('file', (fieldname, file, info) => {
          const { filename, encoding, mimeType } = info;
          
          const allowedFields = fields.map((f) => f.name);
          if (!allowedFields.includes(fieldname)) {
            console.log(`Skipping file for field ${fieldname}: not in allowed fields ${allowedFields}`);
            file.resume();
            return;
          }

          totalFiles++;
          console.log(`Processing file ${filename} for field ${fieldname}, MIME: ${mimeType}`);

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
            console.log(`Received ${data.length} bytes for ${filename}, total size: ${fileData.size}`);
            passThrough.write(data);
          });

          file.on('end', () => {
            passThrough.end();
            fileProcessingComplete++;
            
            if (!req.files[fieldname]) {
              req.files[fieldname] = [];
            }
            req.files[fieldname].push(fileData);
            console.log(`Completed processing file ${filename} for field ${fieldname}`);
            
            if (fileProcessingComplete === totalFiles) {
              console.log('All files and fields processed:', {
                files: Object.keys(req.files).map((key) => ({
                  field: key,
                  count: req.files[key].length,
                  details: req.files[key].map((f) => ({
                    name: f.originalname,
                    size: f.size,
                    mimetype: f.mimetype,
                  })),
                })),
                body: req.body,
              });
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
            console.log('No files uploaded, proceeding with body:', req.body);
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

        console.log('Starting file and field processing for fields middleware');
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
          console.log(`Received form field ${name}: ${value}`);
        });

        busboyInstance.on('file', (name, file, info) => {
          const { filename, encoding, mimeType } = info;
          
          if (name !== fieldname) {
            console.log(`Skipping file for field ${name}: expected field ${fieldname}`);
            file.resume();
            return;
          }

          if (fileProcessed) {
            console.log(`Skipping additional file ${filename}: only one file allowed`);
            file.resume();
            return;
          }

          fileProcessed = true;
          console.log(`Processing file ${filename} for field ${name}, MIME: ${mimeType}`);

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
            console.log(`Received ${data.length} bytes for ${filename}, total size: ${fileData.size}`);
            passThrough.write(data);
          });

          file.on('end', () => {
            passThrough.end();
            req.file = fileData;
            console.log('File processing complete:', {
              file: {
                name: fileData.originalname,
                size: fileData.size,
                mimetype: fileData.mimetype,
              },
              body: req.body,
            });
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
            console.log('No file uploaded, proceeding with body:', req.body);
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

        console.log(`Starting file processing for single middleware, field: ${fieldname}`);
        req.pipe(busboyInstance);
      },
    },
  };
};

module.exports = createUpload();



// const multer = require('multer');
// const path = require('path');

// const diskStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const fileFilter = (req, file, cb) => {
//   cb(null, true);
// };

// const createUpload = () => {
//   return {
//     video: multer({
//       storage: multer.memoryStorage(),
//       limits: { fileSize: 1024 * 1024 * 1024 },
//       fileFilter,
//     }),
//     other: multer({
//       storage: multer.memoryStorage(),
//       limits: { fileSize: 1024 * 1024 * 1024 },
//       fileFilter,
//     }),
//   };
// };

// module.exports = createUpload();

