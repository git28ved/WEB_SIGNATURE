const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const Document = require('../models/Document');
const Signature = require('../models/Signature');
const { logActivity } = require('./auditController');

// @desc    Download PDF with embedded signatures
// @route   GET /api/docs/:id/download
// @access  Private
const downloadSignedPDF = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check ownership
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this document',
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Original PDF file not found on server',
      });
    }

    // Load original PDF
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    // Embed a standard font for text signatures
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Get all signed signatures for this document
    const signatures = await Signature.find({
      document: req.params.id,
      status: 'signed',
    });

    for (const sig of signatures) {
      const pageIndex = (sig.page || 1) - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) continue;

      const page = pages[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Convert percentage-based coordinates to absolute PDF coordinates
      // Note: PDF origin is bottom-left, but our UI origin is top-left
      const x = (sig.x / 100) * pageWidth;
      const sigWidth = ((sig.width || 20) / 100) * pageWidth;
      const sigHeight = ((sig.height || 7) / 100) * pageHeight;
      // Flip Y axis: PDF y=0 is at bottom
      const y = pageHeight - (sig.y / 100) * pageHeight - sigHeight;

      if (sig.type === 'text' && sig.signatureData) {
        // Draw text signature
        const fontSize = Math.min(sigHeight * 0.6, 24);
        page.drawText(sig.signatureData, {
          x: x + 4,
          y: y + sigHeight * 0.25,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.3),
          maxWidth: sigWidth - 8,
        });
      } else if (sig.type === 'draw' && sig.signatureData) {
        // Draw image signature
        try {
          // signatureData is a base64 data URL like "data:image/png;base64,..."
          const base64Data = sig.signatureData.split(',')[1];
          if (base64Data) {
            const imageBytes = Buffer.from(base64Data, 'base64');
            const pngImage = await pdfDoc.embedPng(imageBytes);

            page.drawImage(pngImage, {
              x,
              y,
              width: sigWidth,
              height: sigHeight,
            });
          }
        } catch (imgError) {
          console.error('Error embedding signature image:', imgError);
          // Fallback: draw a text placeholder
          page.drawText('[Signature]', {
            x: x + 4,
            y: y + sigHeight * 0.3,
            size: 12,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
      }
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // Log download activity
    await logActivity({
      documentId: document._id,
      userId: req.user._id,
      action: 'document_downloaded',
      details: `Downloaded signed PDF with ${signatures.length} signature(s)`,
      ipAddress: req.ip,
    });

    // Send as downloadable PDF
    const downloadName = `${document.title}_signed.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${downloadName}"`
    );
    res.setHeader('Content-Length', modifiedPdfBytes.length);
    res.send(Buffer.from(modifiedPdfBytes));
  } catch (error) {
    console.error('Download signed PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating signed PDF',
    });
  }
};

module.exports = { downloadSignedPDF };
