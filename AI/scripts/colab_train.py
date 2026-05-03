# --- SCRIPT HUẤN LUYỆN TRÊN GOOGLE COLAB ---
# Hướng dẫn:
# 1. Truy cập https://colab.research.google.com
# 2. Tạo Notebook mới. Vào Runtime -> Change runtime type -> Chọn T4 GPU.
# 3. Upload file `financial_training_data.jsonl` vào Colab.
# 4. Copy toàn bộ code dưới đây dán vào 1 ô (cell) và bấm chạy (Play).
# 5. Đợi khoảng 30-40 phút, tải thư mục `fin_advisor_lora` về máy.

import os
# Cài đặt thư viện Unsloth (Chuyên dùng để train nhanh trên Colab)
os.system("pip install unsloth")
os.system("pip uninstall unsloth -y && pip install --upgrade --no-cache-dir 'git+https://github.com/unslothai/unsloth.git'")

from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# 1. Cấu hình mô hình
max_seq_length = 2048
dtype = None # Auto detection
load_in_4bit = True

# Tải mô hình Qwen 3B
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "Qwen/Qwen2.5-3B-Instruct",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 2. Gắn LoRA Adapters (Chỉ train 1% trọng số)
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, 
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",    
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# 3. Tải bộ dữ liệu
dataset = load_dataset("json", data_files="financial_training_data.jsonl", split="train")

# 4. Cấu hình Huấn luyện
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False, # Bật nếu data ngắn để train nhanh hơn
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60, # Tăng số này lên 200-300 nếu data lớn
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

# 5. Bắt đầu train
print("🚀 Bắt đầu huấn luyện...")
trainer_stats = trainer.train()

# 6. Lưu mô hình (LoRA adapters)
save_path = "fin_advisor_lora"
model.save_pretrained(save_path)
tokenizer.save_pretrained(save_path)

print(f"✅ Đã lưu trọng số huấn luyện tại thư mục: {save_path}")
print("📦 Hãy nén thư mục này lại (zip), tải về máy và bỏ vào thư mục AI/models/ của dự án FinTrack.")
