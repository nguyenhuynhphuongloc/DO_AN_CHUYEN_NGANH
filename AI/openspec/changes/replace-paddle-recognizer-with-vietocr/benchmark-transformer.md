# Paddle vs VietOCR Benchmark

| Image | Backend | Device | Detector | Recognizer | OCR Seconds | Confidence | Lines | Boxes | Merchant | Total |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| bill.jpg | paddle | cpu | PP-OCRv5_mobile_det | latin_PP-OCRv5_mobile_rec | 11.2075 | 0.9098 | 45 | 45 | TOMATITO SAIGON | 1554053.0 |
| bill.jpg | vietocr | cpu | PP-OCRv5_mobile_det | vgg_transformer | 21.1261 | 0.8414 | 45 | 45 | TOMATITO SAIGON | 1554053.0 |

## Raw Text Samples

### bill.jpg

#### paddle

```text
TOMATITO SAIGON
171 Calantte, 0.1, HCM
TABLE:1140
Serv: Ah Duy
12/09/2019 09:22:15 PM
10ust:4
Quan Desoription
Cost
122223
Alba Sparkling
204
60,000
Sangria Glass
190.000
13. El nido
120,000
15. Salmon TNT
180.000
16.Mi Causa
135.000
17.Montadito de ganbas
135.000
27.Tortilla de patatas
105.000
40. Albsndigas
180,000
41. Angus Australiano
290.000
50. Crema de limsn
100,000
Discount 10%
( 149,500
eExe
Net Total:
1.345,500
SVC:
67.275
VAT:
141,278
M
TOTAL :
1,554,053
THANKS FOR COMING
AMIGOS ! !
<-REPRINTED->
```

#### vietocr

```text
TOMATITO SAIGON
Monomen
TABLE 1040
Servi Kh Duy
12/02/2019 06:22:15 FM
Musted
Quan Description
Cost
mazzers
Alta Sparkling
1
60,000
Sanoria Glass
180.000
13.E1 nio
120.000
15, Salmon INT
180.000
16.M1 Causa
135.000
17.Montadito de carbas
135,000
27.10rtilla de patatas
105,000
40, Albsndioas
180,000
A1C Angus Australiano
290.000
50, Crema de limsn
100.000
Discount 105
149,500
sease
Net Total:
L.345,500
svc:
67.275
VAT:
141.278
382
TOTAL:
1.554.053
THANKS FOR COMING
AMIGOS 11
S-REPRINTED-S
```

## Aggregate Summary

```json
{
  "paddle": {
    "ocr_seconds": 11.2075,
    "confidence": 0.9098,
    "line_count": 45.0
  },
  "vietocr": {
    "ocr_seconds": 21.1261,
    "confidence": 0.8414,
    "line_count": 45.0
  }
}
```
