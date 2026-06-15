from PIL import Image

def process(file_path):
    img = Image.open(file_path).convert('RGBA')
    datas = img.getdata()
    
    # 1. Make white transparent
    new_data = []
    left, top, right, bottom = img.width, img.height, 0, 0
    
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = datas[y * img.width + x]
            # Replace white (or near white) with transparent
            if r > 240 and g > 240 and b > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, a))
                if a > 10:
                    left = min(left, x)
                    right = max(right, x)
                    top = min(top, y)
                    bottom = max(bottom, y)
                    
    img.putdata(new_data)
    
    # 2. Heuristic crop: Assume text is the bottom 30% of the content
    # Let's crop out the bottom 30% of the bounding box.
    content_height = bottom - top
    crop_bottom = top + int(content_height * 0.70)
    
    cropped = img.crop((max(0, left - 10), max(0, top - 10), min(img.width, right + 10), crop_bottom))
    cropped.save("tascorrLogo.png", "PNG")
    print("Saved tascorrLogo.png")

process("tassCorr_logo.png")
