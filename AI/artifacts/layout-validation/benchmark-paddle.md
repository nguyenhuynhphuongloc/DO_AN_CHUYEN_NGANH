# Layout OCR Benchmark

| Image | Backend | Layout | Device | OCR Seconds | Merchant | Date | Total | Quality | Result |
| --- | --- | --- | --- | ---: | --- | --- | --- | ---: | --- |
| bill.jpg | paddle | no-layout | cpu | 9.7478 | TOMATITO SAIGON | 2019-09-12 | 1554053.0 | 3.5767 | matched |
| bill.jpg | paddle | layout-aware | cpu | 2.8766 | TOMATITO SAIGON | 2019-09-12 | 1554053.0 | 3.5767 | matched |
| 1dac8c84-5d11-450e-851b-051f422a1e51.jpg | paddle | no-layout | cpu | 1.9843 | Hej - Trn K Xương | 2026-03-28 | 77000.0 | 3.506 | matched |
| 1dac8c84-5d11-450e-851b-051f422a1e51.jpg | paddle | layout-aware | cpu | 2.0516 | Hej - Trn K Xương | 2026-03-28 | 77000.0 | 3.506 | matched |
| 643675b3-e16b-4a49-93ea-39ff9b00b120.jpg | paddle | no-layout | cpu | 2.3458 | FamilyMart | 2026-04-12 | 63000.0 | 3.584 | matched |
| 643675b3-e16b-4a49-93ea-39ff9b00b120.jpg | paddle | layout-aware | cpu | 4.3001 | FamilyMart | 2026-04-12 | 63000.0 | 3.584 | matched |

## Detailed JSON

