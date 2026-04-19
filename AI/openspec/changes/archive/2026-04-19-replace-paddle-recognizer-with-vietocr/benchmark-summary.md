# Paddle vs VietOCR Benchmark

| Image | Backend | Device | Detector | Recognizer | OCR Seconds | Confidence | Lines | Boxes | Merchant | Total |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| receipt-clear.png | paddle | cpu | PP-OCRv5_mobile_det | latin_PP-OCRv5_mobile_rec | 5.9991 | 0.4941 | 5 | 5 |  | 201.0 |
| receipt-clear.png | vietocr | cpu | PP-OCRv5_mobile_det | vgg_seq2seq | 16.7124 | 0.2856 | 5 | 5 |  |  |
| receipt-blurry.png | paddle | cpu | PP-OCRv5_mobile_det | latin_PP-OCRv5_mobile_rec | 0.401 | 0.4927 | 1 | 1 |  | 1.0 |
| receipt-blurry.png | vietocr | cpu | PP-OCRv5_mobile_det | vgg_seq2seq | 1.4658 | 0.1933 | 1 | 1 | Partic |  |

## Raw Text Samples

### receipt-clear.png

#### paddle

```text
20
0
20
201
0
```

#### vietocr

```text
E
E
E
T
E
```
### receipt-blurry.png

#### paddle

```text
1 1I|
```

#### vietocr

```text
Partic
```

## Aggregate Summary

```json
{
  "paddle": {
    "ocr_seconds": 3.2001,
    "confidence": 0.4934,
    "line_count": 3.0
  },
  "vietocr": {
    "ocr_seconds": 9.0891,
    "confidence": 0.2394,
    "line_count": 3.0
  }
}
```
