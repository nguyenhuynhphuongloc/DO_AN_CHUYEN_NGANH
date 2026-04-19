# Receipt Layout Refinement Audit

- Receipt set audited: 11
- Correctly segmented (`header` + `items` + `totals` in order): 4/11 (36.4%)
- Receipts requiring synthesized items: 0/11 (0.0%)
- Anchor failures (inferred false positives/negatives): 1/11 (9.1%)
- Model-limited failures: 6/11 (54.5%)
- Rule-limited failures: 1/11 (9.1%)

## Extraction Impact

- Improved fields: none
- Regressed fields: {'transaction_date': 3}

## Per-Receipt Classification

| Receipt | Traits | Layout Used | Blocks | Anchor Status | Synthesis | Classification | Extraction Impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1dac8c84-5d11-450e-851b-051f422a1e51.jpg | long_receipt, clear_item_headers, noisy_ocr, footer_content, strong_right_price_column | True | header, items | correct | False | model_limited | merchant_name:changed, transaction_date:regressed, total_amount:changed |
| 602623e4-2bb7-46ec-bb23-6c0e7f996b67.jpg | clear_item_headers, footer_content, strong_right_price_column | True | header, items, items, items, items, items, items, totals | correct | False | none | merchant_name:changed, transaction_date:unchanged, total_amount:unchanged |
| 643675b3-e16b-4a49-93ea-39ff9b00b120.jpg | long_receipt, clear_item_headers, footer_content, strong_right_price_column | True | header, items, items, totals, metadata, metadata | correct | False | none | merchant_name:unchanged, transaction_date:unchanged, total_amount:unchanged |
| 80b69434-285a-434c-b533-07dad33c3cec.jpg | long_receipt, no_clear_item_headers, noisy_ocr | True | header, items | false_negative | False | model_limited | merchant_name:unchanged, transaction_date:unchanged, total_amount:changed |
| bill.jpg | long_receipt, no_clear_item_headers, footer_content, strong_right_price_column | True | header, header, totals | not_applicable | False | rule_limited | merchant_name:changed, transaction_date:regressed, total_amount:changed |
| z7670539993454_8033d1bcf3da15d165ec144a9a1888b7.jpg | long_receipt, clear_item_headers, noisy_ocr, footer_content | True | header, header, header, items, items, metadata | correct | False | model_limited | merchant_name:unchanged, transaction_date:regressed, total_amount:changed |
| z7732717317782_8fc22dba33e30b9de7a4dc0f9ee16bc2.jpg | long_receipt, no_clear_item_headers, footer_content, strong_right_price_column | True | header, header, items, items, items, items, items, totals, footer | not_applicable | False | none | merchant_name:unchanged, transaction_date:unchanged, total_amount:changed |
| z7732717384556_0d3f37614579df68df8d741c3114ef9c.jpg | long_receipt, clear_item_headers, footer_content, strong_right_price_column | True | header, items, totals, metadata | correct | False | none | merchant_name:changed, transaction_date:unchanged, total_amount:unchanged |
| receipt-blurry.png | short_receipt, no_clear_item_headers | False | - | not_applicable | False | model_limited | merchant_name:unchanged, transaction_date:unchanged, total_amount:unchanged |
| receipt-clear.png | short_receipt, no_clear_item_headers, noisy_ocr | False | - | not_applicable | False | model_limited | merchant_name:unchanged, transaction_date:unchanged, total_amount:unchanged |
| receipt-missing.png | short_receipt, no_clear_item_headers, noisy_ocr | False | header | not_applicable | False | model_limited | merchant_name:unchanged, transaction_date:unchanged, total_amount:unchanged |

## Fallback Safety

- `totals_plus_metadata` -> labels=['totals'] usable=1 expected_runtime_fallback=True
- `all_metadata` -> labels=[] usable=0 expected_runtime_fallback=True

## Recommendations

- Current refinement is not sufficient on its own across the available receipt set; model quality remains the main limiter.
- Model replacement or a receipt-specialized detector should be considered, because failures are more often detector-limited than refinement-limited.

## Notes

- Anchor reliability is inferred from OCR output because the current runtime does not emit explicit anchor-match telemetry.
- `bill.jpg` remains detector-limited: the model returns tiny title blocks plus totals, leaving no meaningful body region for refinement to repair.

## Detailed JSON

