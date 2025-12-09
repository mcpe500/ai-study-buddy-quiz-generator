
> test
> vitest run


[1m[46m RUN [49m[22m [36mv3.2.4 [39m[90mD:/Ivan/projects/belajar/ai-study-buddy-quiz-generator[39m

 [32m✓[39m tests/ai-response-parsing.test.ts [2m([22m[2m16 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m tests/database-types.test.ts [2m([22m[2m19 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m tests/integration.test.ts [2m([22m[2m7 tests[22m[2m | [22m[33m1 skipped[39m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m tests/auth.test.ts [2m([22m[2m14 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m tests/trpc-study.test.ts [2m([22m[2m22 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m tests/trpc-auth.test.ts [2m([22m[2m13 tests[22m[2m)[22m[32m 12[2mms[22m[39m
[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould extract text from a PDF base64 string
[22m[39m[AI Provider] Extracting text from base64 data
[AI Provider] MimeType: application/pdf, Base64 length: 24
[AI Provider] Detected PDF document, parsing with pdf-parse...

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould extract text from a PDF base64 string
[22m[39m[AI Provider] Converted to buffer, size: 17 bytes

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould extract text from a PDF base64 string
[22m[39m[AI Provider] PDF parsed successfully!
[AI Provider] Pages: 3
[AI Provider] Extracted text length: 110 chars
[AI Provider] First 500 chars: This is the extracted text from the PDF document. It contains sample educational content for testing purposes....

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould handle PDF mime type with charset
[22m[39m[AI Provider] Extracting text from base64 data
[AI Provider] MimeType: application/pdf; charset=utf-8, Base64 length: 24
[AI Provider] Detected PDF document, parsing with pdf-parse...

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould handle PDF mime type with charset
[22m[39m[AI Provider] Converted to buffer, size: 17 bytes

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould handle PDF mime type with charset
[22m[39m[AI Provider] PDF parsed successfully!
[AI Provider] Pages: 3
[AI Provider] Extracted text length: 110 chars
[AI Provider] First 500 chars: This is the extracted text from the PDF document. It contains sample educational content for testing purposes....

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould truncate very long PDF text
[22m[39m[AI Provider] Extracting text from base64 data
[AI Provider] MimeType: application/pdf, Base64 length: 24
[AI Provider] Detected PDF document, parsing with pdf-parse...

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould truncate very long PDF text
[22m[39m[AI Provider] Converted to buffer, size: 17 bytes

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould truncate very long PDF text
[22m[39m[AI Provider] PDF parsed successfully!
[AI Provider] Pages: 100
[AI Provider] Extracted text length: 60000 chars
[AI Provider] First 500 chars: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...
[AI Provider] Text too long, truncating to 50000 chars

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould throw error when PDF parsing fails
[22m[39m[AI Provider] Extracting text from base64 data
[AI Provider] MimeType: application/pdf, Base64 length: 16
[AI Provider] Detected PDF document, parsing with pdf-parse...

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mPDF extraction (mocked)[2m > [22m[2mshould throw error when PDF parsing fails
[22m[39m[AI Provider] Converted to buffer, size: 11 bytes

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mText file extraction[2m > [22m[2mshould decode base64 text files
[22m[39m[AI Provider] Extracting text from base64 data
[AI Provider] MimeType: text/plain, Base64 length: 52
[AI Provider] Decoded text document, length: 37

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mText file extraction[2m > [22m[2mshould handle text/html mime type
[22m[39m[AI Provider] Extracting text from base64 data
[AI Provider] MimeType: text/html, Base64 length: 52
[AI Provider] Decoded text document, length: 39

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mImage file handling[2m > [22m[2mshould throw error for image files (no OCR support)
[22m[39m[AI Provider] Extracting text from base64 data
[AI Provider] MimeType: image/png, Base64 length: 20
[AI Provider] Detected image document

[90mstdout[2m | tests/pdf-extraction.test.ts[2m > [22m[2mextractTextFromBase64[2m > [22m[2mImage file handling[2m > [22m[2mshould throw error for JPEG images
[22m[39m[AI Provider] Extracting text from base64 data
[AI Provider] MimeType: image/jpeg, Base64 length: 20
[AI Provider] Detected image document

 [31m❯[39m tests/pdf-extraction.test.ts [2m([22m[2m13 tests[22m[2m | [22m[31m3 failed[39m[2m)[22m[32m 236[2mms[22m[39m
   [32m✓[39m extractTextFromBase64[2m > [22mPDF extraction (mocked)[2m > [22mshould extract text from a PDF base64 string[32m 5[2mms[22m[39m
   [32m✓[39m extractTextFromBase64[2m > [22mPDF extraction (mocked)[2m > [22mshould handle PDF mime type with charset[32m 2[2mms[22m[39m
   [32m✓[39m extractTextFromBase64[2m > [22mPDF extraction (mocked)[2m > [22mshould truncate very long PDF text[32m 1[2mms[22m[39m
   [32m✓[39m extractTextFromBase64[2m > [22mPDF extraction (mocked)[2m > [22mshould throw error when PDF parsing fails[32m 10[2mms[22m[39m
   [32m✓[39m extractTextFromBase64[2m > [22mText file extraction[2m > [22mshould decode base64 text files[32m 1[2mms[22m[39m
   [32m✓[39m extractTextFromBase64[2m > [22mText file extraction[2m > [22mshould handle text/html mime type[32m 1[2mms[22m[39m
   [32m✓[39m extractTextFromBase64[2m > [22mImage file handling[2m > [22mshould throw error for image files (no OCR support)[32m 1[2mms[22m[39m
   [32m✓[39m extractTextFromBase64[2m > [22mImage file handling[2m > [22mshould throw error for JPEG images[32m 1[2mms[22m[39m
[31m   [31m×[31m Real PDF Extraction[2m > [22mshould extract text from real PDF file[39m[32m 199[2mms[22m[39m
[31m     → DOMMatrix is not defined[39m
[31m   [31m×[31m Real PDF Extraction[2m > [22mshould have valid PDF structure[39m[32m 6[2mms[22m[39m
[31m     → DOMMatrix is not defined[39m
[31m   [31m×[31m Real PDF Extraction[2m > [22mshould extract meaningful content from Golang bootcamp PDF[39m[32m 7[2mms[22m[39m
[31m     → DOMMatrix is not defined[39m
   [32m✓[39m Real PDF Extraction[2m > [22mshould check mock PDF file exists[32m 1[2mms[22m[39m
   [32m✓[39m Real PDF Extraction[2m > [22mshould convert PDF to valid base64[32m 2[2mms[22m[39m
 [32m✓[39m tests/library-imports.test.ts [2m([22m[2m15 tests[22m[2m)[22m[33m 736[2mms[22m[39m
 [32m✓[39m tests/components/QuizMode.test.tsx [2m([22m[2m15 tests[22m[2m)[22m[33m 863[2mms[22m[39m
 [32m✓[39m tests/components/FlashcardDeck.test.tsx [2m([22m[2m12 tests[22m[2m)[22m[33m 1920[2mms[22m[39m
   [33m[2m✓[22m[39m FlashcardDeck[2m > [22mNavigation[2m > [22mshould advance to next card on next button click [33m 336[2mms[22m[39m
   [33m[2m✓[22m[39m FlashcardDeck[2m > [22mNavigation[2m > [22mshould go to previous card on prev button click [33m 491[2mms[22m[39m
   [33m[2m✓[22m[39m FlashcardDeck[2m > [22mNavigation[2m > [22mshould wrap around to first card after last [33m 703[2mms[22m[39m

[2m Test Files [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m9 passed[39m[22m[90m (10)[39m
[2m      Tests [22m [1m[31m3 failed[39m[22m[2m | [22m[1m[32m142 passed[39m[22m[2m | [22m[33m1 skipped[39m[90m (146)[39m
[2m   Start at [22m 16:54:02
[2m   Duration [22m 4.61s[2m (transform 386ms, setup 1.84s, collect 1.60s, tests 3.81s, environment 15.96s, prepare 1.97s)[22m