```json
[
  {
    "image": "bill.jpg",
    "backend": "paddle",
    "profile": "fast",
    "comparison": "matched",
    "field_comparisons": {
      "merchant_name": "matched",
      "transaction_date": "matched",
      "total_amount": "matched"
    },
    "cases": {
      "no_layout": {
        "layout_enabled": false,
        "backend": "paddle",
        "device": "cpu",
        "provider": "paddleocr",
        "timings": {
          "ocr_seconds": 9.7478,
          "total_ocr_seconds": 9.7359
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
            "model_loaded": false,
            "model_source": null,
            "device": null,
            "auto_download_enabled": true,
            "download_url": "https://huggingface.co/Armaggheddon/yolo11-document-layout/resolve/main/yolo11n_doc_layout.pt",
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
          "recognizer_backend": "paddle",
          "recognizer_device": "cpu",
          "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
          "recognizer_confidence_semantics": "paddle_rec_score",
          "recognizer_backend_caveats": [
            "fallback_used_refers_to_recognizer_backend_selection"
          ],
          "recognizer_backend_requested": "paddle",
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
          "detection_seconds": 5.0404,
          "crop_seconds": 0.0058,
          "recognition_seconds": 4.6897,
          "total_ocr_seconds": 9.7359,
          "layout_enabled": false,
          "layout_used": false,
          "layout_backend": "yolo"
        },
        "extraction": {
          "merchant_name": "TOMATITO SAIGON",
          "transaction_date": "2019-09-12",
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
        "backend": "paddle",
        "device": "cpu",
        "provider": "paddleocr",
        "timings": {
          "ocr_seconds": 2.8766,
          "total_ocr_seconds": 2.3617
        },
        "layout": {
          "enabled": true,
          "used": false,
          "backend": "yolo",
          "raw_detections_count": 1,
          "postprocessed_block_count": 1,
          "debug_image_path": "/tmp/layout_debug_bill-fast.jpg",
          "fallback_reason": "too_few_layout_blocks",
          "runtime": {
            "backend": "yolo",
            "profile": "fast",
            "model_path": "/models/receipt_layout.pt",
            "model_loaded": true,
            "model_source": "local",
            "device": "cpu",
            "auto_download_enabled": true,
            "download_url": "https://huggingface.co/Armaggheddon/yolo11-document-layout/resolve/main/yolo11n_doc_layout.pt",
            "confidence_threshold": 0.25,
            "iou_threshold": 0.45,
            "layout_seconds": 0.3771,
            "raw_detection_count": 1,
            "postprocess": {
              "confidence_threshold": 0.25,
              "iou_threshold": 0.45,
              "min_block_area_ratio": 0.0025,
              "merge_same_label_gap_pixels": 24,
              "max_blocks": 20,
              "raw_detection_count": 1,
              "filtered_count": 1,
              "suppressed_count": 1,
              "merged_count": 0,
              "final_count": 1,
              "skipped_low_confidence": 0,
              "skipped_small_blocks": 0,
              "skipped_overlap": 0,
              "capped_count": 0
            },
            "debug_image_path": "/tmp/layout_debug_bill-fast.jpg"
          },
          "blocks": [
            {
              "index": 0,
              "label": "header",
              "raw_label": "Table",
              "confidence": 0.5146,
              "bbox": [
                179,
                55,
                677,
                940
              ],
              "area_ratio": 0.408765,
              "unknown_label": false,
              "semantic_source": "anchor_topmost"
            }
          ]
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
          "recognizer_backend": "paddle",
          "recognizer_device": "cpu",
          "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
          "recognizer_confidence_semantics": "paddle_rec_score",
          "recognizer_backend_caveats": [
            "fallback_used_refers_to_recognizer_backend_selection"
          ],
          "recognizer_backend_requested": "paddle",
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
          "detection_seconds": 0.3706,
          "crop_seconds": 0.0073,
          "recognition_seconds": 1.9838,
          "total_ocr_seconds": 2.3617,
          "layout_enabled": true,
          "layout_used": false,
          "layout_backend": "yolo"
        },
        "extraction": {
          "merchant_name": "TOMATITO SAIGON",
          "transaction_date": "2019-09-12",
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
  },
  {
    "image": "1dac8c84-5d11-450e-851b-051f422a1e51.jpg",
    "backend": "paddle",
    "profile": "fast",
    "comparison": "matched",
    "field_comparisons": {
      "merchant_name": "matched",
      "transaction_date": "matched",
      "total_amount": "matched"
    },
    "cases": {
      "no_layout": {
        "layout_enabled": false,
        "backend": "paddle",
        "device": "cpu",
        "provider": "paddleocr",
        "timings": {
          "ocr_seconds": 1.9843,
          "total_ocr_seconds": 1.9579
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
            "model_loaded": false,
            "model_source": null,
            "device": null,
            "auto_download_enabled": true,
            "download_url": "https://huggingface.co/Armaggheddon/yolo11-document-layout/resolve/main/yolo11n_doc_layout.pt",
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
          "recognizer_backend": "paddle",
          "recognizer_device": "cpu",
          "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
          "recognizer_confidence_semantics": "paddle_rec_score",
          "recognizer_backend_caveats": [
            "fallback_used_refers_to_recognizer_backend_selection"
          ],
          "recognizer_backend_requested": "paddle",
          "recognizer_backend_fallback": null,
          "row_grouping": {
            "row_grouping_tolerance": 0.65,
            "row_tolerance_pixels": 47.12,
            "row_count": 18,
            "row_lengths": [
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              4,
              3,
              4,
              1,
              4,
              1,
              2,
              2,
              2,
              1,
              1
            ],
            "ordered_box_indices": [
              31,
              30,
              29,
              28,
              27,
              26,
              25,
              23,
              22,
              24,
              21,
              20,
              18,
              19,
              17,
              14,
              15,
              16,
              13,
              12,
              9,
              10,
              11,
              8,
              6,
              7,
              4,
              5,
              2,
              3,
              1,
              0
            ]
          },
          "detected_box_count": 32,
          "line_count": 32,
          "detection_seconds": 0.4302,
          "crop_seconds": 0.016,
          "recognition_seconds": 1.5117,
          "total_ocr_seconds": 1.9579,
          "layout_enabled": false,
          "layout_used": false,
          "layout_backend": "yolo"
        },
        "extraction": {
          "merchant_name": "Hej - Trn K Xương",
          "transaction_date": "2026-03-28",
          "total_amount": 77000.0,
          "confidence_score": 0.506,
          "quality_score": 3.506
        },
        "preprocess": {
          "scale": 1.0,
          "resized_from": [
            1536,
            2048
          ],
          "resized_to": [
            1536,
            2048
          ],
          "input_size": [
            1536,
            2048
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
            1536,
            2048
          ]
        }
      },
      "layout": {
        "layout_enabled": true,
        "backend": "paddle",
        "device": "cpu",
        "provider": "paddleocr",
        "timings": {
          "ocr_seconds": 2.0516,
          "total_ocr_seconds": 1.7071
        },
        "layout": {
          "enabled": true,
          "used": false,
          "backend": "yolo",
          "raw_detections_count": 1,
          "postprocessed_block_count": 1,
          "debug_image_path": "/tmp/layout_debug_1dac8c84-5d11-450e-851b-051f422a1e51-fast.jpg",
          "fallback_reason": "too_few_layout_blocks",
          "runtime": {
            "backend": "yolo",
            "profile": "fast",
            "model_path": "/models/receipt_layout.pt",
            "model_loaded": true,
            "model_source": "local",
            "device": "cpu",
            "auto_download_enabled": true,
            "download_url": "https://huggingface.co/Armaggheddon/yolo11-document-layout/resolve/main/yolo11n_doc_layout.pt",
            "confidence_threshold": 0.25,
            "iou_threshold": 0.45,
            "layout_seconds": 0.2059,
            "raw_detection_count": 1,
            "postprocess": {
              "confidence_threshold": 0.25,
              "iou_threshold": 0.45,
              "min_block_area_ratio": 0.0025,
              "merge_same_label_gap_pixels": 24,
              "max_blocks": 20,
              "raw_detection_count": 1,
              "filtered_count": 1,
              "suppressed_count": 1,
              "merged_count": 0,
              "final_count": 1,
              "skipped_low_confidence": 0,
              "skipped_small_blocks": 0,
              "skipped_overlap": 0,
              "capped_count": 0
            },
            "debug_image_path": "/tmp/layout_debug_1dac8c84-5d11-450e-851b-051f422a1e51-fast.jpg"
          },
          "blocks": [
            {
              "index": 0,
              "label": "header",
              "raw_label": "Text",
              "confidence": 0.2833,
              "bbox": [
                357,
                197,
                1095,
                456
              ],
              "area_ratio": 0.060762,
              "unknown_label": false,
              "semantic_source": "geometry_top_band"
            }
          ]
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
          "recognizer_backend": "paddle",
          "recognizer_device": "cpu",
          "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
          "recognizer_confidence_semantics": "paddle_rec_score",
          "recognizer_backend_caveats": [
            "fallback_used_refers_to_recognizer_backend_selection"
          ],
          "recognizer_backend_requested": "paddle",
          "recognizer_backend_fallback": null,
          "row_grouping": {
            "row_grouping_tolerance": 0.65,
            "row_tolerance_pixels": 47.12,
            "row_count": 18,
            "row_lengths": [
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              4,
              3,
              4,
              1,
              4,
              1,
              2,
              2,
              2,
              1,
              1
            ],
            "ordered_box_indices": [
              31,
              30,
              29,
              28,
              27,
              26,
              25,
              23,
              22,
              24,
              21,
              20,
              18,
              19,
              17,
              14,
              15,
              16,
              13,
              12,
              9,
              10,
              11,
              8,
              6,
              7,
              4,
              5,
              2,
              3,
              1,
              0
            ]
          },
          "detected_box_count": 32,
          "line_count": 32,
          "detection_seconds": 0.3379,
          "crop_seconds": 0.0131,
          "recognition_seconds": 1.3561,
          "total_ocr_seconds": 1.7071,
          "layout_enabled": true,
          "layout_used": false,
          "layout_backend": "yolo"
        },
        "extraction": {
          "merchant_name": "Hej - Trn K Xương",
          "transaction_date": "2026-03-28",
          "total_amount": 77000.0,
          "confidence_score": 0.506,
          "quality_score": 3.506
        },
        "preprocess": {
          "scale": 1.0,
          "resized_from": [
            1536,
            2048
          ],
          "resized_to": [
            1536,
            2048
          ],
          "input_size": [
            1536,
            2048
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
            1536,
            2048
          ]
        }
      }
    }
  },
  {
    "image": "643675b3-e16b-4a49-93ea-39ff9b00b120.jpg",
    "backend": "paddle",
    "profile": "fast",
    "comparison": "matched",
    "field_comparisons": {
      "merchant_name": "matched",
      "transaction_date": "matched",
      "total_amount": "matched"
    },
    "cases": {
      "no_layout": {
        "layout_enabled": false,
        "backend": "paddle",
        "device": "cpu",
        "provider": "paddleocr",
        "timings": {
          "ocr_seconds": 2.3458,
          "total_ocr_seconds": 2.322
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
            "model_loaded": false,
            "model_source": null,
            "device": null,
            "auto_download_enabled": true,
            "download_url": "https://huggingface.co/Armaggheddon/yolo11-document-layout/resolve/main/yolo11n_doc_layout.pt",
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
          "recognizer_backend": "paddle",
          "recognizer_device": "cpu",
          "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
          "recognizer_confidence_semantics": "paddle_rec_score",
          "recognizer_backend_caveats": [
            "fallback_used_refers_to_recognizer_backend_selection"
          ],
          "recognizer_backend_requested": "paddle",
          "recognizer_backend_fallback": null,
          "row_grouping": {
            "row_grouping_tolerance": 0.65,
            "row_tolerance_pixels": 31.53,
            "row_count": 22,
            "row_lengths": [
              1,
              1,
              1,
              1,
              1,
              1,
              2,
              4,
              4,
              3,
              3,
              1,
              1,
              1,
              1,
              2,
              1,
              1,
              1,
              3,
              1,
              1
            ],
            "ordered_box_indices": [
              35,
              34,
              33,
              32,
              31,
              30,
              28,
              29,
              24,
              25,
              26,
              27,
              20,
              21,
              22,
              23,
              17,
              19,
              18,
              14,
              15,
              16,
              13,
              12,
              11,
              10,
              8,
              9,
              7,
              6,
              5,
              2,
              4,
              3,
              1,
              0
            ]
          },
          "detected_box_count": 36,
          "line_count": 35,
          "detection_seconds": 0.3246,
          "crop_seconds": 0.0116,
          "recognition_seconds": 1.9858,
          "total_ocr_seconds": 2.322,
          "layout_enabled": false,
          "layout_used": false,
          "layout_backend": "yolo"
        },
        "extraction": {
          "merchant_name": "FamilyMart",
          "transaction_date": "2026-04-12",
          "total_amount": 63000.0,
          "confidence_score": 0.584,
          "quality_score": 3.584
        },
        "preprocess": {
          "scale": 1.0,
          "resized_from": [
            1536,
            2048
          ],
          "resized_to": [
            1536,
            2048
          ],
          "input_size": [
            1536,
            2048
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
            1536,
            2048
          ]
        }
      },
      "layout": {
        "layout_enabled": true,
        "backend": "paddle",
        "device": "cpu",
        "provider": "paddleocr",
        "timings": {
          "ocr_seconds": 4.3001,
          "total_ocr_seconds": 4.1527
        },
        "layout": {
          "enabled": true,
          "used": true,
          "backend": "yolo",
          "raw_detections_count": 11,
          "postprocessed_block_count": 9,
          "debug_image_path": "/tmp/layout_debug_643675b3-e16b-4a49-93ea-39ff9b00b120-fast.jpg",
          "fallback_reason": null,
          "runtime": {
            "backend": "yolo",
            "profile": "fast",
            "model_path": "/models/receipt_layout.pt",
            "model_loaded": true,
            "model_source": "local",
            "device": "cpu",
            "auto_download_enabled": true,
            "download_url": "https://huggingface.co/Armaggheddon/yolo11-document-layout/resolve/main/yolo11n_doc_layout.pt",
            "confidence_threshold": 0.25,
            "iou_threshold": 0.45,
            "layout_seconds": 0.2339,
            "raw_detection_count": 11,
            "postprocess": {
              "confidence_threshold": 0.25,
              "iou_threshold": 0.45,
              "min_block_area_ratio": 0.0025,
              "merge_same_label_gap_pixels": 24,
              "max_blocks": 20,
              "raw_detection_count": 11,
              "filtered_count": 9,
              "suppressed_count": 9,
              "merged_count": 0,
              "final_count": 9,
              "skipped_low_confidence": 0,
              "skipped_small_blocks": 2,
              "skipped_overlap": 0,
              "capped_count": 0
            },
            "debug_image_path": "/tmp/layout_debug_643675b3-e16b-4a49-93ea-39ff9b00b120-fast.jpg"
          },
          "blocks": [
            {
              "index": 1,
              "label": "header",
              "raw_label": "Picture",
              "confidence": 0.2558,
              "bbox": [
                559,
                407,
                985,
                491
              ],
              "area_ratio": 0.011375,
              "unknown_label": false,
              "semantic_source": "anchor_topmost"
            },
            {
              "index": 2,
              "label": "metadata",
              "raw_label": "Text",
              "confidence": 0.5334,
              "bbox": [
                363,
                514,
                1054,
                595
              ],
              "area_ratio": 0.017793,
              "unknown_label": false,
              "semantic_source": "geometry_default_metadata"
            },
            {
              "index": 3,
              "label": "metadata",
              "raw_label": "Text",
              "confidence": 0.3493,
              "bbox": [
                349,
                607,
                1063,
                699
              ],
              "area_ratio": 0.020882,
              "unknown_label": false,
              "semantic_source": "geometry_default_metadata"
            },
            {
              "index": 0,
              "label": "items",
              "raw_label": "Table",
              "confidence": 0.2787,
              "bbox": [
                340,
                774,
                1080,
                1284
              ],
              "area_ratio": 0.119972,
              "unknown_label": false,
              "semantic_source": "alias"
            },
            {
              "index": 4,
              "label": "metadata",
              "raw_label": "Text",
              "confidence": 0.2633,
              "bbox": [
                350,
                1293,
                1080,
                1313
              ],
              "area_ratio": 0.004641,
              "unknown_label": false,
              "semantic_source": "geometry_default_metadata"
            },
            {
              "index": 5,
              "label": "metadata",
              "raw_label": "Text",
              "confidence": 0.6331,
              "bbox": [
                354,
                1315,
                834,
                1457
              ],
              "area_ratio": 0.021667,
              "unknown_label": false,
              "semantic_source": "geometry_default_metadata"
            },
            {
              "index": 6,
              "label": "metadata",
              "raw_label": "Picture",
              "confidence": 0.632,
              "bbox": [
                878,
                1361,
                1065,
                1547
              ],
              "area_ratio": 0.011057,
              "unknown_label": false,
              "semantic_source": "alias"
            },
            {
              "index": 7,
              "label": "metadata",
              "raw_label": "Text",
              "confidence": 0.7966,
              "bbox": [
                357,
                1469,
                853,
                1602
              ],
              "area_ratio": 0.020971,
              "unknown_label": false,
              "semantic_source": "geometry_default_metadata"
            },
            {
              "index": 8,
              "label": "totals",
              "raw_label": "Picture",
              "confidence": 0.6706,
              "bbox": [
                382,
                1604,
                1060,
                1711
              ],
              "area_ratio": 0.023062,
              "unknown_label": false,
              "semantic_source": "anchor_lower_summary"
            }
          ]
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
          "recognizer_backend": "paddle",
          "recognizer_device": "cpu",
          "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
          "recognizer_confidence_semantics": "paddle_rec_score",
          "recognizer_backend_caveats": [
            "fallback_used_refers_to_recognizer_backend_selection"
          ],
          "recognizer_backend_requested": "paddle",
          "recognizer_backend_fallback": null,
          "row_grouping": {
            "layout_block_order": [
              {
                "layout_block_index": 0,
                "label": "header",
                "raw_label": "Picture",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 52.65,
                  "row_count": 1,
                  "row_lengths": [
                    1
                  ]
                },
                "ordered_box_indices": [
                  0
                ]
              },
              {
                "layout_block_index": 1,
                "label": "metadata",
                "raw_label": "Text",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 23.07,
                  "row_count": 2,
                  "row_lengths": [
                    1,
                    1
                  ]
                },
                "ordered_box_indices": [
                  1,
                  0
                ]
              },
              {
                "layout_block_index": 2,
                "label": "metadata",
                "raw_label": "Text",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 23.07,
                  "row_count": 2,
                  "row_lengths": [
                    1,
                    1
                  ]
                },
                "ordered_box_indices": [
                  1,
                  0
                ]
              },
              {
                "layout_block_index": 3,
                "label": "items",
                "raw_label": "Table",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 21.45,
                  "row_count": 10,
                  "row_lengths": [
                    2,
                    4,
                    4,
                    6,
                    1,
                    4,
                    2,
                    1,
                    1,
                    1
                  ]
                },
                "ordered_box_indices": [
                  24,
                  25,
                  20,
                  22,
                  21,
                  23,
                  16,
                  17,
                  18,
                  19,
                  14,
                  15,
                  10,
                  11,
                  13,
                  12,
                  9,
                  5,
                  7,
                  6,
                  8,
                  3,
                  4,
                  2,
                  1,
                  0
                ]
              },
              {
                "layout_block_index": 4,
                "label": "metadata",
                "raw_label": "Text",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 0.0,
                  "row_count": 0
                },
                "ordered_box_indices": []
              },
              {
                "layout_block_index": 5,
                "label": "metadata",
                "raw_label": "Text",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 30.23,
                  "row_count": 3,
                  "row_lengths": [
                    2,
                    1,
                    1
                  ]
                },
                "ordered_box_indices": [
                  3,
                  2,
                  1,
                  0
                ]
              },
              {
                "layout_block_index": 6,
                "label": "metadata",
                "raw_label": "Picture",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 0.0,
                  "row_count": 0
                },
                "ordered_box_indices": []
              },
              {
                "layout_block_index": 7,
                "label": "metadata",
                "raw_label": "Text",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 27.62,
                  "row_count": 4,
                  "row_lengths": [
                    1,
                    1,
                    1,
                    1
                  ]
                },
                "ordered_box_indices": [
                  3,
                  2,
                  1,
                  0
                ]
              },
              {
                "layout_block_index": 8,
                "label": "totals",
                "raw_label": "Picture",
                "row_grouping": {
                  "row_grouping_tolerance": 0.65,
                  "row_tolerance_pixels": 0.0,
                  "row_count": 0
                },
                "ordered_box_indices": []
              }
            ],
            "row_grouping_tolerance": 0.65
          },
          "detected_box_count": 39,
          "line_count": 39,
          "detection_seconds": 1.4935,
          "crop_seconds": 0.0123,
          "recognition_seconds": 2.413,
          "total_ocr_seconds": 4.1527,
          "layout_enabled": true,
          "layout_used": true,
          "layout_backend": "yolo"
        },
        "extraction": {
          "merchant_name": "FamilyMart",
          "transaction_date": "2026-04-12",
          "total_amount": 63000.0,
          "confidence_score": 0.584,
          "quality_score": 3.584
        },
        "preprocess": {
          "scale": 1.0,
          "resized_from": [
            1536,
            2048
          ],
          "resized_to": [
            1536,
            2048
          ],
          "input_size": [
            1536,
            2048
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
            1536,
            2048
          ]
        }
      }
    }
  }
]
```
