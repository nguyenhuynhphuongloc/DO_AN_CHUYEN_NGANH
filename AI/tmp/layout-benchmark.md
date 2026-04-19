# Layout OCR Benchmark

| Image | Backend | Layout | Device | OCR Seconds | Merchant | Date | Total | Quality | Result |
| --- | --- | --- | --- | ---: | --- | --- | --- | ---: | --- |
| bill.jpg | vietocr | no-layout | cpu | 23.6662 | TOMATHIS ANGON | 2019-03-12 | 1554053.0 | 3.5767 | matched |
| bill.jpg | vietocr | layout-aware | cpu | 4.0899 | TOMATHIS ANGON | 2019-03-12 | 1554053.0 | 3.5767 | matched |

## Detailed JSON

```json
[
  {
    "image": "bill.jpg",
    "backend": "vietocr",
    "profile": "fast",
    "comparison": "matched",
    "cases": {
      "no_layout": {
        "layout_enabled": false,
        "backend": "vietocr",
        "device": "cpu",
        "provider": "paddleocr+vietocr",
        "timings": {
          "ocr_seconds": 23.6662,
          "total_ocr_seconds": 23.6568
        },
        "layout": {
          "enabled": false,
          "used": false,
          "backend": "yolo",
          "raw_detections_count": 0,
          "postprocessed_block_count": 0,
          "debug_image_path": null,
          "fallback_reason": "layout_disabled",
          "runtime": {
            "backend": "yolo",
            "profile": "fast",
            "model_path": null,
            "confidence_threshold": 0.25,
            "iou_threshold": 0.45,
            "layout_seconds": 0.0
          },
          "blocks": []
        },
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
          "recognizer_confidence_semantics": "vietocr_sequence_probability",
          "recognizer_backend_caveats": [
            "vietocr_probability_is_sequence_level",
            "fallback_used_refers_to_recognizer_backend_selection"
          ],
          "recognizer_backend_requested": "vietocr",
          "recognizer_backend_fallback": null,
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
          "detection_seconds": 4.5658,
          "crop_seconds": 0.0053,
          "recognition_seconds": 19.0857,
          "total_ocr_seconds": 23.6568,
          "layout_enabled": false,
          "layout_used": false,
          "layout_backend": "yolo"
        },
        "extraction": {
          "merchant_name": "TOMATHIS ANGON",
          "transaction_date": "2019-03-12",
          "total_amount": 1554053.0,
          "confidence_score": 0.5767,
          "quality_score": 3.5767
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
      "layout": {
        "layout_enabled": true,
        "backend": "vietocr",
        "device": "cpu",
        "provider": "paddleocr+vietocr",
        "timings": {
          "ocr_seconds": 4.0899,
          "total_ocr_seconds": 4.0822
        },
        "layout": {
          "enabled": true,
          "used": false,
          "backend": "yolo",
          "raw_detections_count": 0,
          "postprocessed_block_count": 0,
          "debug_image_path": null,
          "fallback_reason": "missing_model",
          "runtime": {
            "backend": "yolo",
            "profile": "fast",
            "model_path": null,
            "confidence_threshold": 0.25,
            "iou_threshold": 0.45,
            "layout_seconds": 0.0
          },
          "blocks": []
        },
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
          "recognizer_confidence_semantics": "vietocr_sequence_probability",
          "recognizer_backend_caveats": [
            "vietocr_probability_is_sequence_level",
            "fallback_used_refers_to_recognizer_backend_selection"
          ],
          "recognizer_backend_requested": "vietocr",
          "recognizer_backend_fallback": null,
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
          "detection_seconds": 0.2864,
          "crop_seconds": 0.0049,
          "recognition_seconds": 3.7909,
          "total_ocr_seconds": 4.0822,
          "layout_enabled": true,
          "layout_used": false,
          "layout_backend": "yolo"
        },
        "extraction": {
          "merchant_name": "TOMATHIS ANGON",
          "transaction_date": "2019-03-12",
          "total_amount": 1554053.0,
          "confidence_score": 0.5767,
          "quality_score": 3.5767
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
    }
  }
]
```
