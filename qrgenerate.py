import qrcode
from PIL import Image, ImageDraw

url = "https://jw-and-yj.github.io/getting-married"

qr = qrcode.QRCode(
    version=1,          # 자동 사이즈
    error_correction=qrcode.constants.ERROR_CORRECT_H,  # H: 최고 수준
    box_size=100,           # 한 칸 픽셀 사이즈
    border=4,              # 외곽 여백(quiet zone)
)

qr.add_data(url)
qr.make(fit=True)

# QR 생성 (골드톤에 어울리는 짙은 갈색)
img = qr.make_image(fill_color="#4d360f", back_color="#ffffff").convert("RGBA")

# 1) 흰색을 투명으로 만들기
datas = img.getdata()
new_data = []
for item in datas:
    if item[0] > 250 and item[1] > 250 and item[2] > 250:
        new_data.append((255, 255, 255, 0))  # 투명
    else:
        new_data.append(item)
img.putdata(new_data)

# 2) 필요하면 여기서 더 키우기 (예: 2000x2000)
w, h = img.size
target = 2000  # 원하는 해상도 (최대 변 길이 기준)
scale = target // max(w, h)
if scale > 1:
    img = img.resize((w * scale, h * scale), Image.NEAREST)
    w, h = img.size  # 크기 갱신

# 3) 가운데 구멍(투명 영역) 만들기
#    hole_ratio: QR 전체 한 변 대비 구멍 한 변 비율 (0.0 ~ 1.0)
hole_ratio = 0.25  # 대략 20~25% 추천

hole_w = int(w * hole_ratio)
hole_h = int(h * hole_ratio)

left   = (w - hole_w) // 2
top    = (h - hole_h) // 2
right  = left + hole_w
bottom = top + hole_h

draw = ImageDraw.Draw(img)
draw.rectangle([left, top, right, bottom], fill=(0, 0, 0, 0))  # 완전 투명 사각형

img.save("qrcode_center_hole.png") 