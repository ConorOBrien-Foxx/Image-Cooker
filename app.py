from flask import Flask, request, send_from_directory, render_template
import base64
from io import BytesIO

from image_cook import *

app = Flask(__name__,
    static_url_path="", 
    static_folder="web/static",
    template_folder="web/templates"
)

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/test", methods=["POST"])
def test():
    try:
        # Get the base64 string from the form data
        base64_string = request.form.get("base64_string")
        print(base64_string[:26], base64_string[-26:])
        binary_data = base64.b64decode(base64_string)
        image_stream = BytesIO(binary_data)
        image = Image.open(image_stream)
        cooker = ImageCooker(image)
        cooker.down_upscale(0.1)
        cooker.jpeg_compress(0)
        return cooker.export_base64()
    except Exception as e:
        raise e
        return f"Error: {str(e)}"

if __name__ == "__main__":
    app.run(debug=True)
