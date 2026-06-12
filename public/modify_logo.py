from PIL import Image
import sys

def modify(file_path):
    try:
        img = Image.open(file_path).convert('RGBA')
        datas = img.getdata()

        # Find non-white bounding box
        left, top, right, bottom = img.width, img.height, 0, 0
        for y in range(img.height):
            for x in range(img.width):
                r, g, b, a = datas[y * img.width + x]
                if a > 10 and (r < 240 or g < 240 or b < 240):
                    left = min(left, x)
                    right = max(right, x)
                    top = min(top, y)
                    bottom = max(bottom, y)
        
        print(f"File: {file_path}, Size: {img.width}x{img.height}, BBox: left={left}, top={top}, right={right}, bottom={bottom}")
        
        # Determine the horizontal gap to separate text and logo
        # The logo is likely in the center, and text might be below or right.
        row_density = [0] * img.height
        for y in range(img.height):
            for x in range(left, right + 1):
                r, g, b, a = datas[y * img.width + x]
                if a > 10 and (r < 240 or g < 240 or b < 240):
                    row_density[y] += 1
        
        gaps = []
        in_gap = False
        gap_start = 0
        for y in range(top, bottom + 1):
            if row_density[y] == 0:
                if not in_gap:
                    in_gap = True
                    gap_start = y
            else:
                if in_gap:
                    in_gap = False
                    gaps.append((gap_start, y - 1))
        
        print(f"Gaps found: {gaps}")
        
        # Assume the largest gap separates logo from text. We'll keep the upper part (logo)
        crop_bottom = bottom
        if gaps:
            largest_gap = max(gaps, key=lambda g: g[1] - g[0])
            crop_bottom = largest_gap[0] - 1
            print(f"Cropping bottom to {crop_bottom} based on largest gap.")
        
        # Now convert to transparent background and crop
        new_data = []
        for item in datas:
            # change white (also shades of white)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
                
        img.putdata(new_data)
        
        # Crop the image to just the logo (discard text below the gap)
        # Also let's re-evaluate the left/right bounds for the top part
        new_left, new_right = img.width, 0
        for y in range(top, crop_bottom + 1):
            for x in range(img.width):
                r, g, b, a = new_data[y * img.width + x]
                if a > 10:
                    new_left = min(new_left, x)
                    new_right = max(new_right, x)

        cropped_img = img.crop((max(0, new_left - 10), max(0, top - 10), min(img.width, new_right + 10), min(img.height, crop_bottom + 10)))
        
        out_name = "clean_" + file_path
        cropped_img.save(out_name, "PNG")
        print(f"Saved {out_name}")
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

modify("tassCorr_logo.png")
