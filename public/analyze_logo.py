from PIL import Image
img = Image.open("tascorrLogo.png").convert("RGBA")
print(img.size)
