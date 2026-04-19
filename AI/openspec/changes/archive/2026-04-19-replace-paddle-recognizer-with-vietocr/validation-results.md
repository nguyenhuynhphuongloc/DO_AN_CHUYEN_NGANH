# OCR Contract Validation

| Backend | Device | Provider | Lines | Boxes | Issues | Merchant | Total | Date |
| --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| paddle | cpu | paddleocr | 45 | 45 | none | TOMATITO SAIGON | 1554053.0 | 2019-09-12 |
| vietocr | cpu | paddleocr+vietocr | 45 | 45 | none | TOMATHIS ANGON | 1554053.0 | 2019-03-12 |

```json
[
  {
    "backend": "paddle",
    "issues": [],
    "provider": "paddleocr",
    "device": "cpu",
    "line_count": 45,
    "detected_box_count": 45,
    "runtime": {
      "requested_device": "auto",
      "compiled_with_cuda": false,
      "cuda_device_count": 0,
      "cuda_visible_devices": null,
      "nvidia_visible_devices": null,
      "nvidia_driver_capabilities": null,
      "actual_device": "cpu",
      "detector_backend": "paddle",
      "detector_device": "cpu",
      "text_detection_model_name": "PP-OCRv5_mobile_det",
      "text_det_limit_side_len": 1536,
      "recognizer_backend": "paddle",
      "recognizer_device": "cpu",
      "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
      "recognizer_backend_requested": "paddle",
      "recognizer_backend_fallback": null,
      "recognizer_confidence_semantics": "paddle_rec_score",
      "recognizer_backend_caveats": [
        "fallback_used_refers_to_recognizer_backend_selection"
      ],
      "row_grouping": {
        "row_grouping_tolerance": 0.65,
        "row_tolerance_pixels": 22.1,
        "row_count": 28,
        "row_lengths": [
          1,
          1,
          1,
          1,
          2,
          3,
          1,
          1,
          1,
          2,
          2,
          2,
          2,
          2,
          2,
          2,
          2,
          2,
          2,
          1,
          2,
          2,
          2,
          1,
          2,
          1,
          1,
          1
        ],
        "ordered_box_indices": [
          44,
          43,
          42,
          41,
          40,
          39,
          37,
          36,
          38,
          34,
          35,
          33,
          32,
          31,
          30,
          29,
          28,
          27,
          26,
          25,
          23,
          24,
          21,
          22,
          19,
          20,
          17,
          18,
          15,
          16,
          13,
          14,
          12,
          10,
          11,
          9,
          8,
          6,
          7,
          5,
          3,
          4,
          2,
          1,
          0
        ]
      },
      "detected_box_count": 45,
      "line_count": 45,
      "detection_seconds": 3.3277,
      "crop_seconds": 0.0064,
      "recognition_seconds": 2.4808,
      "total_ocr_seconds": 5.8149
    },
    "engine_config": {
      "profile": "fast",
      "language": "vi",
      "device": "cpu",
      "detector_backend": "paddle",
      "recognizer_backend": "paddle",
      "text_detection_model_name": "PP-OCRv5_mobile_det",
      "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
      "row_grouping_tolerance": 0.65,
      "recognizer_confidence_semantics": "paddle_rec_score"
    },
    "extraction": {
      "merchant_name": "TOMATITO SAIGON",
      "total_amount": 1554053.0,
      "transaction_date": "2019-09-12"
    },
    "preprocess": {
      "scale": 2.6627,
      "resized_from": [
        338,
        450
      ],
      "resized_to": [
        900,
        1198
      ],
      "input_size": [
        338,
        450
      ],
      "profile": "fast",
      "deskew_angle": 0.0,
      "rotated_90": false,
      "pipeline": [
        "resize",
        "grayscale",
        "normalize",
        "denoise-light",
        "orientation-check"
      ],
      "output_size": [
        900,
        1198
      ]
    }
  },
  {
    "backend": "vietocr",
    "issues": [],
    "provider": "paddleocr+vietocr",
    "device": "cpu",
    "line_count": 45,
    "detected_box_count": 45,
    "runtime": {
      "requested_device": "auto",
      "compiled_with_cuda": false,
      "cuda_device_count": 0,
      "cuda_visible_devices": null,
      "nvidia_visible_devices": null,
      "nvidia_driver_capabilities": null,
      "actual_device": "cpu",
      "detector_backend": "paddle",
      "detector_device": "cpu",
      "text_detection_model_name": "PP-OCRv5_mobile_det",
      "text_det_limit_side_len": 1536,
      "torch_available": true,
      "torch_cuda_available": false,
      "torch_cuda_device_count": 0,
      "recognizer_backend": "vietocr",
      "recognizer_device": "cpu",
      "text_recognition_model_name": "vgg_seq2seq",
      "recognizer_backend_requested": "vietocr",
      "recognizer_backend_fallback": null,
      "recognizer_confidence_semantics": "vietocr_sequence_probability",
      "recognizer_backend_caveats": [
        "vietocr_probability_is_sequence_level",
        "fallback_used_refers_to_recognizer_backend_selection"
      ],
      "row_grouping": {
        "row_grouping_tolerance": 0.65,
        "row_tolerance_pixels": 22.1,
        "row_count": 28,
        "row_lengths": [
          1,
          1,
          1,
          1,
          2,
          3,
          1,
          1,
          1,
          2,
          2,
          2,
          2,
          2,
          2,
          2,
          2,
          2,
          2,
          1,
          2,
          2,
          2,
          1,
          2,
          1,
          1,
          1
        ],
        "ordered_box_indices": [
          44,
          43,
          42,
          41,
          40,
          39,
          37,
          36,
          38,
          34,
          35,
          33,
          32,
          31,
          30,
          29,
          28,
          27,
          26,
          25,
          23,
          24,
          21,
          22,
          19,
          20,
          17,
          18,
          15,
          16,
          13,
          14,
          12,
          10,
          11,
          9,
          8,
          6,
          7,
          5,
          3,
          4,
          2,
          1,
          0
        ]
      },
      "detected_box_count": 45,
      "line_count": 45,
      "detection_seconds": 0.2166,
      "crop_seconds": 0.0053,
      "recognition_seconds": 13.4188,
      "total_ocr_seconds": 13.6407
    },
    "engine_config": {
      "profile": "fast",
      "language": "vi",
      "device": "cpu",
      "detector_backend": "paddle",
      "recognizer_backend": "vietocr",
      "text_detection_model_name": "PP-OCRv5_mobile_det",
      "text_recognition_model_name": "vgg_seq2seq",
      "row_grouping_tolerance": 0.65,
      "recognizer_confidence_semantics": "vietocr_sequence_probability"
    },
    "extraction": {
      "merchant_name": "TOMATHIS ANGON",
      "total_amount": 1554053.0,
      "transaction_date": "2019-03-12"
    },
    "preprocess": {
      "scale": 2.6627,
      "resized_from": [
        338,
        450
      ],
      "resized_to": [
        900,
        1198
      ],
      "input_size": [
        338,
        450
      ],
      "profile": "fast",
      "deskew_angle": 0.0,
      "rotated_90": false,
      "pipeline": [
        "resize",
        "grayscale",
        "normalize",
        "denoise-light",
        "orientation-check"
      ],
      "output_size": [
        900,
        1198
      ]
    }
  }
]
```