```json
{
  "model_path": "/workspace/models/doclayout_yolo_docstructbench_imgsz1024.pt",
  "backend": "vietocr",
  "profile": "fast",
  "summary": {
    "receipt_count": 11,
    "correctly_segmented_count": 4,
    "correctly_segmented_pct": 36.4,
    "requires_synthesis_count": 0,
    "requires_synthesis_pct": 0.0,
    "anchor_failures_count": 1,
    "anchor_failures_pct": 9.1,
    "model_limited_failures_count": 6,
    "model_limited_failures_pct": 54.5,
    "rule_limited_failures_count": 1,
    "rule_limited_failures_pct": 9.1,
    "field_regressions": {
      "transaction_date": 3
    },
    "field_improvements": {}
  },
  "receipts": [
    {
      "image": "1dac8c84-5d11-450e-851b-051f422a1e51.jpg",
      "traits": [
        "long_receipt",
        "clear_item_headers",
        "noisy_ocr",
        "footer_content",
        "strong_right_price_column"
      ],
      "baseline": {
        "line_count": 32,
        "merchant_name": "Hej- Trần Kế Xương",
        "transaction_date": "2026-03-28",
        "total_amount": 77000.0,
        "confidence_score": 0.506
      },
      "layout_refined": {
        "used": true,
        "fallback_reason": null,
        "raw_detections_count": 2,
        "postprocessed_block_count": 2,
        "block_labels": [
          "header",
          "items"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "plain text",
            "bbox": [
              348,
              199,
              1098,
              455
            ],
            "area_ratio": 0.061035,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 1,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              426,
              507,
              1080,
              694
            ],
            "area_ratio": 0.038877,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": "Hej - Trần Kế Xương",
        "transaction_date": null,
        "total_amount": 49.0,
        "confidence_score": 0.4333
      },
      "anchor_analysis": {
        "exact_matches": [
          {
            "line_index": 12,
            "line": "SL/TL",
            "keyword": "sl"
          }
        ],
        "fuzzy_candidates": [
          {
            "line_index": 13,
            "line": "T.TIền",
            "keyword": "thanh tien",
            "similarity": 0.75
          },
          {
            "line_index": 14,
            "line": "Mặt hàng",
            "keyword": "ten hang",
            "similarity": 0.75
          },
          {
            "line_index": 24,
            "line": "Tiền hàng (2)",
            "keyword": "ten hang",
            "similarity": 0.842
          },
          {
            "line_index": 26,
            "line": "THANH TOÁN",
            "keyword": "thanh tien",
            "similarity": 0.8
          }
        ],
        "status": "correct",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": null,
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "changed",
          "transaction_date": "regressed",
          "total_amount": "changed"
        },
        "improved_fields": [],
        "regressed_fields": [
          "transaction_date"
        ]
      },
      "failure_classification": "model_limited",
      "debug_image_path": "/tmp/layout_debug_audit-1dac8c84-5d11-450e-851b-051f422a1e51.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "Hej - Trần Kế Xương\n49 Trần Kế Xương, Phường 7, Quận Phú Nha\nNhuận\n0776172625\nHÓA ĐƠN THANH TOÁN\nSố: 4100044518",
        "layout_used": true,
        "layout_runtime_refinement": {
          "before_count": 2,
          "after_count": 2,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 2
        }
      }
    },
    {
      "image": "602623e4-2bb7-46ec-bb23-6c0e7f996b67.jpg",
      "traits": [
        "clear_item_headers",
        "footer_content",
        "strong_right_price_column"
      ],
      "baseline": {
        "line_count": 24,
        "merchant_name": "Hej- Trần Kế Xương",
        "transaction_date": "2026-04-04",
        "total_amount": 90000.0,
        "confidence_score": 0.552
      },
      "layout_refined": {
        "used": true,
        "fallback_reason": null,
        "raw_detections_count": 9,
        "postprocessed_block_count": 8,
        "block_labels": [
          "header",
          "items",
          "items",
          "items",
          "items",
          "items",
          "items",
          "totals"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "plain text",
            "bbox": [
              383,
              402,
              1122,
              630
            ],
            "area_ratio": 0.053562,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 1,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              416,
              690,
              1083,
              853
            ],
            "area_ratio": 0.034561,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 2,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              227,
              950,
              1268,
              1125
            ],
            "area_ratio": 0.057912,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 3,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              223,
              1190,
              1269,
              1314
            ],
            "area_ratio": 0.041232,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 4,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              206,
              1391,
              1287,
              1454
            ],
            "area_ratio": 0.021649,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 5,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              207,
              1393,
              499,
              1454
            ],
            "area_ratio": 0.005662,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 6,
            "label": "items",
            "raw_label": "plain text+plain text",
            "bbox": [
              196,
              1517,
              1292,
              1672
            ],
            "area_ratio": 0.054003,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 7,
            "label": "totals",
            "raw_label": "plain text",
            "bbox": [
              402,
              1747,
              1018,
              1819
            ],
            "area_ratio": 0.014099,
            "original_label": "totals",
            "refined_label": "totals",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": "Hej-Trần Kế Xương",
        "transaction_date": "2026-04-04",
        "total_amount": 90000.0,
        "confidence_score": 0.552
      },
      "anchor_analysis": {
        "exact_matches": [
          {
            "line_index": 12,
            "line": "SL/TL",
            "keyword": "sl"
          }
        ],
        "fuzzy_candidates": [
          {
            "line_index": 11,
            "line": "Mặt hàng",
            "keyword": "ten hang",
            "similarity": 0.75
          },
          {
            "line_index": 13,
            "line": "T.Tiền",
            "keyword": "thanh tien",
            "similarity": 0.75
          },
          {
            "line_index": 17,
            "line": "Tiền hàng (2)",
            "keyword": "ten hang",
            "similarity": 0.842
          },
          {
            "line_index": 19,
            "line": "THANH TOÁN",
            "keyword": "thanh tien",
            "similarity": 0.8
          }
        ],
        "status": "correct",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": null,
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "changed",
          "transaction_date": "unchanged",
          "total_amount": "unchanged"
        },
        "improved_fields": [],
        "regressed_fields": []
      },
      "failure_classification": "none",
      "debug_image_path": "/tmp/layout_debug_audit-602623e4-2bb7-46ec-bb23-6c0e7f996b67.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "Hej-Trần Kế Xương\nNhuận\n0776172625\nSố: 4100045405\nMang đi\nT83054\nGiờ vào: 13:18 04/04/2026\nGiờ in: 13:18\nThu ngân\nDao\nMặt hàng\nSL/TL",
        "layout_used": true,
        "layout_runtime_refinement": {
          "before_count": 8,
          "after_count": 8,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 8
        }
      }
    },
    {
      "image": "643675b3-e16b-4a49-93ea-39ff9b00b120.jpg",
      "traits": [
        "long_receipt",
        "clear_item_headers",
        "footer_content",
        "strong_right_price_column"
      ],
      "baseline": {
        "line_count": 36,
        "merchant_name": "FamilyMart",
        "transaction_date": "2026-04-12",
        "total_amount": 63000.0,
        "confidence_score": 0.584
      },
      "layout_refined": {
        "used": true,
        "fallback_reason": null,
        "raw_detections_count": 12,
        "postprocessed_block_count": 6,
        "block_labels": [
          "header",
          "items",
          "items",
          "totals",
          "metadata",
          "metadata"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "title",
            "bbox": [
              435,
              402,
              993,
              490
            ],
            "area_ratio": 0.01561,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 1,
            "label": "items",
            "raw_label": "plain text+plain text+plain text+plain text+plain text",
            "bbox": [
              338,
              508,
              1083,
              1603
            ],
            "area_ratio": 0.259328,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 2,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              354,
              1468,
              851,
              1605
            ],
            "area_ratio": 0.021645,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 3,
            "label": "totals",
            "raw_label": "figure_caption",
            "bbox": [
              599,
              1746,
              860,
              1788
            ],
            "area_ratio": 0.003485,
            "original_label": "totals",
            "refined_label": "totals",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 4,
            "label": "metadata",
            "raw_label": "figure",
            "bbox": [
              870,
              1077,
              1069,
              1289
            ],
            "area_ratio": 0.013411,
            "original_label": "metadata",
            "refined_label": "metadata",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 5,
            "label": "metadata",
            "raw_label": "figure",
            "bbox": [
              875,
              1359,
              1068,
              1549
            ],
            "area_ratio": 0.011657,
            "original_label": "metadata",
            "refined_label": "metadata",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": "FamilyMart",
        "transaction_date": "2026-04-12",
        "total_amount": 63000.0,
        "confidence_score": 0.584
      },
      "anchor_analysis": {
        "exact_matches": [
          {
            "line_index": 6,
            "line": "Tên hàng",
            "keyword": "ten hang"
          },
          {
            "line_index": 7,
            "line": "SL Đơn giá Thành tiền",
            "keyword": "sl"
          },
          {
            "line_index": 7,
            "line": "SL Đơn giá Thành tiền",
            "keyword": "don gia"
          },
          {
            "line_index": 7,
            "line": "SL Đơn giá Thành tiền",
            "keyword": "thanh tien"
          }
        ],
        "fuzzy_candidates": [],
        "status": "correct",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": null,
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "unchanged",
          "transaction_date": "unchanged",
          "total_amount": "unchanged"
        },
        "improved_fields": [],
        "regressed_fields": []
      },
      "failure_classification": "none",
      "debug_image_path": "/tmp/layout_debug_audit-643675b3-e16b-4a49-93ea-39ff9b00b120.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "FamilyMart\nVinhomes, 720A Điện Biên Phủ, Phhinh Thạnh Mỹ\nTây, TP HCM\nTel: +84-28-35122130 Fax: - 55122130\nPHÒA ĐƠN BÁN HÀNG\nSỐ HD: 20260406738SYAIODJY7\nTên hàng\nSL Đơn giá Thành tiền\n1T3 Kem Celano Socola\n2\nSTATES\n25,000",
        "layout_used": true,
        "layout_runtime_refinement": {
          "before_count": 6,
          "after_count": 6,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 4
        }
      }
    },
    {
      "image": "80b69434-285a-434c-b533-07dad33c3cec.jpg",
      "traits": [
        "long_receipt",
        "no_clear_item_headers",
        "noisy_ocr"
      ],
      "baseline": {
        "line_count": 78,
        "merchant_name": "MENU",
        "transaction_date": null,
        "total_amount": 936.0,
        "confidence_score": 0.4367
      },
      "layout_refined": {
        "used": true,
        "fallback_reason": null,
        "raw_detections_count": 1,
        "postprocessed_block_count": 2,
        "block_labels": [
          "header",
          "items"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "figure",
            "bbox": [
              208,
              227,
              1376,
              680
            ],
            "area_ratio": 0.168198,
            "original_label": "header",
            "refined_label": "header",
            "is_split": true,
            "is_synthesized": false,
            "split_source_block_id": 0,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 1,
            "label": "items",
            "raw_label": "figure",
            "bbox": [
              208,
              680,
              1376,
              2039
            ],
            "area_ratio": 0.504593,
            "original_label": "header",
            "refined_label": "items",
            "is_split": true,
            "is_synthesized": false,
            "split_source_block_id": 0,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": "MENU",
        "transaction_date": null,
        "total_amount": 30.0,
        "confidence_score": 0.53
      },
      "anchor_analysis": {
        "exact_matches": [],
        "fuzzy_candidates": [
          {
            "line_index": 5,
            "line": "GIÁ",
            "keyword": "d gia",
            "similarity": 0.75
          },
          {
            "line_index": 6,
            "line": "S/L",
            "keyword": "sl",
            "similarity": 0.8
          },
          {
            "line_index": 7,
            "line": "T.TIỀN",
            "keyword": "thanh tien",
            "similarity": 0.75
          }
        ],
        "status": "false_negative",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": [
          "TIỆM HÀU 1992",
          "0936 019 275",
          "Số bàn:",
          "1.HA LƯỚNG",
          "MENU",
          "GIÁ",
          "S/L",
          "T.TIỀN",
          "Nướng",
          "sid",
          "7K",
          "L",
          "s",
          "1",
          "Hàu sống (từ 5 con)",
          "8K",
          "Nướng mỡ hành",
          "8K",
          "2",
          "L",
          "ID",
          "Nướng bơ tỏi",
          "Nướng sa tế",
          "8K",
          "L",
          "I",
          "Nướng tiêu xanh",
          "8K",
          "8K",
          "T",
          "Nướng phô mai",
          "9K",
          "I",
          "Combo ngũ vị (10 con 5 vị)",
          "80K",
          "2.HÀU NƯỚNG CHÉN ĐÁ",
          "Sốt Thái",
          "Trứng cút",
          "15K",
          "I",
          "Phô mai",
          "15K",
          "I",
          "Chén trứng nướng (ko hàu)",
          "12K",
          "15K",
          "3. HÀU HẤP THEO PHẦN",
          "4.SÒ ĐIỆP (phần 4-5 con)",
          "50K",
          "FF",
          "100",
          "Nướng phomai",
          "40K",
          "5. BÁNH MÌ SỐT PHÔ MAI",
          "Nướng mỡ hành",
          "40K",
          "A",
          "6. NƯỚC",
          "15K",
          "1",
          "Sting",
          "Nước suối",
          "12K",
          "I",
          "Coca",
          "15K",
          "15K",
          "Ts",
          "I",
          "7 Up",
          "Bia Saigon xanh",
          "15K",
          "Bia Tiger bạc",
          "18K",
          "25K",
          "Bia Tiger nâu",
          "22K",
          "TỔNG CỘNG"
        ]
      },
      "geometric_fallback_audit": {
        "assessment": "not_applicable"
      },
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "unchanged",
          "transaction_date": "unchanged",
          "total_amount": "changed"
        },
        "improved_fields": [],
        "regressed_fields": []
      },
      "failure_classification": "model_limited",
      "debug_image_path": "/tmp/layout_debug_audit-80b69434-285a-434c-b533-07dad33c3cec.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "MENU\nBEATS\n000000000100\n1.HA LƯỚNG\nTo\nGIÁ\nS/L\nTITTINN\nNướng\n1\nA\nHàu sống (từ 5 con)",
        "layout_used": true,
        "layout_runtime_refinement": {
          "before_count": 1,
          "after_count": 2,
          "split_count": 1,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 2
        }
      }
    },
    {
      "image": "bill.jpg",
      "traits": [
        "long_receipt",
        "no_clear_item_headers",
        "footer_content",
        "strong_right_price_column"
      ],
      "baseline": {
        "line_count": 45,
        "merchant_name": "TOMATHIS ANGON",
        "transaction_date": "2019-03-12",
        "total_amount": 1554053.0,
        "confidence_score": 0.5767
      },
      "layout_refined": {
        "used": true,
        "fallback_reason": null,
        "raw_detections_count": 3,
        "postprocessed_block_count": 3,
        "block_labels": [
          "header",
          "header",
          "totals"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "title",
            "bbox": [
              258,
              180,
              590,
              263
            ],
            "area_ratio": 0.025557,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 1,
            "label": "header",
            "raw_label": "title",
            "bbox": [
              204,
              1048,
              664,
              1147
            ],
            "area_ratio": 0.042237,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 2,
            "label": "totals",
            "raw_label": "plain text",
            "bbox": [
              184,
              881,
              676,
              924
            ],
            "area_ratio": 0.019622,
            "original_label": "totals",
            "refined_label": "totals",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": "JUMATION",
        "transaction_date": null,
        "total_amount": 11554.0,
        "confidence_score": 0.575
      },
      "anchor_analysis": {
        "exact_matches": [],
        "fuzzy_candidates": [],
        "status": "not_applicable",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": {
        "assessment": "not_applicable"
      },
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "changed",
          "transaction_date": "regressed",
          "total_amount": "changed"
        },
        "improved_fields": [],
        "regressed_fields": [
          "transaction_date"
        ]
      },
      "failure_classification": "rule_limited",
      "debug_image_path": "/tmp/layout_debug_audit-bill.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "JUMATION\nSAIGON\nNguyên thi thi thu nha\nTABLE: 440\nTHANKS\nFOR\nCOMING\nAMIGOS\nLI\nSPREPRINTEDES\nTOTALIS\n11554,053",
        "layout_used": true,
        "layout_runtime_refinement": {
          "before_count": 3,
          "after_count": 3,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 3
        }
      }
    },
    {
      "image": "z7670539993454_8033d1bcf3da15d165ec144a9a1888b7.jpg",
      "traits": [
        "long_receipt",
        "clear_item_headers",
        "noisy_ocr",
        "footer_content"
      ],
      "baseline": {
        "line_count": 45,
        "merchant_name": "RAUMAMIX",
        "transaction_date": "2026-03-29",
        "total_amount": 88.0,
        "confidence_score": 0.544
      },
      "layout_refined": {
        "used": true,
        "fallback_reason": null,
        "raw_detections_count": 6,
        "postprocessed_block_count": 6,
        "block_labels": [
          "header",
          "header",
          "header",
          "items",
          "items",
          "metadata"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "abandon",
            "bbox": [
              453,
              307,
              605,
              451
            ],
            "area_ratio": 0.00603,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 1,
            "label": "header",
            "raw_label": "title",
            "bbox": [
              617,
              328,
              1236,
              449
            ],
            "area_ratio": 0.020633,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 2,
            "label": "header",
            "raw_label": "title",
            "bbox": [
              561,
              625,
              1114,
              687
            ],
            "area_ratio": 0.009445,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 3,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              576,
              236,
              1119,
              308
            ],
            "area_ratio": 0.01077,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 4,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              488,
              466,
              1192,
              615
            ],
            "area_ratio": 0.028897,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 5,
            "label": "metadata",
            "raw_label": "figure",
            "bbox": [
              1249,
              243,
              1648,
              2196
            ],
            "area_ratio": 0.214669,
            "original_label": "footer",
            "refined_label": "metadata",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": "RAUMAMIX",
        "transaction_date": null,
        "total_amount": 633934.0,
        "confidence_score": 0.4333
      },
      "anchor_analysis": {
        "exact_matches": [
          {
            "line_index": 13,
            "line": "SL",
            "keyword": "sl"
          },
          {
            "line_index": 14,
            "line": "Đ.Giá",
            "keyword": "d gia"
          },
          {
            "line_index": 28,
            "line": "Số lượng món chính:",
            "keyword": "so luong"
          },
          {
            "line_index": 30,
            "line": "Thành tiền:",
            "keyword": "thanh tien"
          }
        ],
        "fuzzy_candidates": [
          {
            "line_index": 14,
            "line": "Đ.Giá",
            "keyword": "don gia",
            "similarity": 0.833
          },
          {
            "line_index": 15,
            "line": "T.Tiền",
            "keyword": "thanh tien",
            "similarity": 0.75
          }
        ],
        "status": "correct",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": null,
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "unchanged",
          "transaction_date": "regressed",
          "total_amount": "changed"
        },
        "improved_fields": [],
        "regressed_fields": [
          "transaction_date"
        ]
      },
      "failure_classification": "model_limited",
      "debug_image_path": "/tmp/layout_debug_audit-z7670539993454_8033d1bcf3da15d165ec144a9a1888b7.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "A\nranmamix\nRAUMAMIX\nHÓA ĐƠN THANH TOÁN\nMang Về - Mang Về 07\n273 Phan Xích Long, Phường 7, Quận Phú Nhuận\nHotline góp 4H01000 633934\nWebsite: raumamix.com.vn",
        "layout_used": true,
        "layout_runtime_refinement": {
          "before_count": 6,
          "after_count": 6,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 1,
          "usable_block_count": 5
        }
      }
    },
    {
      "image": "z7732717317782_8fc22dba33e30b9de7a4dc0f9ee16bc2.jpg",
      "traits": [
        "long_receipt",
        "no_clear_item_headers",
        "footer_content",
        "strong_right_price_column"
      ],
      "baseline": {
        "line_count": 30,
        "merchant_name": "DOOKKI",
        "transaction_date": "2026-04-13",
        "total_amount": 600480.0,
        "confidence_score": 0.605
      },
      "layout_refined": {
        "used": true,
        "fallback_reason": null,
        "raw_detections_count": 10,
        "postprocessed_block_count": 9,
        "block_labels": [
          "header",
          "header",
          "items",
          "items",
          "items",
          "items",
          "items",
          "totals",
          "footer"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "title",
            "bbox": [
              439,
              496,
              1160,
              597
            ],
            "area_ratio": 0.020061,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 1,
            "label": "header",
            "raw_label": "title",
            "bbox": [
              700,
              759,
              919,
              811
            ],
            "area_ratio": 0.003137,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 2,
            "label": "items",
            "raw_label": "plain text+plain text",
            "bbox": [
              361,
              601,
              1259,
              752
            ],
            "area_ratio": 0.037355,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 3,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              354,
              816,
              1113,
              959
            ],
            "area_ratio": 0.0299,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 4,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              350,
              1000,
              1237,
              1055
            ],
            "area_ratio": 0.013439,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 5,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              349,
              1092,
              1235,
              1147
            ],
            "area_ratio": 0.013424,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 6,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              341,
              1464,
              665,
              1503
            ],
            "area_ratio": 0.003481,
            "original_label": "items",
            "refined_label": "items",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 7,
            "label": "totals",
            "raw_label": "plain text",
            "bbox": [
              589,
              1580,
              1136,
              1689
            ],
            "area_ratio": 0.016425,
            "original_label": "totals",
            "refined_label": "totals",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 8,
            "label": "footer",
            "raw_label": "figure",
            "bbox": [
              2,
              248,
              269,
              2195
            ],
            "area_ratio": 0.143209,
            "original_label": "footer",
            "refined_label": "footer",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": "DOOKKI",
        "transaction_date": "2026-04-13",
        "total_amount": 556000.0,
        "confidence_score": 0.605
      },
      "anchor_analysis": {
        "exact_matches": [],
        "fuzzy_candidates": [],
        "status": "not_applicable",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": {
        "header_height_ratio": 101.0,
        "items_height_ratio": 151.0,
        "gap_to_totals_pixels": 828,
        "assessment": "weak"
      },
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "unchanged",
          "transaction_date": "unchanged",
          "total_amount": "changed"
        },
        "improved_fields": [],
        "regressed_fields": []
      },
      "failure_classification": "none",
      "debug_image_path": "/tmp/layout_debug_audit-z7732717317782_8fc22dba33e30b9de7a4dc0f9ee16bc2.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "DOOKKI\nKorean\nTopokki Buffet\nHÒA ĐON\nphố Hồ Chí Minh\nWebsite: www.dookki.co.kr\nTable: Trệt - 18 (Trệt)\nBill No: 212815\nTime in: 20:08\nTime out: 21:28\nDate: 13/04/2026-20:08 - THU NGÂN VINCOM ĐỒNG KHỞI\nItems",
        "layout_used": true,
        "layout_runtime_refinement": {
          "before_count": 9,
          "after_count": 9,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 9
        }
      }
    },
    {
      "image": "z7732717384556_0d3f37614579df68df8d741c3114ef9c.jpg",
      "traits": [
        "long_receipt",
        "clear_item_headers",
        "footer_content",
        "strong_right_price_column"
      ],
      "baseline": {
        "line_count": 42,
        "merchant_name": "XƯỞNG TRÀ THỦ CÔNG",
        "transaction_date": "2026-04-16",
        "total_amount": 140000.0,
        "confidence_score": 0.5425
      },
      "layout_refined": {
        "used": true,
        "fallback_reason": null,
        "raw_detections_count": 3,
        "postprocessed_block_count": 4,
        "block_labels": [
          "header",
          "items",
          "totals",
          "metadata"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "plain text",
            "bbox": [
              327,
              143,
              1224,
              547
            ],
            "area_ratio": 0.099831,
            "original_label": "header",
            "refined_label": "header",
            "is_split": true,
            "is_synthesized": false,
            "split_source_block_id": 0,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 1,
            "label": "items",
            "raw_label": "plain text",
            "bbox": [
              327,
              547,
              1224,
              1760
            ],
            "area_ratio": 0.299741,
            "original_label": "header",
            "refined_label": "items",
            "is_split": true,
            "is_synthesized": false,
            "split_source_block_id": 0,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 2,
            "label": "totals",
            "raw_label": "plain text",
            "bbox": [
              326,
              1801,
              1208,
              1939
            ],
            "area_ratio": 0.033531,
            "original_label": "totals",
            "refined_label": "totals",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          },
          {
            "index": 3,
            "label": "metadata",
            "raw_label": "figure",
            "bbox": [
              1263,
              243,
              1647,
              2199
            ],
            "area_ratio": 0.206916,
            "original_label": "footer",
            "refined_label": "metadata",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": "XƯỞNG TRÀ",
        "transaction_date": "2026-04-16",
        "total_amount": 140000.0,
        "confidence_score": 0.5425
      },
      "anchor_analysis": {
        "exact_matches": [
          {
            "line_index": 8,
            "line": "Tên hàng",
            "keyword": "ten hang"
          },
          {
            "line_index": 10,
            "line": "SL",
            "keyword": "sl"
          }
        ],
        "fuzzy_candidates": [
          {
            "line_index": 9,
            "line": "Đ.Glá",
            "keyword": "d gia",
            "similarity": 0.8
          },
          {
            "line_index": 34,
            "line": "Tổng tiền hàng:",
            "keyword": "ten hang",
            "similarity": 0.727
          }
        ],
        "status": "correct",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": null,
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "changed",
          "transaction_date": "unchanged",
          "total_amount": "unchanged"
        },
        "improved_fields": [],
        "regressed_fields": []
      },
      "failure_classification": "none",
      "debug_image_path": "/tmp/layout_debug_audit-z7732717384556_0d3f37614579df68df8d741c3114ef9c.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "XƯỞNG TRÀ\nTHỦ CÔNG\nĐT: 0824.904.747\nMinh\nMang về\nHDO39910-51-812\nPHIẾU TÍNH TIỀN\nGiờ vào: 16/04/2026 19:51\nGiờ in: 19:54\nTên hàng\nĐ.Glá\nSL",
        "layout_used": true,
        "layout_runtime_refinement": {
          "before_count": 3,
          "after_count": 4,
          "split_count": 1,
          "synthesized_items": false,
          "demoted_to_metadata": 1,
          "usable_block_count": 3
        }
      }
    },
    {
      "image": "receipt-blurry.png",
      "traits": [
        "short_receipt",
        "no_clear_item_headers"
      ],
      "baseline": {
        "line_count": 1,
        "merchant_name": "Partic",
        "transaction_date": null,
        "total_amount": null,
        "confidence_score": 0.64
      },
      "layout_refined": {
        "used": false,
        "fallback_reason": "no_usable_layout_blocks",
        "raw_detections_count": 0,
        "postprocessed_block_count": 0,
        "block_labels": [],
        "semantic_order_ok": true,
        "blocks": [],
        "field_provenance": {},
        "merchant_name": "Partic",
        "transaction_date": null,
        "total_amount": null,
        "confidence_score": 0.64
      },
      "anchor_analysis": {
        "exact_matches": [],
        "fuzzy_candidates": [],
        "status": "not_applicable",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": {
        "assessment": "not_applicable"
      },
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "unchanged",
          "transaction_date": "unchanged",
          "total_amount": "unchanged"
        },
        "improved_fields": [],
        "regressed_fields": []
      },
      "failure_classification": "model_limited",
      "debug_image_path": "/tmp/layout_debug_audit-receipt-blurry.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "Partic",
        "layout_used": false,
        "layout_runtime_refinement": {
          "before_count": 0,
          "after_count": 0,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 0
        }
      }
    },
    {
      "image": "receipt-clear.png",
      "traits": [
        "short_receipt",
        "no_clear_item_headers",
        "noisy_ocr"
      ],
      "baseline": {
        "line_count": 5,
        "merchant_name": null,
        "transaction_date": null,
        "total_amount": null,
        "confidence_score": 0.0
      },
      "layout_refined": {
        "used": false,
        "fallback_reason": "no_usable_layout_blocks",
        "raw_detections_count": 1,
        "postprocessed_block_count": 0,
        "block_labels": [],
        "semantic_order_ok": true,
        "blocks": [],
        "field_provenance": {},
        "merchant_name": null,
        "transaction_date": null,
        "total_amount": null,
        "confidence_score": 0.0
      },
      "anchor_analysis": {
        "exact_matches": [],
        "fuzzy_candidates": [],
        "status": "not_applicable",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": {
        "assessment": "not_applicable"
      },
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "unchanged",
          "transaction_date": "unchanged",
          "total_amount": "unchanged"
        },
        "improved_fields": [],
        "regressed_fields": []
      },
      "failure_classification": "model_limited",
      "debug_image_path": "/tmp/layout_debug_audit-receipt-clear.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "E\nE\nE\nT\nE",
        "layout_used": false,
        "layout_runtime_refinement": {
          "before_count": 0,
          "after_count": 0,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 0
        }
      }
    },
    {
      "image": "receipt-missing.png",
      "traits": [
        "short_receipt",
        "no_clear_item_headers",
        "noisy_ocr"
      ],
      "baseline": {
        "line_count": 2,
        "merchant_name": null,
        "transaction_date": null,
        "total_amount": null,
        "confidence_score": 0.0
      },
      "layout_refined": {
        "used": false,
        "fallback_reason": "too_few_layout_blocks",
        "raw_detections_count": 2,
        "postprocessed_block_count": 1,
        "block_labels": [
          "header"
        ],
        "semantic_order_ok": true,
        "blocks": [
          {
            "index": 0,
            "label": "header",
            "raw_label": "table_caption",
            "bbox": [
              510,
              131,
              540,
              292
            ],
            "area_ratio": 0.00265,
            "original_label": "header",
            "refined_label": "header",
            "is_split": false,
            "is_synthesized": false,
            "split_source_block_id": null,
            "ocr_line_count": null,
            "ocr_text": null
          }
        ],
        "field_provenance": {},
        "merchant_name": null,
        "transaction_date": null,
        "total_amount": null,
        "confidence_score": 0.0
      },
      "anchor_analysis": {
        "exact_matches": [],
        "fuzzy_candidates": [],
        "status": "not_applicable",
        "reliability_note": "inferred from OCR lines and final blocks; the runtime does not currently expose explicit anchor-match telemetry",
        "ocr_lines_for_failures": []
      },
      "geometric_fallback_audit": {
        "assessment": "not_applicable"
      },
      "synthesized_items_audit": {
        "used": false,
        "bbox": [],
        "contains_item_like_lines": null,
        "ocr_text": []
      },
      "right_side_artifact_audit": {
        "demoted_metadata_blocks": [],
        "count": 0
      },
      "extraction_impact": {
        "field_comparison": {
          "merchant_name": "unchanged",
          "transaction_date": "unchanged",
          "total_amount": "unchanged"
        },
        "improved_fields": [],
        "regressed_fields": []
      },
      "failure_classification": "model_limited",
      "debug_image_path": "/tmp/layout_debug_audit-receipt-missing.jpg",
      "ocr_debug_excerpt": {
        "raw_text_head": "E\ns",
        "layout_used": false,
        "layout_runtime_refinement": {
          "before_count": 1,
          "after_count": 1,
          "split_count": 0,
          "synthesized_items": false,
          "demoted_to_metadata": 0,
          "usable_block_count": 1
        }
      }
    }
  ],
  "fallback_safety": [
    {
      "case": "totals_plus_metadata",
      "refined_labels": [
        "totals"
      ],
      "summary": {
        "before_count": 2,
        "after_count": 1,
        "split_count": 0,
        "synthesized_items": false,
        "demoted_to_metadata": 0,
        "usable_block_count": 1
      },
      "expected_runtime_fallback": true
    },
    {
      "case": "all_metadata",
      "refined_labels": [],
      "summary": {
        "before_count": 2,
        "after_count": 0,
        "split_count": 0,
        "synthesized_items": false,
        "demoted_to_metadata": 0,
        "usable_block_count": 0
      },
      "expected_runtime_fallback": true
    }
  ],
  "recommendations": [
    "Current refinement is not sufficient on its own across the available receipt set; model quality remains the main limiter.",
    "Model replacement or a receipt-specialized detector should be considered, because failures are more often detector-limited than refinement-limited."
  ]
}
```
