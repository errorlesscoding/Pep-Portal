const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extracts plain text from PDF or DOCX file path
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<string>} - Extracted text
 */
const parseResume = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist');
  }

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedData = await pdfParse(dataBuffer);
      return parsedData.text || '';
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } else {
      throw new Error('Unsupported file extension');
    }
  } catch (error) {
    console.error('Error parsing resume document:', error);
    throw new Error(`Failed to parse file text: ${error.message}`);
  }
};

module.exports = { parseResume };
