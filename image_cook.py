from PIL import Image, ImageFilter
from dataclasses import dataclass
import os
import base64
from io import BytesIO

def image_to_base64(img):
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue())
    return img_str.decode("utf-8")

@dataclass
class ImageCooker: 
    img: Image
    history: list[Image] = None
    
    def __post_init__(self):
        # all my homies hate field(default_factory=list)
        self.history = []
    
    def save_state(self, new_image):
        self.history.append(self.img)
        self.img = new_image
    
    def jpeg_compress(self, level=30):
        buffered = BytesIO()
        rgb_image = self.img.convert("RGB")
        rgb_image.save(buffered, "JPEG", quality=level)
        self.save_state(Image.open(buffered))
    
    def down_upscale(self, scale):
        original_size = self.img.size
        new_size = (int(component * scale) for component in original_size)
        scaled_down = self.img.resize(new_size)
        scaled_up = scaled_down.resize(original_size)
        self.save_state(scaled_up)
    
    def sharpen(self):
        # self.img = self.img.filter(ImageFilter.SHARPEN)
        sharp_filter = ImageFilter.UnsharpMask(radius=2, percent=550, threshold=3)
        sharpened = self.img.filter(sharp_filter)
        self.save_state(sharpened)
    
    def show(self, *args):
        self.img.show()
    
    def export_base64(self):
        return {
            "result": image_to_base64(self.img),
            "history": [ image_to_base64(image) for image in self.history ]
        }

if __name__ == "__main__":
    img_path = "test.png"
    img = Image.open(img_path)
    cooker = ImageCooker(img)
    # cooker.jpeg_compress(30)
    cooker.jpeg_compress(15)
    cooker.down_upscale(0.1)
    cooker.sharpen()
    # cooker.jpeg_compress(30)
    cooker.show()
