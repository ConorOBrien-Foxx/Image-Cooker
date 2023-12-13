from PIL import Image, ImageFilter, ImageOps
from dataclasses import dataclass
import os
import base64
from io import BytesIO
from random import Random

def image_to_base64(img):
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue())
    return img_str.decode("utf-8")

CommandToInstruction = {
    "jpeg": "jpeg_compress",
    "scale": "down_upscale",
    "invert": "invert",
    "flip": "flip",
    "mirror": "mirror",
    "posterize": "posterize",
    "solarize": "solarize",
    # "slur": "slur",
    
    # TODO: aliases?
    "abber": "chromatic_abberation",
    "abberate": "chromatic_abberation",
    "sharpen": "sharpen",
}

@dataclass
class ImageCooker: 
    img: Image
    seed: int = None
    history: list[Image] = None
    rng: Random = None
    
    def __post_init__(self):
        # all my homies hate field(default_factory=list)
        self.history = []
        self.rng = Random(self.seed)
    
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
    
    def sharpen(self, radius=2, percent=550, threshold=3):
        # self.img = self.img.filter(ImageFilter.SHARPEN)
        sharp_filter = ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=threshold)
        sharpened = self.img.filter(sharp_filter)
        self.save_state(sharpened)
        
    def invert(self):
        self.save_state(ImageOps.invert(self.img))
        
    def flip(self):
        self.save_state(ImageOps.flip(self.img))
        
    def mirror(self):
        self.save_state(ImageOps.mirror(self.img))
        
    def posterize(self, bits=1):
        self.save_state(ImageOps.posterize(self.img, bits))
        
    def solarize(self, threshold=128):
        self.save_state(ImageOps.solarize(self.img, threshold))
    
    # very slow
    def slur(self, percent=0.7):
        slurred = self.img.copy()
        width, height = slurred.size
        for y in range(height):
            for x in range(width):
                if self.rng.random() > percent:
                    # this pixel is safee
                    continue
                
                y_up = height - 1 if y == 0 else y - 1
                x_up = x
                if self.rng.random() <= 0.8:
                    x_up += self.rng.choice((-1, 1))
                if x_up < 0:
                    x_up = width - 1
                if x_up >= width:
                    x_up = 0
                
                slurred.putpixel((x, y), self.img.getpixel((x_up, y_up)))
        
        self.save_state(slurred)
    
    def chromatic_abberation(self, displacement=4):
        components = list(self.img.split())
        # red channel
        red_channel = components[0]
        red_image = Image.merge("RGB", (red_channel, Image.new("L", red_channel.size), Image.new("L", red_channel.size)))
        squished_red = red_image.resize((red_image.width - displacement, red_image.height))
        # non-scaling resize
        new_component = Image.new(self.img.mode, self.img.size)
        new_component.paste(squished_red.getchannel(0), (displacement, 0))
        components[0] = new_component.getchannel(0)
        # blue channel
        blue_channel = components[2]
        blue_image = Image.merge("RGB", (Image.new("L", blue_channel.size), Image.new("L", blue_channel.size), blue_channel))
        squished_blue = blue_image.resize((blue_image.width - displacement, blue_image.height))
        # non-scaling resize
        new_component = Image.new(self.img.mode, self.img.size)
        new_component.paste(squished_blue.getchannel(2), (0, 0))
        components[2] = new_component.getchannel(2)
        abberated = Image.merge(self.img.mode, components)
        self.save_state(abberated)
    
    def show(self, *args):
        self.img.show()
    
    def parse_params(self, params):
        return [
            float(param) if "." in param else int(param)
            if param[0].isdigit() or param[0] == "." and param[1].isDigit()
            else param
            for param in params
        ]
    
    def run_instruction(self, line):
        if not line:
            return
        instruction, *params = line.split()
        if instruction not in CommandToInstruction:
            print("Unknown instruction:", instruction)
            # TODO: report error to user
            return
        params = self.parse_params(params)
        print(instruction, params)
        getattr(self, CommandToInstruction[instruction])(*params)
    
    def run(self, code):
        for line in code.split("\n"):
            self.run_instruction(line)
    
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
