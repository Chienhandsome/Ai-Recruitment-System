from huggingface_hub import login
import getpass

def main():
    print("=== HUGGING FACE LOGIN ===")
    print("Vui lòng nhập Token (Write) bạn vừa tạo trên trang web.")
    print("Lưu ý: Khi dán (paste) token vào, màn hình sẽ KHÔNG hiện ra chữ gì để bảo mật. Cứ paste và nhấn Enter.")
    token = getpass.getpass("Token của bạn: ")
    
    if not token.strip():
        print("Lỗi: Bạn chưa nhập token.")
        return
        
    try:
        login(token=token.strip(), add_to_git_credential=False)
        print("\n✅ ĐĂNG NHẬP THÀNH CÔNG! Token đã được lưu an toàn.")
    except Exception as e:
        print(f"\n❌ Đăng nhập thất bại: {e}")

if __name__ == "__main__":
    main()
