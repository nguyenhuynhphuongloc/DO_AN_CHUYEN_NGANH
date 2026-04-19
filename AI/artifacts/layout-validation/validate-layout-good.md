# Layout OCR Validation

| Case | Backend | Layout Used | Fallback | Raw Detections | Blocks | Model Loaded | Device | Issues |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
| layout_disabled | vietocr | False | layout_disabled | 0 | 0 | False | cpu | none |
| layout_missing_model | vietocr | False | missing_model | 0 | 0 | False | cpu | none |
| layout_disabled | paddle | False | layout_disabled | 0 | 0 | False | cpu | none |
| layout_missing_model | paddle | False | missing_model | 0 | 0 | False | cpu | none |
| layout_enabled_valid | vietocr | True |  | 11 | 9 | True | cpu | none |
| layout_enabled_valid | paddle | True |  | 11 | 9 | True | cpu | none |

```json
[
  {
    "case": "layout_disabled",
    "backend": "vietocr",
    "layout_enabled": false,
    "layout_model_path": null,
    "issues": [],
    "provider": "paddleocr+vietocr",
    "device": "cpu",
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
      "line_count": 36,
      "detection_seconds": 3.1692,
      "crop_seconds": 0.0087,
      "recognition_seconds": 22.0548,
      "total_ocr_seconds": 25.2327,
      "layout_enabled": false,
      "layout_used": false,
      "layout_backend": "yolo"
    }
  },
  {
    "case": "layout_missing_model",
    "backend": "vietocr",
    "layout_enabled": true,
    "layout_model_path": null,
    "issues": [],
    "provider": "paddleocr+vietocr",
    "device": "cpu",
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
      "line_count": 36,
      "detection_seconds": 0.3359,
      "crop_seconds": 0.0107,
      "recognition_seconds": 4.8723,
      "total_ocr_seconds": 5.2189,
      "layout_enabled": true,
      "layout_used": false,
      "layout_backend": "yolo"
    }
  },
  {
    "case": "layout_disabled",
    "backend": "paddle",
    "layout_enabled": false,
    "layout_model_path": null,
    "issues": [],
    "provider": "paddleocr",
    "device": "cpu",
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
      "detection_seconds": 0.3654,
      "crop_seconds": 0.0104,
      "recognition_seconds": 4.0091,
      "total_ocr_seconds": 4.3849,
      "layout_enabled": false,
      "layout_used": false,
      "layout_backend": "yolo"
    }
  },
  {
    "case": "layout_missing_model",
    "backend": "paddle",
    "layout_enabled": true,
    "layout_model_path": null,
    "issues": [],
    "provider": "paddleocr",
    "device": "cpu",
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
      "detection_seconds": 0.3685,
      "crop_seconds": 0.0107,
      "recognition_seconds": 1.9201,
      "total_ocr_seconds": 2.2993,
      "layout_enabled": true,
      "layout_used": false,
      "layout_backend": "yolo"
    }
  },
  {
    "case": "layout_enabled_valid",
    "backend": "vietocr",
    "layout_enabled": true,
    "layout_model_path": "/models/receipt_layout.pt",
    "issues": [],
    "provider": "paddleocr+vietocr",
    "device": "cpu",
    "layout": {
      "enabled": true,
      "used": true,
      "backend": "yolo",
      "raw_detections_count": 11,
      "postprocessed_block_count": 9,
      "debug_image_path": "/tmp/layout_debug_643675b3-e16b-4a49-93ea-39ff9b00b120-layout_enabled_valid.jpg",
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
        "layout_seconds": 0.2171,
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
        "debug_image_path": "/tmp/layout_debug_643675b3-e16b-4a49-93ea-39ff9b00b120-layout_enabled_valid.jpg"
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
      "detection_seconds": 0.6996,
      "crop_seconds": 0.0103,
      "recognition_seconds": 3.4871,
      "total_ocr_seconds": 4.4141,
      "layout_enabled": true,
      "layout_used": true,
      "layout_backend": "yolo"
    }
  },
  {
    "case": "layout_enabled_valid",
    "backend": "paddle",
    "layout_enabled": true,
    "layout_model_path": "/models/receipt_layout.pt",
    "issues": [],
    "provider": "paddleocr",
    "device": "cpu",
    "layout": {
      "enabled": true,
      "used": true,
      "backend": "yolo",
      "raw_detections_count": 11,
      "postprocessed_block_count": 9,
      "debug_image_path": "/tmp/layout_debug_643675b3-e16b-4a49-93ea-39ff9b00b120-layout_enabled_valid.jpg",
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
        "layout_seconds": 0.17,
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
        "debug_image_path": "/tmp/layout_debug_643675b3-e16b-4a49-93ea-39ff9b00b120-layout_enabled_valid.jpg"
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
      "detection_seconds": 0.955,
      "crop_seconds": 0.0136,
      "recognition_seconds": 1.6081,
      "total_ocr_seconds": 2.7467,
      "layout_enabled": true,
      "layout_used": true,
      "layout_backend": "yolo"
    }
  }
]
```
