"""
OCR extraction for images and scanned PDFs using Tesseract (via pytesseract).
Kept as a single, simple backend for the starter kit — EasyOCR/PaddleOCR can be
plugged in later behind the same extract_text_from_image(path) signature.
"""
from PIL import Image
import pytesseract


def extract_text_from_image(image_path: str) -> str:
    """OCR a single image file (PNG/JPEG/WEBP/TIFF) and return raw text."""
    img = Image.open(image_path)
    if img.mode != "RGB":
        img = img.convert("RGB")
    text = pytesseract.image_to_string(img)
    return text.strip()


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF: try native text layer first, fall back to OCR per page."""
    import fitz  # PyMuPDF

    doc = fitz.open(pdf_path)
    full_text = []
    for page in doc:
        text = page.get_text().strip()
        if text:
            full_text.append(text)
        else:
            # scanned page with no text layer -> rasterize and OCR
            pix = page.get_pixmap(dpi=200)
            img_path = "/tmp/_ocr_page.png"
            pix.save(img_path)
            full_text.append(extract_text_from_image(img_path))
    return "\n".join(full_text).strip()
