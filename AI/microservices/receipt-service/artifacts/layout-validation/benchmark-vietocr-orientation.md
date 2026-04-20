# Layout OCR Benchmark

| Image | Backend | Layout | Device | OCR Seconds | Merchant | Date | Total | Quality | Result |
| --- | --- | --- | --- | ---: | --- | --- | --- | ---: | --- |
| receipt-test.jpg | vietocr | no-layout | cpu | 38.308 | XƯỞNG TRÀ THỦ CÔNG | 2026-04-16 | 140000.0 | 3.5425 | matched |
| receipt-test.jpg | vietocr | layout-aware | cpu | 4.4202 | XƯỞNG TRÀ THỦ CÔNG | 2026-04-16 | 140000.0 | 3.5425 | matched |
| receipt-test-rot180.jpg | vietocr | no-layout | cpu | 4.6276 | XƯỞNG TRÀ THỦ CÔNG | 2026-04-16 | 140000.0 | 3.5425 | matched |
| receipt-test-rot180.jpg | vietocr | layout-aware | cpu | 5.7951 | XƯỞNG TRÀ THỦ CÔNG | 2026-04-16 | 140000.0 | 3.5425 | matched |

## Detailed JSON

```json
[
  {
    "image": "receipt-test.jpg",
    "backend": "vietocr",
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
        "backend": "vietocr",
        "device": "cpu",
        "provider": "paddleocr+vietocr",
        "timings": {
          "ocr_seconds": 38.308,
          "total_ocr_seconds": 33.1349
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
            "row_tolerance_pixels": 40.95,
            "row_count": 18,
            "row_lengths": [
              1,
              1,
              1,
              2,
              1,
              2,
              5,
              5,
              1,
              4,
              4,
              3,
              4,
              2,
              2,
              2,
              1,
              1
            ],
            "ordered_box_indices": [
              41,
              40,
              39,
              37,
              38,
              36,
              35,
              34,
              32,
              31,
              30,
              33,
              29,
              24,
              28,
              27,
              26,
              25,
              23,
              22,
              19,
              21,
              20,
              18,
              15,
              17,
              16,
              14,
              13,
              12,
              11,
              8,
              10,
              9,
              7,
              6,
              5,
              4,
              3,
              2,
              1,
              0
            ],
            "detected_boxes": [
              [
                [
                  437.0,
                  377.0
                ],
                [
                  1152.0,
                  414.0
                ],
                [
                  1148.0,
                  499.0
                ],
                [
                  432.0,
                  462.0
                ]
              ],
              [
                [
                  741.0,
                  526.0
                ],
                [
                  849.0,
                  533.0
                ],
                [
                  846.0,
                  585.0
                ],
                [
                  737.0,
                  579.0
                ]
              ],
              [
                [
                  618.0,
                  570.0
                ],
                [
                  964.0,
                  583.0
                ],
                [
                  962.0,
                  631.0
                ],
                [
                  616.0,
                  618.0
                ]
              ],
              [
                [
                  399.0,
                  656.0
                ],
                [
                  585.0,
                  668.0
                ],
                [
                  580.0,
                  737.0
                ],
                [
                  395.0,
                  725.0
                ]
              ],
              [
                [
                  746.0,
                  657.0
                ],
                [
                  1088.0,
                  663.0
                ],
                [
                  1087.0,
                  718.0
                ],
                [
                  745.0,
                  712.0
                ]
              ],
              [
                [
                  739.0,
                  708.0
                ],
                [
                  1097.0,
                  713.0
                ],
                [
                  1096.0,
                  759.0
                ],
                [
                  738.0,
                  754.0
                ]
              ],
              [
                [
                  362.0,
                  783.0
                ],
                [
                  856.0,
                  803.0
                ],
                [
                  854.0,
                  855.0
                ],
                [
                  360.0,
                  836.0
                ]
              ],
              [
                [
                  928.0,
                  802.0
                ],
                [
                  1174.0,
                  802.0
                ],
                [
                  1174.0,
                  848.0
                ],
                [
                  928.0,
                  848.0
                ]
              ],
              [
                [
                  357.0,
                  865.0
                ],
                [
                  557.0,
                  881.0
                ],
                [
                  552.0,
                  939.0
                ],
                [
                  352.0,
                  922.0
                ]
              ],
              [
                [
                  776.0,
                  889.0
                ],
                [
                  898.0,
                  889.0
                ],
                [
                  898.0,
                  940.0
                ],
                [
                  776.0,
                  940.0
                ]
              ],
              [
                [
                  949.0,
                  891.0
                ],
                [
                  1015.0,
                  891.0
                ],
                [
                  1015.0,
                  940.0
                ],
                [
                  949.0,
                  940.0
                ]
              ],
              [
                [
                  1073.0,
                  871.0
                ],
                [
                  1212.0,
                  871.0
                ],
                [
                  1212.0,
                  919.0
                ],
                [
                  1073.0,
                  919.0
                ]
              ],
              [
                [
                  1120.0,
                  912.0
                ],
                [
                  1214.0,
                  912.0
                ],
                [
                  1214.0,
                  967.0
                ],
                [
                  1120.0,
                  967.0
                ]
              ],
              [
                [
                  347.0,
                  1017.0
                ],
                [
                  391.0,
                  1017.0
                ],
                [
                  391.0,
                  1061.0
                ],
                [
                  347.0,
                  1061.0
                ]
              ],
              [
                [
                  351.0,
                  959.0
                ],
                [
                  755.0,
                  977.0
                ],
                [
                  753.0,
                  1032.0
                ],
                [
                  348.0,
                  1014.0
                ]
              ],
              [
                [
                  767.0,
                  996.0
                ],
                [
                  952.0,
                  1002.0
                ],
                [
                  950.0,
                  1052.0
                ],
                [
                  766.0,
                  1047.0
                ]
              ],
              [
                [
                  954.0,
                  1026.0
                ],
                [
                  979.0,
                  1005.0
                ],
                [
                  998.0,
                  1027.0
                ],
                [
                  973.0,
                  1048.0
                ]
              ],
              [
                [
                  1069.0,
                  1006.0
                ],
                [
                  1212.0,
                  1006.0
                ],
                [
                  1212.0,
                  1056.0
                ],
                [
                  1069.0,
                  1056.0
                ]
              ],
              [
                [
                  348.0,
                  1076.0
                ],
                [
                  650.0,
                  1089.0
                ],
                [
                  648.0,
                  1140.0
                ],
                [
                  346.0,
                  1127.0
                ]
              ],
              [
                [
                  345.0,
                  1122.0
                ],
                [
                  706.0,
                  1132.0
                ],
                [
                  705.0,
                  1181.0
                ],
                [
                  344.0,
                  1171.0
                ]
              ],
              [
                [
                  346.0,
                  1164.0
                ],
                [
                  542.0,
                  1169.0
                ],
                [
                  540.0,
                  1220.0
                ],
                [
                  344.0,
                  1214.0
                ]
              ],
              [
                [
                  764.0,
                  1130.0
                ],
                [
                  996.0,
                  1130.0
                ],
                [
                  996.0,
                  1178.0
                ],
                [
                  764.0,
                  1178.0
                ]
              ],
              [
                [
                  1069.0,
                  1134.0
                ],
                [
                  1209.0,
                  1134.0
                ],
                [
                  1209.0,
                  1185.0
                ],
                [
                  1069.0,
                  1185.0
                ]
              ],
              [
                [
                  339.0,
                  1221.0
                ],
                [
                  732.0,
                  1236.0
                ],
                [
                  730.0,
                  1291.0
                ],
                [
                  337.0,
                  1276.0
                ]
              ],
              [
                [
                  340.0,
                  1279.0
                ],
                [
                  455.0,
                  1279.0
                ],
                [
                  455.0,
                  1322.0
                ],
                [
                  340.0,
                  1322.0
                ]
              ],
              [
                [
                  759.0,
                  1246.0
                ],
                [
                  999.0,
                  1257.0
                ],
                [
                  997.0,
                  1312.0
                ],
                [
                  756.0,
                  1301.0
                ]
              ],
              [
                [
                  1066.0,
                  1257.0
                ],
                [
                  1212.0,
                  1263.0
                ],
                [
                  1210.0,
                  1321.0
                ],
                [
                  1063.0,
                  1315.0
                ]
              ],
              [
                [
                  336.0,
                  1330.0
                ],
                [
                  507.0,
                  1342.0
                ],
                [
                  503.0,
                  1399.0
                ],
                [
                  332.0,
                  1388.0
                ]
              ],
              [
                [
                  767.0,
                  1338.0
                ],
                [
                  999.0,
                  1343.0
                ],
                [
                  997.0,
                  1401.0
                ],
                [
                  766.0,
                  1395.0
                ]
              ],
              [
                [
                  1087.0,
                  1344.0
                ],
                [
                  1215.0,
                  1351.0
                ],
                [
                  1212.0,
                  1410.0
                ],
                [
                  1084.0,
                  1404.0
                ]
              ],
              [
                [
                  332.0,
                  1400.0
                ],
                [
                  729.0,
                  1412.0
                ],
                [
                  728.0,
                  1467.0
                ],
                [
                  330.0,
                  1455.0
                ]
              ],
              [
                [
                  330.0,
                  1455.0
                ],
                [
                  459.0,
                  1455.0
                ],
                [
                  459.0,
                  1506.0
                ],
                [
                  330.0,
                  1506.0
                ]
              ],
              [
                [
                  755.0,
                  1422.0
                ],
                [
                  999.0,
                  1436.0
                ],
                [
                  996.0,
                  1493.0
                ],
                [
                  751.0,
                  1479.0
                ]
              ],
              [
                [
                  1067.0,
                  1434.0
                ],
                [
                  1215.0,
                  1443.0
                ],
                [
                  1211.0,
                  1502.0
                ],
                [
                  1063.0,
                  1493.0
                ]
              ],
              [
                [
                  325.0,
                  1519.0
                ],
                [
                  631.0,
                  1529.0
                ],
                [
                  629.0,
                  1591.0
                ],
                [
                  323.0,
                  1581.0
                ]
              ],
              [
                [
                  1023.0,
                  1535.0
                ],
                [
                  1215.0,
                  1540.0
                ],
                [
                  1213.0,
                  1598.0
                ],
                [
                  1021.0,
                  1592.0
                ]
              ],
              [
                [
                  327.0,
                  1590.0
                ],
                [
                  551.0,
                  1595.0
                ],
                [
                  550.0,
                  1653.0
                ],
                [
                  325.0,
                  1647.0
                ]
              ],
              [
                [
                  1172.0,
                  1616.0
                ],
                [
                  1214.0,
                  1616.0
                ],
                [
                  1214.0,
                  1666.0
                ],
                [
                  1172.0,
                  1666.0
                ]
              ],
              [
                [
                  326.0,
                  1662.0
                ],
                [
                  576.0,
                  1679.0
                ],
                [
                  571.0,
                  1741.0
                ],
                [
                  322.0,
                  1724.0
                ]
              ],
              [
                [
                  986.0,
                  1679.0
                ],
                [
                  1212.0,
                  1685.0
                ],
                [
                  1211.0,
                  1751.0
                ],
                [
                  984.0,
                  1746.0
                ]
              ],
              [
                [
                  339.0,
                  1789.0
                ],
                [
                  1201.0,
                  1806.0
                ],
                [
                  1199.0,
                  1887.0
                ],
                [
                  337.0,
                  1870.0
                ]
              ],
              [
                [
                  549.0,
                  1874.0
                ],
                [
                  978.0,
                  1884.0
                ],
                [
                  976.0,
                  1939.0
                ],
                [
                  548.0,
                  1929.0
                ]
              ]
            ]
          },
          "detected_box_count": 42,
          "line_count": 42,
          "detection_seconds": 0.2733,
          "crop_seconds": 0.0153,
          "recognition_seconds": 32.8463,
          "total_ocr_seconds": 33.1349,
          "layout_enabled": false,
          "layout_used": false,
          "layout_backend": "yolo",
          "document_orientation_enabled": true,
          "document_orientation_checked": true,
          "document_orientation_rotated_180": true,
          "document_orientation_consensus_ratio": 0.9302,
          "document_orientation_box_count": 43
        },
        "extraction": {
          "merchant_name": "XƯỞNG TRÀ THỦ CÔNG",
          "transaction_date": "2026-04-16",
          "total_amount": 140000.0,
          "confidence_score": 0.5425,
          "quality_score": 3.5425
        },
        "preprocess": {
          "scale": 0.8594,
          "resized_from": [
            1920,
            2560
          ],
          "resized_to": [
            1650,
            2200
          ],
          "input_size": [
            1920,
            2560
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
            1650,
            2200
          ]
        }
      },
      "layout": {
        "layout_enabled": true,
        "backend": "vietocr",
        "device": "cpu",
        "provider": "paddleocr+vietocr",
        "timings": {
          "ocr_seconds": 4.4202,
          "total_ocr_seconds": 3.2973
        },
        "layout": {
          "enabled": true,
          "used": false,
          "backend": "yolo",
          "raw_detections_count": 1,
          "postprocessed_block_count": 1,
          "debug_image_path": "/tmp/layout_debug_receipt-test-fast.jpg",
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
            "layout_seconds": 0.2844,
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
            "debug_image_path": "/tmp/layout_debug_receipt-test-fast.jpg"
          },
          "blocks": [
            {
              "index": 0,
              "label": "items",
              "raw_label": "Table",
              "confidence": 0.5709,
              "bbox": [
                348,
                434,
                1211,
                1725
              ],
              "area_ratio": 0.306924,
              "unknown_label": false,
              "semantic_source": "body_anchor"
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
            "row_grouping_tolerance": 0.65,
            "row_tolerance_pixels": 40.95,
            "row_count": 18,
            "row_lengths": [
              1,
              1,
              1,
              2,
              1,
              2,
              5,
              5,
              1,
              4,
              4,
              3,
              4,
              2,
              2,
              2,
              1,
              1
            ],
            "ordered_box_indices": [
              41,
              40,
              39,
              37,
              38,
              36,
              35,
              34,
              32,
              31,
              30,
              33,
              29,
              24,
              28,
              27,
              26,
              25,
              23,
              22,
              19,
              21,
              20,
              18,
              15,
              17,
              16,
              14,
              13,
              12,
              11,
              8,
              10,
              9,
              7,
              6,
              5,
              4,
              3,
              2,
              1,
              0
            ],
            "detected_boxes": [
              [
                [
                  437.0,
                  377.0
                ],
                [
                  1152.0,
                  414.0
                ],
                [
                  1148.0,
                  499.0
                ],
                [
                  432.0,
                  462.0
                ]
              ],
              [
                [
                  741.0,
                  526.0
                ],
                [
                  849.0,
                  533.0
                ],
                [
                  846.0,
                  585.0
                ],
                [
                  737.0,
                  579.0
                ]
              ],
              [
                [
                  618.0,
                  570.0
                ],
                [
                  964.0,
                  583.0
                ],
                [
                  962.0,
                  631.0
                ],
                [
                  616.0,
                  618.0
                ]
              ],
              [
                [
                  399.0,
                  656.0
                ],
                [
                  585.0,
                  668.0
                ],
                [
                  580.0,
                  737.0
                ],
                [
                  395.0,
                  725.0
                ]
              ],
              [
                [
                  746.0,
                  657.0
                ],
                [
                  1088.0,
                  663.0
                ],
                [
                  1087.0,
                  718.0
                ],
                [
                  745.0,
                  712.0
                ]
              ],
              [
                [
                  739.0,
                  708.0
                ],
                [
                  1097.0,
                  713.0
                ],
                [
                  1096.0,
                  759.0
                ],
                [
                  738.0,
                  754.0
                ]
              ],
              [
                [
                  362.0,
                  783.0
                ],
                [
                  856.0,
                  803.0
                ],
                [
                  854.0,
                  855.0
                ],
                [
                  360.0,
                  836.0
                ]
              ],
              [
                [
                  928.0,
                  802.0
                ],
                [
                  1174.0,
                  802.0
                ],
                [
                  1174.0,
                  848.0
                ],
                [
                  928.0,
                  848.0
                ]
              ],
              [
                [
                  357.0,
                  865.0
                ],
                [
                  557.0,
                  881.0
                ],
                [
                  552.0,
                  939.0
                ],
                [
                  352.0,
                  922.0
                ]
              ],
              [
                [
                  776.0,
                  889.0
                ],
                [
                  898.0,
                  889.0
                ],
                [
                  898.0,
                  940.0
                ],
                [
                  776.0,
                  940.0
                ]
              ],
              [
                [
                  949.0,
                  891.0
                ],
                [
                  1015.0,
                  891.0
                ],
                [
                  1015.0,
                  940.0
                ],
                [
                  949.0,
                  940.0
                ]
              ],
              [
                [
                  1073.0,
                  871.0
                ],
                [
                  1212.0,
                  871.0
                ],
                [
                  1212.0,
                  919.0
                ],
                [
                  1073.0,
                  919.0
                ]
              ],
              [
                [
                  1120.0,
                  912.0
                ],
                [
                  1214.0,
                  912.0
                ],
                [
                  1214.0,
                  967.0
                ],
                [
                  1120.0,
                  967.0
                ]
              ],
              [
                [
                  347.0,
                  1017.0
                ],
                [
                  391.0,
                  1017.0
                ],
                [
                  391.0,
                  1061.0
                ],
                [
                  347.0,
                  1061.0
                ]
              ],
              [
                [
                  351.0,
                  959.0
                ],
                [
                  755.0,
                  977.0
                ],
                [
                  753.0,
                  1032.0
                ],
                [
                  348.0,
                  1014.0
                ]
              ],
              [
                [
                  767.0,
                  996.0
                ],
                [
                  952.0,
                  1002.0
                ],
                [
                  950.0,
                  1052.0
                ],
                [
                  766.0,
                  1047.0
                ]
              ],
              [
                [
                  954.0,
                  1026.0
                ],
                [
                  979.0,
                  1005.0
                ],
                [
                  998.0,
                  1027.0
                ],
                [
                  973.0,
                  1048.0
                ]
              ],
              [
                [
                  1069.0,
                  1006.0
                ],
                [
                  1212.0,
                  1006.0
                ],
                [
                  1212.0,
                  1056.0
                ],
                [
                  1069.0,
                  1056.0
                ]
              ],
              [
                [
                  348.0,
                  1076.0
                ],
                [
                  650.0,
                  1089.0
                ],
                [
                  648.0,
                  1140.0
                ],
                [
                  346.0,
                  1127.0
                ]
              ],
              [
                [
                  345.0,
                  1122.0
                ],
                [
                  706.0,
                  1132.0
                ],
                [
                  705.0,
                  1181.0
                ],
                [
                  344.0,
                  1171.0
                ]
              ],
              [
                [
                  346.0,
                  1164.0
                ],
                [
                  542.0,
                  1169.0
                ],
                [
                  540.0,
                  1220.0
                ],
                [
                  344.0,
                  1214.0
                ]
              ],
              [
                [
                  764.0,
                  1130.0
                ],
                [
                  996.0,
                  1130.0
                ],
                [
                  996.0,
                  1178.0
                ],
                [
                  764.0,
                  1178.0
                ]
              ],
              [
                [
                  1069.0,
                  1134.0
                ],
                [
                  1209.0,
                  1134.0
                ],
                [
                  1209.0,
                  1185.0
                ],
                [
                  1069.0,
                  1185.0
                ]
              ],
              [
                [
                  339.0,
                  1221.0
                ],
                [
                  732.0,
                  1236.0
                ],
                [
                  730.0,
                  1291.0
                ],
                [
                  337.0,
                  1276.0
                ]
              ],
              [
                [
                  340.0,
                  1279.0
                ],
                [
                  455.0,
                  1279.0
                ],
                [
                  455.0,
                  1322.0
                ],
                [
                  340.0,
                  1322.0
                ]
              ],
              [
                [
                  759.0,
                  1246.0
                ],
                [
                  999.0,
                  1257.0
                ],
                [
                  997.0,
                  1312.0
                ],
                [
                  756.0,
                  1301.0
                ]
              ],
              [
                [
                  1066.0,
                  1257.0
                ],
                [
                  1212.0,
                  1263.0
                ],
                [
                  1210.0,
                  1321.0
                ],
                [
                  1063.0,
                  1315.0
                ]
              ],
              [
                [
                  336.0,
                  1330.0
                ],
                [
                  507.0,
                  1342.0
                ],
                [
                  503.0,
                  1399.0
                ],
                [
                  332.0,
                  1388.0
                ]
              ],
              [
                [
                  767.0,
                  1338.0
                ],
                [
                  999.0,
                  1343.0
                ],
                [
                  997.0,
                  1401.0
                ],
                [
                  766.0,
                  1395.0
                ]
              ],
              [
                [
                  1087.0,
                  1344.0
                ],
                [
                  1215.0,
                  1351.0
                ],
                [
                  1212.0,
                  1410.0
                ],
                [
                  1084.0,
                  1404.0
                ]
              ],
              [
                [
                  332.0,
                  1400.0
                ],
                [
                  729.0,
                  1412.0
                ],
                [
                  728.0,
                  1467.0
                ],
                [
                  330.0,
                  1455.0
                ]
              ],
              [
                [
                  330.0,
                  1455.0
                ],
                [
                  459.0,
                  1455.0
                ],
                [
                  459.0,
                  1506.0
                ],
                [
                  330.0,
                  1506.0
                ]
              ],
              [
                [
                  755.0,
                  1422.0
                ],
                [
                  999.0,
                  1436.0
                ],
                [
                  996.0,
                  1493.0
                ],
                [
                  751.0,
                  1479.0
                ]
              ],
              [
                [
                  1067.0,
                  1434.0
                ],
                [
                  1215.0,
                  1443.0
                ],
                [
                  1211.0,
                  1502.0
                ],
                [
                  1063.0,
                  1493.0
                ]
              ],
              [
                [
                  325.0,
                  1519.0
                ],
                [
                  631.0,
                  1529.0
                ],
                [
                  629.0,
                  1591.0
                ],
                [
                  323.0,
                  1581.0
                ]
              ],
              [
                [
                  1023.0,
                  1535.0
                ],
                [
                  1215.0,
                  1540.0
                ],
                [
                  1213.0,
                  1598.0
                ],
                [
                  1021.0,
                  1592.0
                ]
              ],
              [
                [
                  327.0,
                  1590.0
                ],
                [
                  551.0,
                  1595.0
                ],
                [
                  550.0,
                  1653.0
                ],
                [
                  325.0,
                  1647.0
                ]
              ],
              [
                [
                  1172.0,
                  1616.0
                ],
                [
                  1214.0,
                  1616.0
                ],
                [
                  1214.0,
                  1666.0
                ],
                [
                  1172.0,
                  1666.0
                ]
              ],
              [
                [
                  326.0,
                  1662.0
                ],
                [
                  576.0,
                  1679.0
                ],
                [
                  571.0,
                  1741.0
                ],
                [
                  322.0,
                  1724.0
                ]
              ],
              [
                [
                  986.0,
                  1679.0
                ],
                [
                  1212.0,
                  1685.0
                ],
                [
                  1211.0,
                  1751.0
                ],
                [
                  984.0,
                  1746.0
                ]
              ],
              [
                [
                  339.0,
                  1789.0
                ],
                [
                  1201.0,
                  1806.0
                ],
                [
                  1199.0,
                  1887.0
                ],
                [
                  337.0,
                  1870.0
                ]
              ],
              [
                [
                  549.0,
                  1874.0
                ],
                [
                  978.0,
                  1884.0
                ],
                [
                  976.0,
                  1939.0
                ],
                [
                  548.0,
                  1929.0
                ]
              ]
            ]
          },
          "detected_box_count": 42,
          "line_count": 42,
          "detection_seconds": 0.2334,
          "crop_seconds": 0.0178,
          "recognition_seconds": 3.0461,
          "total_ocr_seconds": 3.2973,
          "layout_enabled": true,
          "layout_used": false,
          "layout_backend": "yolo",
          "document_orientation_enabled": true,
          "document_orientation_checked": true,
          "document_orientation_rotated_180": true,
          "document_orientation_consensus_ratio": 0.9302,
          "document_orientation_box_count": 43
        },
        "extraction": {
          "merchant_name": "XƯỞNG TRÀ THỦ CÔNG",
          "transaction_date": "2026-04-16",
          "total_amount": 140000.0,
          "confidence_score": 0.5425,
          "quality_score": 3.5425
        },
        "preprocess": {
          "scale": 0.8594,
          "resized_from": [
            1920,
            2560
          ],
          "resized_to": [
            1650,
            2200
          ],
          "input_size": [
            1920,
            2560
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
            1650,
            2200
          ]
        }
      }
    }
  },
  {
    "image": "receipt-test-rot180.jpg",
    "backend": "vietocr",
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
        "backend": "vietocr",
        "device": "cpu",
        "provider": "paddleocr+vietocr",
        "timings": {
          "ocr_seconds": 4.6276,
          "total_ocr_seconds": 3.9885
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
            "row_tolerance_pixels": 40.95,
            "row_count": 18,
            "row_lengths": [
              1,
              1,
              1,
              2,
              1,
              2,
              5,
              5,
              1,
              4,
              4,
              3,
              4,
              2,
              2,
              2,
              1,
              1
            ],
            "ordered_box_indices": [
              41,
              40,
              39,
              37,
              38,
              36,
              35,
              34,
              32,
              31,
              30,
              33,
              29,
              24,
              28,
              27,
              26,
              25,
              23,
              22,
              19,
              21,
              20,
              18,
              15,
              17,
              16,
              14,
              13,
              12,
              11,
              8,
              10,
              9,
              7,
              6,
              5,
              4,
              3,
              2,
              1,
              0
            ],
            "detected_boxes": [
              [
                [
                  437.0,
                  377.0
                ],
                [
                  1152.0,
                  414.0
                ],
                [
                  1148.0,
                  499.0
                ],
                [
                  432.0,
                  462.0
                ]
              ],
              [
                [
                  741.0,
                  526.0
                ],
                [
                  849.0,
                  533.0
                ],
                [
                  846.0,
                  585.0
                ],
                [
                  737.0,
                  579.0
                ]
              ],
              [
                [
                  618.0,
                  570.0
                ],
                [
                  964.0,
                  583.0
                ],
                [
                  962.0,
                  631.0
                ],
                [
                  616.0,
                  618.0
                ]
              ],
              [
                [
                  399.0,
                  656.0
                ],
                [
                  585.0,
                  668.0
                ],
                [
                  580.0,
                  737.0
                ],
                [
                  395.0,
                  725.0
                ]
              ],
              [
                [
                  746.0,
                  657.0
                ],
                [
                  1088.0,
                  663.0
                ],
                [
                  1087.0,
                  718.0
                ],
                [
                  745.0,
                  712.0
                ]
              ],
              [
                [
                  739.0,
                  708.0
                ],
                [
                  1097.0,
                  713.0
                ],
                [
                  1096.0,
                  761.0
                ],
                [
                  738.0,
                  756.0
                ]
              ],
              [
                [
                  362.0,
                  783.0
                ],
                [
                  856.0,
                  803.0
                ],
                [
                  854.0,
                  855.0
                ],
                [
                  360.0,
                  836.0
                ]
              ],
              [
                [
                  928.0,
                  802.0
                ],
                [
                  1174.0,
                  802.0
                ],
                [
                  1174.0,
                  848.0
                ],
                [
                  928.0,
                  848.0
                ]
              ],
              [
                [
                  357.0,
                  865.0
                ],
                [
                  557.0,
                  881.0
                ],
                [
                  552.0,
                  939.0
                ],
                [
                  352.0,
                  922.0
                ]
              ],
              [
                [
                  776.0,
                  889.0
                ],
                [
                  898.0,
                  889.0
                ],
                [
                  898.0,
                  940.0
                ],
                [
                  776.0,
                  940.0
                ]
              ],
              [
                [
                  949.0,
                  891.0
                ],
                [
                  1015.0,
                  891.0
                ],
                [
                  1015.0,
                  940.0
                ],
                [
                  949.0,
                  940.0
                ]
              ],
              [
                [
                  1073.0,
                  871.0
                ],
                [
                  1212.0,
                  871.0
                ],
                [
                  1212.0,
                  919.0
                ],
                [
                  1073.0,
                  919.0
                ]
              ],
              [
                [
                  1120.0,
                  912.0
                ],
                [
                  1214.0,
                  912.0
                ],
                [
                  1214.0,
                  967.0
                ],
                [
                  1120.0,
                  967.0
                ]
              ],
              [
                [
                  347.0,
                  1017.0
                ],
                [
                  391.0,
                  1017.0
                ],
                [
                  391.0,
                  1061.0
                ],
                [
                  347.0,
                  1061.0
                ]
              ],
              [
                [
                  351.0,
                  959.0
                ],
                [
                  755.0,
                  977.0
                ],
                [
                  753.0,
                  1032.0
                ],
                [
                  348.0,
                  1014.0
                ]
              ],
              [
                [
                  767.0,
                  996.0
                ],
                [
                  952.0,
                  1002.0
                ],
                [
                  950.0,
                  1052.0
                ],
                [
                  766.0,
                  1047.0
                ]
              ],
              [
                [
                  954.0,
                  1026.0
                ],
                [
                  979.0,
                  1005.0
                ],
                [
                  998.0,
                  1027.0
                ],
                [
                  973.0,
                  1048.0
                ]
              ],
              [
                [
                  1069.0,
                  1006.0
                ],
                [
                  1212.0,
                  1006.0
                ],
                [
                  1212.0,
                  1056.0
                ],
                [
                  1069.0,
                  1056.0
                ]
              ],
              [
                [
                  348.0,
                  1076.0
                ],
                [
                  650.0,
                  1089.0
                ],
                [
                  648.0,
                  1140.0
                ],
                [
                  346.0,
                  1127.0
                ]
              ],
              [
                [
                  343.0,
                  1120.0
                ],
                [
                  708.0,
                  1130.0
                ],
                [
                  707.0,
                  1185.0
                ],
                [
                  342.0,
                  1175.0
                ]
              ],
              [
                [
                  346.0,
                  1164.0
                ],
                [
                  542.0,
                  1169.0
                ],
                [
                  540.0,
                  1220.0
                ],
                [
                  344.0,
                  1214.0
                ]
              ],
              [
                [
                  764.0,
                  1130.0
                ],
                [
                  996.0,
                  1130.0
                ],
                [
                  996.0,
                  1178.0
                ],
                [
                  764.0,
                  1178.0
                ]
              ],
              [
                [
                  1069.0,
                  1134.0
                ],
                [
                  1209.0,
                  1134.0
                ],
                [
                  1209.0,
                  1185.0
                ],
                [
                  1069.0,
                  1185.0
                ]
              ],
              [
                [
                  339.0,
                  1221.0
                ],
                [
                  732.0,
                  1236.0
                ],
                [
                  730.0,
                  1291.0
                ],
                [
                  337.0,
                  1276.0
                ]
              ],
              [
                [
                  340.0,
                  1279.0
                ],
                [
                  455.0,
                  1279.0
                ],
                [
                  455.0,
                  1322.0
                ],
                [
                  340.0,
                  1322.0
                ]
              ],
              [
                [
                  759.0,
                  1246.0
                ],
                [
                  999.0,
                  1257.0
                ],
                [
                  997.0,
                  1312.0
                ],
                [
                  756.0,
                  1301.0
                ]
              ],
              [
                [
                  1066.0,
                  1257.0
                ],
                [
                  1212.0,
                  1263.0
                ],
                [
                  1210.0,
                  1321.0
                ],
                [
                  1063.0,
                  1315.0
                ]
              ],
              [
                [
                  336.0,
                  1330.0
                ],
                [
                  507.0,
                  1342.0
                ],
                [
                  503.0,
                  1399.0
                ],
                [
                  332.0,
                  1388.0
                ]
              ],
              [
                [
                  767.0,
                  1338.0
                ],
                [
                  999.0,
                  1343.0
                ],
                [
                  997.0,
                  1401.0
                ],
                [
                  766.0,
                  1395.0
                ]
              ],
              [
                [
                  1087.0,
                  1344.0
                ],
                [
                  1215.0,
                  1351.0
                ],
                [
                  1212.0,
                  1410.0
                ],
                [
                  1084.0,
                  1404.0
                ]
              ],
              [
                [
                  332.0,
                  1400.0
                ],
                [
                  729.0,
                  1412.0
                ],
                [
                  728.0,
                  1467.0
                ],
                [
                  330.0,
                  1455.0
                ]
              ],
              [
                [
                  330.0,
                  1455.0
                ],
                [
                  459.0,
                  1455.0
                ],
                [
                  459.0,
                  1506.0
                ],
                [
                  330.0,
                  1506.0
                ]
              ],
              [
                [
                  754.0,
                  1422.0
                ],
                [
                  999.0,
                  1436.0
                ],
                [
                  996.0,
                  1490.0
                ],
                [
                  751.0,
                  1477.0
                ]
              ],
              [
                [
                  1067.0,
                  1434.0
                ],
                [
                  1215.0,
                  1443.0
                ],
                [
                  1211.0,
                  1502.0
                ],
                [
                  1063.0,
                  1493.0
                ]
              ],
              [
                [
                  325.0,
                  1519.0
                ],
                [
                  631.0,
                  1529.0
                ],
                [
                  629.0,
                  1591.0
                ],
                [
                  323.0,
                  1581.0
                ]
              ],
              [
                [
                  1023.0,
                  1535.0
                ],
                [
                  1215.0,
                  1540.0
                ],
                [
                  1213.0,
                  1598.0
                ],
                [
                  1021.0,
                  1592.0
                ]
              ],
              [
                [
                  327.0,
                  1590.0
                ],
                [
                  551.0,
                  1595.0
                ],
                [
                  550.0,
                  1653.0
                ],
                [
                  325.0,
                  1647.0
                ]
              ],
              [
                [
                  1172.0,
                  1616.0
                ],
                [
                  1214.0,
                  1616.0
                ],
                [
                  1214.0,
                  1666.0
                ],
                [
                  1172.0,
                  1666.0
                ]
              ],
              [
                [
                  327.0,
                  1660.0
                ],
                [
                  573.0,
                  1677.0
                ],
                [
                  569.0,
                  1741.0
                ],
                [
                  322.0,
                  1724.0
                ]
              ],
              [
                [
                  986.0,
                  1679.0
                ],
                [
                  1212.0,
                  1685.0
                ],
                [
                  1211.0,
                  1751.0
                ],
                [
                  984.0,
                  1746.0
                ]
              ],
              [
                [
                  339.0,
                  1789.0
                ],
                [
                  1201.0,
                  1806.0
                ],
                [
                  1199.0,
                  1887.0
                ],
                [
                  337.0,
                  1870.0
                ]
              ],
              [
                [
                  549.0,
                  1874.0
                ],
                [
                  978.0,
                  1884.0
                ],
                [
                  976.0,
                  1939.0
                ],
                [
                  548.0,
                  1929.0
                ]
              ]
            ]
          },
          "detected_box_count": 42,
          "line_count": 42,
          "detection_seconds": 0.0,
          "crop_seconds": 0.0148,
          "recognition_seconds": 3.9737,
          "total_ocr_seconds": 3.9885,
          "layout_enabled": false,
          "layout_used": false,
          "layout_backend": "yolo",
          "document_orientation_enabled": true,
          "document_orientation_checked": true,
          "document_orientation_rotated_180": false,
          "document_orientation_consensus_ratio": 0.0,
          "document_orientation_box_count": 42
        },
        "extraction": {
          "merchant_name": "XƯỞNG TRÀ THỦ CÔNG",
          "transaction_date": "2026-04-16",
          "total_amount": 140000.0,
          "confidence_score": 0.5425,
          "quality_score": 3.5425
        },
        "preprocess": {
          "scale": 0.8594,
          "resized_from": [
            1920,
            2560
          ],
          "resized_to": [
            1650,
            2200
          ],
          "input_size": [
            1920,
            2560
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
            1650,
            2200
          ]
        }
      },
      "layout": {
        "layout_enabled": true,
        "backend": "vietocr",
        "device": "cpu",
        "provider": "paddleocr+vietocr",
        "timings": {
          "ocr_seconds": 5.7951,
          "total_ocr_seconds": 4.7515
        },
        "layout": {
          "enabled": true,
          "used": false,
          "backend": "yolo",
          "raw_detections_count": 1,
          "postprocessed_block_count": 1,
          "debug_image_path": "/tmp/layout_debug_receipt-test-rot180-fast.jpg",
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
            "layout_seconds": 0.2648,
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
            "debug_image_path": "/tmp/layout_debug_receipt-test-rot180-fast.jpg"
          },
          "blocks": [
            {
              "index": 0,
              "label": "items",
              "raw_label": "Table",
              "confidence": 0.5706,
              "bbox": [
                348,
                433,
                1211,
                1725
              ],
              "area_ratio": 0.307161,
              "unknown_label": false,
              "semantic_source": "body_anchor"
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
            "row_grouping_tolerance": 0.65,
            "row_tolerance_pixels": 40.95,
            "row_count": 18,
            "row_lengths": [
              1,
              1,
              1,
              2,
              1,
              2,
              5,
              5,
              1,
              4,
              4,
              3,
              4,
              2,
              2,
              2,
              1,
              1
            ],
            "ordered_box_indices": [
              41,
              40,
              39,
              37,
              38,
              36,
              35,
              34,
              32,
              31,
              30,
              33,
              29,
              24,
              28,
              27,
              26,
              25,
              23,
              22,
              19,
              21,
              20,
              18,
              15,
              17,
              16,
              14,
              13,
              12,
              11,
              8,
              10,
              9,
              7,
              6,
              5,
              4,
              3,
              2,
              1,
              0
            ],
            "detected_boxes": [
              [
                [
                  437.0,
                  377.0
                ],
                [
                  1152.0,
                  414.0
                ],
                [
                  1148.0,
                  499.0
                ],
                [
                  432.0,
                  462.0
                ]
              ],
              [
                [
                  741.0,
                  526.0
                ],
                [
                  849.0,
                  533.0
                ],
                [
                  846.0,
                  585.0
                ],
                [
                  737.0,
                  579.0
                ]
              ],
              [
                [
                  618.0,
                  570.0
                ],
                [
                  964.0,
                  583.0
                ],
                [
                  962.0,
                  631.0
                ],
                [
                  616.0,
                  618.0
                ]
              ],
              [
                [
                  399.0,
                  656.0
                ],
                [
                  585.0,
                  668.0
                ],
                [
                  580.0,
                  737.0
                ],
                [
                  395.0,
                  725.0
                ]
              ],
              [
                [
                  746.0,
                  657.0
                ],
                [
                  1088.0,
                  663.0
                ],
                [
                  1087.0,
                  718.0
                ],
                [
                  745.0,
                  712.0
                ]
              ],
              [
                [
                  739.0,
                  708.0
                ],
                [
                  1097.0,
                  713.0
                ],
                [
                  1096.0,
                  761.0
                ],
                [
                  738.0,
                  756.0
                ]
              ],
              [
                [
                  362.0,
                  783.0
                ],
                [
                  856.0,
                  803.0
                ],
                [
                  854.0,
                  855.0
                ],
                [
                  360.0,
                  836.0
                ]
              ],
              [
                [
                  928.0,
                  802.0
                ],
                [
                  1174.0,
                  802.0
                ],
                [
                  1174.0,
                  848.0
                ],
                [
                  928.0,
                  848.0
                ]
              ],
              [
                [
                  357.0,
                  865.0
                ],
                [
                  557.0,
                  881.0
                ],
                [
                  552.0,
                  939.0
                ],
                [
                  352.0,
                  922.0
                ]
              ],
              [
                [
                  776.0,
                  889.0
                ],
                [
                  898.0,
                  889.0
                ],
                [
                  898.0,
                  940.0
                ],
                [
                  776.0,
                  940.0
                ]
              ],
              [
                [
                  949.0,
                  891.0
                ],
                [
                  1015.0,
                  891.0
                ],
                [
                  1015.0,
                  940.0
                ],
                [
                  949.0,
                  940.0
                ]
              ],
              [
                [
                  1073.0,
                  871.0
                ],
                [
                  1212.0,
                  871.0
                ],
                [
                  1212.0,
                  919.0
                ],
                [
                  1073.0,
                  919.0
                ]
              ],
              [
                [
                  1120.0,
                  912.0
                ],
                [
                  1214.0,
                  912.0
                ],
                [
                  1214.0,
                  967.0
                ],
                [
                  1120.0,
                  967.0
                ]
              ],
              [
                [
                  347.0,
                  1017.0
                ],
                [
                  391.0,
                  1017.0
                ],
                [
                  391.0,
                  1061.0
                ],
                [
                  347.0,
                  1061.0
                ]
              ],
              [
                [
                  351.0,
                  959.0
                ],
                [
                  755.0,
                  977.0
                ],
                [
                  753.0,
                  1032.0
                ],
                [
                  348.0,
                  1014.0
                ]
              ],
              [
                [
                  767.0,
                  996.0
                ],
                [
                  952.0,
                  1002.0
                ],
                [
                  950.0,
                  1052.0
                ],
                [
                  766.0,
                  1047.0
                ]
              ],
              [
                [
                  954.0,
                  1026.0
                ],
                [
                  979.0,
                  1005.0
                ],
                [
                  998.0,
                  1027.0
                ],
                [
                  973.0,
                  1048.0
                ]
              ],
              [
                [
                  1069.0,
                  1006.0
                ],
                [
                  1212.0,
                  1006.0
                ],
                [
                  1212.0,
                  1056.0
                ],
                [
                  1069.0,
                  1056.0
                ]
              ],
              [
                [
                  348.0,
                  1076.0
                ],
                [
                  650.0,
                  1089.0
                ],
                [
                  648.0,
                  1140.0
                ],
                [
                  346.0,
                  1127.0
                ]
              ],
              [
                [
                  343.0,
                  1120.0
                ],
                [
                  708.0,
                  1130.0
                ],
                [
                  707.0,
                  1185.0
                ],
                [
                  342.0,
                  1175.0
                ]
              ],
              [
                [
                  346.0,
                  1164.0
                ],
                [
                  542.0,
                  1169.0
                ],
                [
                  540.0,
                  1220.0
                ],
                [
                  344.0,
                  1214.0
                ]
              ],
              [
                [
                  764.0,
                  1130.0
                ],
                [
                  996.0,
                  1130.0
                ],
                [
                  996.0,
                  1178.0
                ],
                [
                  764.0,
                  1178.0
                ]
              ],
              [
                [
                  1069.0,
                  1134.0
                ],
                [
                  1209.0,
                  1134.0
                ],
                [
                  1209.0,
                  1185.0
                ],
                [
                  1069.0,
                  1185.0
                ]
              ],
              [
                [
                  339.0,
                  1221.0
                ],
                [
                  732.0,
                  1236.0
                ],
                [
                  730.0,
                  1291.0
                ],
                [
                  337.0,
                  1276.0
                ]
              ],
              [
                [
                  340.0,
                  1279.0
                ],
                [
                  455.0,
                  1279.0
                ],
                [
                  455.0,
                  1322.0
                ],
                [
                  340.0,
                  1322.0
                ]
              ],
              [
                [
                  759.0,
                  1246.0
                ],
                [
                  999.0,
                  1257.0
                ],
                [
                  997.0,
                  1312.0
                ],
                [
                  756.0,
                  1301.0
                ]
              ],
              [
                [
                  1066.0,
                  1257.0
                ],
                [
                  1212.0,
                  1263.0
                ],
                [
                  1210.0,
                  1321.0
                ],
                [
                  1063.0,
                  1315.0
                ]
              ],
              [
                [
                  336.0,
                  1330.0
                ],
                [
                  507.0,
                  1342.0
                ],
                [
                  503.0,
                  1399.0
                ],
                [
                  332.0,
                  1388.0
                ]
              ],
              [
                [
                  767.0,
                  1338.0
                ],
                [
                  999.0,
                  1343.0
                ],
                [
                  997.0,
                  1401.0
                ],
                [
                  766.0,
                  1395.0
                ]
              ],
              [
                [
                  1087.0,
                  1344.0
                ],
                [
                  1215.0,
                  1351.0
                ],
                [
                  1212.0,
                  1410.0
                ],
                [
                  1084.0,
                  1404.0
                ]
              ],
              [
                [
                  332.0,
                  1400.0
                ],
                [
                  729.0,
                  1412.0
                ],
                [
                  728.0,
                  1467.0
                ],
                [
                  330.0,
                  1455.0
                ]
              ],
              [
                [
                  330.0,
                  1455.0
                ],
                [
                  459.0,
                  1455.0
                ],
                [
                  459.0,
                  1506.0
                ],
                [
                  330.0,
                  1506.0
                ]
              ],
              [
                [
                  754.0,
                  1422.0
                ],
                [
                  999.0,
                  1436.0
                ],
                [
                  996.0,
                  1490.0
                ],
                [
                  751.0,
                  1477.0
                ]
              ],
              [
                [
                  1067.0,
                  1434.0
                ],
                [
                  1215.0,
                  1443.0
                ],
                [
                  1211.0,
                  1502.0
                ],
                [
                  1063.0,
                  1493.0
                ]
              ],
              [
                [
                  325.0,
                  1519.0
                ],
                [
                  631.0,
                  1529.0
                ],
                [
                  629.0,
                  1591.0
                ],
                [
                  323.0,
                  1581.0
                ]
              ],
              [
                [
                  1023.0,
                  1535.0
                ],
                [
                  1215.0,
                  1540.0
                ],
                [
                  1213.0,
                  1598.0
                ],
                [
                  1021.0,
                  1592.0
                ]
              ],
              [
                [
                  327.0,
                  1590.0
                ],
                [
                  551.0,
                  1595.0
                ],
                [
                  550.0,
                  1653.0
                ],
                [
                  325.0,
                  1647.0
                ]
              ],
              [
                [
                  1172.0,
                  1616.0
                ],
                [
                  1214.0,
                  1616.0
                ],
                [
                  1214.0,
                  1666.0
                ],
                [
                  1172.0,
                  1666.0
                ]
              ],
              [
                [
                  327.0,
                  1660.0
                ],
                [
                  573.0,
                  1677.0
                ],
                [
                  569.0,
                  1741.0
                ],
                [
                  322.0,
                  1724.0
                ]
              ],
              [
                [
                  986.0,
                  1679.0
                ],
                [
                  1212.0,
                  1685.0
                ],
                [
                  1211.0,
                  1751.0
                ],
                [
                  984.0,
                  1746.0
                ]
              ],
              [
                [
                  339.0,
                  1789.0
                ],
                [
                  1201.0,
                  1806.0
                ],
                [
                  1199.0,
                  1887.0
                ],
                [
                  337.0,
                  1870.0
                ]
              ],
              [
                [
                  549.0,
                  1874.0
                ],
                [
                  978.0,
                  1884.0
                ],
                [
                  976.0,
                  1939.0
                ],
                [
                  548.0,
                  1929.0
                ]
              ]
            ]
          },
          "detected_box_count": 42,
          "line_count": 42,
          "detection_seconds": 0.0,
          "crop_seconds": 0.0189,
          "recognition_seconds": 4.7326,
          "total_ocr_seconds": 4.7515,
          "layout_enabled": true,
          "layout_used": false,
          "layout_backend": "yolo",
          "document_orientation_enabled": true,
          "document_orientation_checked": true,
          "document_orientation_rotated_180": false,
          "document_orientation_consensus_ratio": 0.0,
          "document_orientation_box_count": 42
        },
        "extraction": {
          "merchant_name": "XƯỞNG TRÀ THỦ CÔNG",
          "transaction_date": "2026-04-16",
          "total_amount": 140000.0,
          "confidence_score": 0.5425,
          "quality_score": 3.5425
        },
        "preprocess": {
          "scale": 0.8594,
          "resized_from": [
            1920,
            2560
          ],
          "resized_to": [
            1650,
            2200
          ],
          "input_size": [
            1920,
            2560
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
            1650,
            2200
          ]
        }
      }
    }
  }
]
```
