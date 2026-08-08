import os
from huggingface_hub import HfApi

def main():
    print("=== HUGGING FACE UPLOAD MODEL ===")
    repo_id = input("Vui lòng nhập Repo ID của bạn (Ví dụ: tathai/ai-recruitment-embedder): ").strip()
    
    if not repo_id or "/" not in repo_id:
        print("Lỗi: Repo ID không hợp lệ. Phải có định dạng username/reponame.")
        return

    # Đường dẫn thư mục model local
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "app", "models", "fine_tuned_embedder"))
    
    if not os.path.exists(model_dir):
        print(f"Lỗi: Không tìm thấy thư mục model tại {model_dir}")
        return
        
    print(f"\nChuẩn bị upload toàn bộ thư mục: {model_dir}")
    print(f"Đích đến trên Hugging Face: https://huggingface.co/{repo_id}")
    print("Đang tải lên (quá trình này có thể mất vài phút tùy vào mạng của bạn vì file nặng >500MB)...")
    
    try:
        api = HfApi()
        api.upload_folder(
            folder_path=model_dir,
            repo_id=repo_id,
            repo_type="model",
            commit_message="Upload fine-tuned embedding model"
        )
        print("\n✅ UPLOAD THÀNH CÔNG TỐT ĐẸP!")
        print(f"Bạn có thể xem model của mình tại: https://huggingface.co/{repo_id}")
    except Exception as e:
        print(f"\n❌ Upload thất bại: {e}")

if __name__ == "__main__":
    main()
